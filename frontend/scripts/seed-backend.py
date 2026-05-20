#!/usr/bin/env python
import argparse
import os
import sys
from pathlib import Path

def configure_django() -> None:
    script_path = Path(__file__).resolve()
    root_dir = script_path.parents[2]
    backend_dir = root_dir / "backend"

    sys.path.insert(0, str(backend_dir))
    os.chdir(backend_dir)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnlab_platform.settings")

    try:
        import django
    except Exception as exc:
        print(f"[ERROR] Django not available: {exc}")
        sys.exit(1)

    try:
        django.setup()
    except ModuleNotFoundError as exc:
        print(f"[ERROR] Missing backend dependency: {exc.name}")
        requirements_path = backend_dir / "requirements.txt"
        print("[HINT] Install backend requirements:")
        print(f"  {sys.executable} -m pip install -r {requirements_path}")
        sys.exit(1)
    except Exception as exc:
        print("[ERROR] Failed to initialize Django:")
        print(str(exc))
        sys.exit(1)

def seed_data():
    return [
        {
            "topic": "Logic",
            "description": "Propositions, connectives, and logical reasoning.",
            "subtopics": [
                {
                    "name": "Propositions and Connectives",
                    "description": "Basic logical operators and truth values.",
                    "questions": [
                        {
                            "text": "Which connective represents implication 'if p then q'?",
                            "choices": ["p and q", "p or q", "not p", "p -> q"],
                            "correct_answer_index": 3,
                            "tier": 1,
                        },
                        {
                            "text": "The negation of 'p and q' is equivalent to:",
                            "choices": ["not p and not q", "not p or not q", "p or q", "p -> q"],
                            "correct_answer_index": 1,
                            "tier": 2,
                        },
                    ],
                },
                {
                    "name": "Quantifiers",
                    "description": "Universal and existential quantification.",
                    "questions": [
                        {
                            "text": "The statement 'For all x, P(x)' uses which quantifier?",
                            "choices": ["exists", "for all", "unique", "none"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                        {
                            "text": "The negation of 'there exists x such that P(x)' is:",
                            "choices": [
                                "for all x, not P(x)",
                                "for all x, P(x)",
                                "there exists x, not P(x)",
                                "not for all x, P(x)",
                            ],
                            "correct_answer_index": 0,
                            "tier": 2,
                        },
                    ],
                },
            ],
        },
        {
            "topic": "Sets",
            "description": "Set notation and operations.",
            "subtopics": [
                {
                    "name": "Set Operations",
                    "description": "Union, intersection, and difference.",
                    "questions": [
                        {
                            "text": "A union B contains elements that are in:",
                            "choices": ["A only", "B only", "A and B", "A or B"],
                            "correct_answer_index": 3,
                            "tier": 1,
                        },
                        {
                            "text": "A intersect B contains elements that are in:",
                            "choices": ["A or B", "A only", "B only", "A and B"],
                            "correct_answer_index": 3,
                            "tier": 1,
                        },
                    ],
                },
                {
                    "name": "Set Identities",
                    "description": "Common equalities used in set algebra.",
                    "questions": [
                        {
                            "text": "A union empty set equals:",
                            "choices": ["empty set", "A", "universal set", "A complement"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                        {
                            "text": "A intersect A equals:",
                            "choices": ["empty set", "A", "A complement", "universal set"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                    ],
                },
            ],
        },
        {
            "topic": "Relations",
            "description": "Properties of relations and ordered pairs.",
            "subtopics": [
                {
                    "name": "Equivalence Relations",
                    "description": "Reflexive, symmetric, and transitive properties.",
                    "questions": [
                        {
                            "text": "An equivalence relation is:",
                            "choices": [
                                "reflexive, symmetric, transitive",
                                "reflexive, antisymmetric, transitive",
                                "symmetric, antisymmetric, transitive",
                                "reflexive, symmetric, antisymmetric",
                            ],
                            "correct_answer_index": 0,
                            "tier": 1,
                        },
                        {
                            "text": "The equivalence class of a is the set of:",
                            "choices": [
                                "all elements related to a",
                                "all elements not related to a",
                                "all elements greater than a",
                                "all elements less than a",
                            ],
                            "correct_answer_index": 0,
                            "tier": 1,
                        },
                    ],
                },
                {
                    "name": "Partial Orders",
                    "description": "Ordered sets and comparability.",
                    "questions": [
                        {
                            "text": "A partial order is:",
                            "choices": [
                                "reflexive, antisymmetric, transitive",
                                "reflexive, symmetric, transitive",
                                "irreflexive, transitive, symmetric",
                                "antisymmetric, symmetric, transitive",
                            ],
                            "correct_answer_index": 0,
                            "tier": 1,
                        },
                        {
                            "text": "In a poset, two elements are comparable if:",
                            "choices": [
                                "a = b",
                                "a <= b or b <= a",
                                "a < b only",
                                "a and b are unrelated",
                            ],
                            "correct_answer_index": 1,
                            "tier": 2,
                        },
                    ],
                },
            ],
        },
        {
            "topic": "Combinatorics",
            "description": "Counting principles and arrangements.",
            "subtopics": [
                {
                    "name": "Permutations",
                    "description": "Ordered arrangements of objects.",
                    "questions": [
                        {
                            "text": "Number of permutations of n distinct items is:",
                            "choices": ["n", "n^2", "n!", "2^n"],
                            "correct_answer_index": 2,
                            "tier": 1,
                        },
                        {
                            "text": "Number of permutations of 5 items taken 2 at a time is:",
                            "choices": ["10", "20", "25", "5"],
                            "correct_answer_index": 1,
                            "tier": 2,
                        },
                    ],
                },
                {
                    "name": "Combinations",
                    "description": "Unordered selections of objects.",
                    "questions": [
                        {
                            "text": "Number of combinations of n items taken k at a time is:",
                            "choices": ["n!/(n-k)!", "n!/(k!(n-k)!)", "k!/(n-k)!", "n^k"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                        {
                            "text": "How many ways to choose 2 items from 5?",
                            "choices": ["5", "10", "20", "25"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                    ],
                },
            ],
        },
        {
            "topic": "Graph Theory",
            "description": "Graphs, degrees, and trees.",
            "subtopics": [
                {
                    "name": "Graphs and Degrees",
                    "description": "Basic graph properties and degree counts.",
                    "questions": [
                        {
                            "text": "In an undirected graph, the sum of degrees equals:",
                            "choices": [
                                "number of vertices",
                                "number of edges",
                                "2 * number of edges",
                                "number of edges squared",
                            ],
                            "correct_answer_index": 2,
                            "tier": 1,
                        },
                        {
                            "text": "A graph with no edges is called:",
                            "choices": ["complete graph", "null graph", "tree", "cycle"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                    ],
                },
                {
                    "name": "Trees",
                    "description": "Acyclic connected graphs.",
                    "questions": [
                        {
                            "text": "A tree with n vertices has how many edges?",
                            "choices": ["n", "n-1", "n+1", "2n"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                        {
                            "text": "A connected graph with no cycles is a:",
                            "choices": ["path", "tree", "cycle", "complete graph"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                    ],
                },
            ],
        },
        {
            "topic": "Number Theory",
            "description": "Divisibility, gcd, and modular arithmetic.",
            "subtopics": [
                {
                    "name": "Divisibility and GCD",
                    "description": "Divisibility rules and greatest common divisor.",
                    "questions": [
                        {
                            "text": "gcd(12, 18) is:",
                            "choices": ["6", "12", "18", "3"],
                            "correct_answer_index": 0,
                            "tier": 1,
                        },
                        {
                            "text": "If a divides b, then b = a*k for some:",
                            "choices": ["integer k", "real k", "prime k", "negative k only"],
                            "correct_answer_index": 0,
                            "tier": 1,
                        },
                    ],
                },
                {
                    "name": "Modular Arithmetic",
                    "description": "Remainders and congruences.",
                    "questions": [
                        {
                            "text": "17 mod 5 equals:",
                            "choices": ["1", "2", "3", "4"],
                            "correct_answer_index": 1,
                            "tier": 1,
                        },
                        {
                            "text": "If a = b (mod m), then m divides:",
                            "choices": ["a + b", "a - b", "a * b", "a / m"],
                            "correct_answer_index": 1,
                            "tier": 2,
                        },
                    ],
                },
            ],
        },
    ]

def main() -> int:
    parser = argparse.ArgumentParser(description="Seed LearnLab sample topics and questions.")
    parser.add_argument("--reset", action="store_true", help="Delete existing topics and questions first.")
    args = parser.parse_args()

    configure_django()

    from topics.models import Topic, Subtopic
    from practice.models import Question

    if args.reset:
        Question.objects.all().delete()
        Subtopic.objects.all().delete()
        Topic.objects.all().delete()
        print("[WARN] Existing topics, subtopics, and questions deleted.")

    created_topics = 0
    created_subtopics = 0
    created_questions = 0

    for topic_data in seed_data():
        topic, topic_created = Topic.objects.get_or_create(
            name=topic_data["topic"],
            defaults={"description": topic_data["description"]},
        )
        if topic_created:
            created_topics += 1

        for subtopic_data in topic_data["subtopics"]:
            subtopic, subtopic_created = Subtopic.objects.get_or_create(
                topic=topic,
                name=subtopic_data["name"],
                defaults={"description": subtopic_data["description"]},
            )
            if subtopic_created:
                created_subtopics += 1

            for q_data in subtopic_data["questions"]:
                question, question_created = Question.objects.get_or_create(
                    subtopic=subtopic,
                    text=q_data["text"],
                    defaults={
                        "choices": q_data["choices"],
                        "correct_answer_index": q_data["correct_answer_index"],
                        "tier": q_data.get("tier", 1),
                    },
                )
                if question_created:
                    created_questions += 1

    print("\nSeeding complete")
    print(f"Topics created: {created_topics}")
    print(f"Subtopics created: {created_subtopics}")
    print(f"Questions created: {created_questions}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
