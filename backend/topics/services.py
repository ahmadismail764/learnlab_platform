import os
import re
import json
import time
import random
import fitz  # PyMuPDF
from google import genai

from topics.models import Topic, Subtopic
from practice.models import Question


def _get_all_existing_prefixes():
    """Load short prefixes of all existing questions to avoid token waste on duplicates."""
    return set(Question.objects.values_list('text', flat=True))


def _get_existing_hierarchy():
    """Fetch existing topics and subtopics to encourage the AI to reuse them."""
    hierarchy = {}
    for subtopic in Subtopic.objects.select_related('topic').all():
        t_name = subtopic.topic.name
        if t_name not in hierarchy:
            hierarchy[t_name] = []
        hierarchy[t_name].append(subtopic.name)
    return hierarchy


def extract_questions_from_pdf_stream(pdf_bytes, num_questions=None):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")

    client = genai.Client(api_key=api_key)

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Failed to open PDF stream: {e}")

    # Extract book title from PDF metadata, fall back to a generic label
    metadata = doc.metadata or {}
    book_title = metadata.get('title') or metadata.get('subject') or 'this textbook'
    book_title = book_title.strip() or 'this textbook'

    # Patterns for detecting chapter headings and exercise section headers
    chapter_pattern = re.compile(r'(?m)^CHAPTER\s+\w+\s*\n(.+)', re.IGNORECASE)
    # Exercise set header: "A. Title of Set" or "B. Another Title"
    exercise_set_pattern = re.compile(r'(?m)^([A-Z])\.\s+(.{5,60})\n')
    # The page-level "EXERCISES" header that signals exercise pages (case-insensitive for Rosen)
    exercise_page_pattern = re.compile(r'(?m)^(?:\d+\.\d+\s+)?EXERCISES\s*$', re.IGNORECASE)

    # Collect exercise blocks: each block = (chapter_title, set_title, raw_text)
    exercise_blocks = []
    current_chapter = "Unknown Chapter"

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()

        # Update chapter title whenever we see a chapter heading
        m = chapter_pattern.search(text)
        if m:
            current_chapter = m.group(1).strip()

        # Only process pages that have an "EXERCISES" header
        ex_match = exercise_page_pattern.search(text)
        if not ex_match:
            continue

        # Split the page into exercise sets by the letter headings (A., B., C. ...)
        set_matches = list(exercise_set_pattern.finditer(text))
        if set_matches:
            for i, sm in enumerate(set_matches):
                set_letter = sm.group(1)
                set_title = sm.group(2).strip()
                start = sm.end()
                end = set_matches[i + 1].start() if i + 1 < len(set_matches) else len(text)
                block_text = text[start:end].strip()

                if len(block_text) > 30:
                    # Break long blocks into 3000-character chunks to avoid hitting AI output limits
                    # while ensuring we don't truncate and lose questions at the bottom of the page.
                    chunk_size = 3000
                    for i in range(0, len(block_text), chunk_size):
                        chunk = block_text[i:i+chunk_size]
                        if len(chunk) > 30:
                            exercise_blocks.append((current_chapter, f"{set_letter}. {set_title} (Pt {i//chunk_size + 1})", chunk))
        else:
            # Fallback for books like Rosen Discrete Math which just list numbered questions
            # Grab all text after the "Exercises" heading
            block_text = text[ex_match.end():].strip()
            if len(block_text) > 100:
                chunk_size = 3000
                for i in range(0, len(block_text), chunk_size):
                    chunk = block_text[i:i+chunk_size]
                    if len(chunk) > 30:
                        exercise_blocks.append((current_chapter, f"Chapter Exercises (Pt {i//chunk_size + 1})", chunk))

    if not exercise_blocks:
        return []

    # Shuffle the blocks so that multiple runs extract from different parts of the book
    # instead of wasting tokens re-processing the first few chapters over and over.
    random.shuffle(exercise_blocks)

    # Load existing question texts to skip duplicates without calling AI
    existing_texts = _get_all_existing_prefixes()

    results = []
    questions_created = 0

    for chapter, set_title, block_text in exercise_blocks:
        if num_questions is not None and questions_created >= num_questions:
            break

        existing_hierarchy = _get_existing_hierarchy()
        hierarchy_str = json.dumps(existing_hierarchy, indent=2)

        # Concise prompt: pass the whole exercise set, let AI extract all questions in one call
        remaining = (num_questions - questions_created) if num_questions is not None else 10
        prompt = (
            f'You are a subject-matter expert. This is exercise set "{set_title}" from the chapter "{chapter}" '
            f'of "{book_title}".\n\n'
            f'Exercise block:\n"""\n{block_text}\n"""\n\n'
            f'Extract up to {remaining} questions from this block.\n\n'
            f'CRITICAL RULES:\n'
            f'1. ONLY extract pure subject-matter problems (math, logic, CS, etc.).\n'
            f'2. IGNORE and SKIP any meta-questions about the textbook itself (e.g. "What are Review Questions?", "Where are Writing Projects?", "How are sections marked?").\n'
            f'3. Categorize each question into a "topic" and "subtopic". Try your best to use the existing hierarchy:\n'
            f'{hierarchy_str}\n'
            f'Only invent a new topic or subtopic if the question absolutely does not fit into the existing ones above.\n\n'
            f'For each extracted question, return a JSON array element:\n'
            '{"topic": string, "subtopic": string, '
            '"tier": 1|2|3 (1=Recall 2=Apply 3=Prove/Synthesize), '
            '"text": string (complete self-contained question), '
            '"choices": [4 strings], "correct_answer_index": 0|1|2|3}\n\n'
            'Return ONLY a valid JSON array. No markdown, no explanation.'
        )

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )

            response_text = response.text.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            questions_data = json.loads(response_text.strip())
            if not isinstance(questions_data, list):
                questions_data = [questions_data]

            for data in questions_data:
                q_text = data.get('text', '').strip()
                if not q_text or q_text in existing_texts:
                    continue

                topic_obj, _ = Topic.objects.get_or_create(name=data['topic'])
                subtopic_obj, _ = Subtopic.objects.get_or_create(topic=topic_obj, name=data['subtopic'])

                q, created = Question.objects.get_or_create(
                    subtopic=subtopic_obj,
                    text=q_text,
                    defaults={
                        'tier': data['tier'],
                        'choices': data['choices'],
                        'correct_answer_index': data['correct_answer_index']
                    }
                )
                if created:
                    existing_texts.add(q_text)
                    results.append(q)
                    questions_created += 1

                if num_questions is not None and questions_created >= num_questions:
                    break

        except Exception as e:
            print(f"Error processing block '{set_title}': {e}")
            # If we hit an API error (like rate limits), wait a bit longer before trying again
            time.sleep(10)
            continue
            
        # Standard delay between successful chunks
        time.sleep(3)

    return results
