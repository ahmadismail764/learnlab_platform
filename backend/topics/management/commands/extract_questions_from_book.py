import os
from django.core.management.base import BaseCommand
from topics.services import extract_questions_from_pdf_stream

class Command(BaseCommand):
    help = 'Extracts questions from a PDF textbook using Regex and Gemini AI'

    def add_arguments(self, parser):
        parser.add_argument('pdf_path', type=str, help='Path to the PDF textbook')
        parser.add_argument('--num-questions', type=int, default=None, help='Maximum number of questions to extract')

    def handle(self, *args, **options):
        pdf_path = options['pdf_path']
        num_questions = options['num_questions']
        
        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f"PDF file not found at {pdf_path}"))
            return

        self.stdout.write(f"Opening PDF: {pdf_path}")
        try:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
                
            results = extract_questions_from_pdf_stream(pdf_bytes, num_questions=num_questions)
            
            self.stdout.write(self.style.SUCCESS(f"Successfully processed and inserted {len(results)} questions!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))

        self.stdout.write(self.style.SUCCESS("\nPipeline execution finished!"))
