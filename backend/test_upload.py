import requests
import sys

# 1. Login to get the JWT token
login_url = "http://127.0.0.1:8000/api/v1/auth/login/"
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("Logging in...")
response = requests.post(login_url, json=login_data)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    sys.exit(1)

token = response.json().get("access")
print("Successfully got JWT Token!")

# 2. Upload the PDF
upload_url = "http://127.0.0.1:8000/api/v1/extract-questions/"
headers = {
    "Authorization": f"Bearer {token}"
}

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(BASE_DIR, "topics", "management", "books", "[Book] Discrete mathematics and its applications (2019)_0.pdf")
print(f"\nUploading {pdf_path}...")

with open(pdf_path, "rb") as f:
    files = {"pdf_file": f}
    data = {"num_questions":4000}
    upload_response = requests.post(upload_url, headers=headers, files=files, data=data)

print(f"\nStatus Code: {upload_response.status_code}")
print("Response JSON:")
try:
    print(upload_response.json())
except Exception:
    print(upload_response.text)
