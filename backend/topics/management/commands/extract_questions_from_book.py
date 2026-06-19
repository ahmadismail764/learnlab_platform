import os
import re
import json
import fitz  # PyMuPDF
from django.core.management.base import BaseCommand
from google import genai
from google.genai import types

from topics.models import Topic, Subtopic
from practice.models import Question

class Command(BaseCommand):
    help = 'Extracts questions from a PDF textbook using Regex and Gemini AI'

    def add_arguments(self, parser):
        parser.add_argument('pdf_path', type=str, help='Path to the PDF textbook')

    def handle(self, *args, **options):
        pdf_path = options['pdf_path']
        api_key = os.environ.get("GEMINI_API_KEY")
        
        if not api_key:
            self.stdout.write(self.style.ERROR("GEMINI_API_KEY not found in environment variables."))
            return
            
        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f"PDF file not found at {pdf_path}"))
            return

        # Initialize Gemini Client
        client = genai.Client(api_key=api_key)
        
        self.stdout.write(f"Opening PDF: {pdf_path}")
        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to open PDF: {e}"))
            return
            
        # Simplified regex for this proof of concept
        # Looks for "Exercises" followed by numbers like "1.", "2."
        exercise_pattern = re.compile(r'(?i)exercises?|problems?')
        question_pattern = re.compile(r'\n\s*(\d+)\.\s+(.*?)(?=\n\s*\d+\.\s+|$)', re.DOTALL)

        extracted_questions = []
        current_chapter_title = "Unknown Chapter"
        in_exercise_section = False
        text_buffer = ""

        # Scan the first 20 pages for testing to avoid burning credits/time
        max_pages = min(20, len(doc))
        self.stdout.write(f"Scanning first {max_pages} pages for exercises...")

        for page_num in range(max_pages):
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Very basic heuristic for chapters
            if "Chapter" in text[:100]:
                lines = text.split('\n')
                for line in lines:
                    if "Chapter" in line:
                        current_chapter_title = line.strip()
                        break

            if exercise_pattern.search(text):
                in_exercise_section = True
                
            if in_exercise_section:
                text_buffer += "\n" + text

        # Extract individual questions from the buffer
        matches = question_pattern.findall(text_buffer)
        for match in matches:
            q_num, q_text = match
            # Clean up the text
            q_text = q_text.strip().replace('\n', ' ')
            if len(q_text) > 10:  # Ignore tiny artifacts
                extracted_questions.append((current_chapter_title, q_text))
                
        if not extracted_questions:
            self.stdout.write(self.style.WARNING("No questions found using Regex in the first 20 pages."))
            # For demonstration, let's create a dummy extracted question from Pinter Algebra
            extracted_questions.append(
                ("Chapter 3: Groups", "Show that the set of integers with addition is a group.")
            )

        self.stdout.write(self.style.SUCCESS(f"Extracted {len(extracted_questions)} raw questions via Regex."))
        
        # Process maximum 3 questions to save time during this demo
        for chapter, q_text in extracted_questions[:3]:
            self.stdout.write(f"Processing question via Gemini: '{q_text[:30]}...'")
            
            prompt = f"""
            You are a discrete math and algebra expert. Analyze this question from the textbook chapter "{chapter}".
            Question: "{q_text}"
            
            Return ONLY a valid JSON object matching this schema:
            {{
                "topic": "The broad topic name (e.g., Abstract Algebra)",
                "subtopic": "The specific subtopic (e.g., Groups)",
                "tier": 1, 2, or 3 (1=Concept, 2=Application, 3=Synthesis),
                "text": "The re-formatted, clear question text",
                "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
                "correct_answer_index": 0, 1, 2, or 3
            }}
            Make sure the question is multiple choice, and provide 4 plausible choices.
            """
            
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                )
                
                # Extract JSON from response (handling markdown blocks if present)
                response_text = response.text
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                    
                data = json.loads(response_text.strip())
                
                # Insert into DB
                topic_obj, _ = Topic.objects.get_or_create(name=data['topic'])
                subtopic_obj, _ = Subtopic.objects.get_or_create(topic=topic_obj, name=data['subtopic'])
                
                Question.objects.get_or_create(
                    subtopic=subtopic_obj,
                    text=data['text'],
                    defaults={
                        'tier': data['tier'],
                        'choices': data['choices'],
                        'correct_answer_index': data['correct_answer_index']
                    }
                )
                self.stdout.write(self.style.SUCCESS(f"Successfully inserted: {data['text']}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Gemini API or JSON Parsing Error: {e}"))
                self.stdout.write(f"Raw Response: {response.text if 'response' in locals() else 'None'}")

        self.stdout.write(self.style.SUCCESS("\nPipeline execution finished!"))
