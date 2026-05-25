#!/usr/bin/env python
"""Create test accounts for LearnLab."""
import os, sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
backend = root / "backend"
sys.path.insert(0, str(backend))
os.chdir(backend)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "learnlab_platform.settings")

import django
django.setup()

from accounts.models import User

# Admin account
admin, created = User.objects.get_or_create(
    username="admin",
    defaults={
        "email": "admin@learnlab.com",
        "first_name": "Admin",
        "last_name": "User",
        "is_staff": True,
        "is_superuser": True,
    }
)
if created:
    admin.set_password("admin123")
    admin.save()
    print(f"Created admin: {admin.username} (is_staff={admin.is_staff})")
else:
    print(f"Admin already exists: {admin.username}")

# Learner account
learner, created = User.objects.get_or_create(
    username="learner",
    defaults={
        "email": "learner@learnlab.com",
        "first_name": "John",
        "last_name": "Doe",
        "is_staff": False,
        "is_superuser": False,
    }
)
if created:
    learner.set_password("learner123")
    learner.save()
    print(f"Created learner: {learner.username} (is_staff={learner.is_staff})")
else:
    print(f"Learner already exists: {learner.username}")

# Also create LearnerProfile if the model exists
try:
    from accounts.models import LearnerProfile
    LearnerProfile.objects.get_or_create(user=learner)
    print("LearnerProfile ensured for learner account.")
except (ImportError, Exception) as e:
    print(f"LearnerProfile: {e}")

print("\nDone! Test accounts ready.")
