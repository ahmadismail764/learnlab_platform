Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

$code = @'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnlab_platform.settings')

import django
django.setup()

from django.utils import timezone
from accounts.models import User
from topics.models import Topic, Subtopic, SubtopicMastery
from practice.models import Question, PracticeSession, QuestionResponse

now = timezone.now()
today = timezone.localdate()

accounts = [
    {
        'username': 'learner',
        'email': 'learner@example.test',
        'password': 'learner123',
        'first_name': 'Test',
        'last_name': 'Learner',
        'is_staff': False,
        'is_superuser': False,
        'current_xp': 180,
        'streak_count': 3,
    },
    {
        'username': 'admin',
        'email': 'admin@example.test',
        'password': 'admin123',
        'first_name': 'Test',
        'last_name': 'Admin',
        'is_staff': True,
        'is_superuser': True,
        'current_xp': 0,
        'streak_count': 0,
    },
    {
        'username': 'leader_alpha',
        'email': 'leader.alpha@example.test',
        'password': 'learner123',
        'first_name': 'Alpha',
        'last_name': 'Learner',
        'is_staff': False,
        'is_superuser': False,
        'current_xp': 860,
        'streak_count': 9,
    },
    {
        'username': 'leader_beta',
        'email': 'leader.beta@example.test',
        'password': 'learner123',
        'first_name': 'Beta',
        'last_name': 'Learner',
        'is_staff': False,
        'is_superuser': False,
        'current_xp': 540,
        'streak_count': 6,
    },
    {
        'username': 'leader_gamma',
        'email': 'leader.gamma@example.test',
        'password': 'learner123',
        'first_name': 'Gamma',
        'last_name': 'Learner',
        'is_staff': False,
        'is_superuser': False,
        'current_xp': 320,
        'streak_count': 4,
    },
]

users = {}
for spec in accounts:
    user = User.objects.filter(username=spec['username']).first()
    if user is None:
        user = User(username=spec['username'])
    user.email = spec['email']
    user.first_name = spec['first_name']
    user.last_name = spec['last_name']
    user.is_staff = spec['is_staff']
    user.is_superuser = spec['is_superuser']
    user.current_xp = spec['current_xp']
    user.streak_count = spec['streak_count']
    user.last_practice_date = today if not spec['is_staff'] else None
    user.set_password(spec['password'])
    user.save()
    users[spec['username']] = user

topic, _ = Topic.objects.update_or_create(
    name='Seeded Discrete Mathematics',
    defaults={
        'description': 'Local Docker seed data for frontend session and leaderboard testing.',
    },
)

subtopic, _ = Subtopic.objects.update_or_create(
    topic=topic,
    name='Seeded Logic Basics',
    defaults={
        'description': 'Truth tables, implications, and set notation smoke-test prompts.',
    },
)

question_specs = [
    {
        'text': 'Seeded: Which statement is equivalent to p -> q?',
        'choices': ['not p or q', 'p and q', 'p or not q', 'not p and not q'],
        'correct_answer_index': 0,
        'tier': 1,
    },
    {
        'text': 'Seeded: What is the power set size of a set with 3 elements?',
        'choices': ['3', '6', '8', '9'],
        'correct_answer_index': 2,
        'tier': 1,
    },
    {
        'text': 'Seeded: If A is a subset of B and B is a subset of C, what follows?',
        'choices': ['C is a subset of A', 'A is a subset of C', 'A and C are disjoint', 'B is empty'],
        'correct_answer_index': 1,
        'tier': 2,
    },
]

questions = []
for spec in question_specs:
    question, _ = Question.objects.update_or_create(
        text=spec['text'],
        defaults={
            'subtopic': subtopic,
            'choices': spec['choices'],
            'correct_answer_index': spec['correct_answer_index'],
            'tier': spec['tier'],
        },
    )
    questions.append(question)

mastery_specs = {
    'learner': dict(difficulty=4.2, stability=1.0, reps=2, lapses=0, state='REVIEW'),
    'leader_alpha': dict(difficulty=3.4, stability=6.0, reps=9, lapses=1, state='REVIEW'),
    'leader_beta': dict(difficulty=4.1, stability=3.0, reps=6, lapses=1, state='REVIEW'),
    'leader_gamma': dict(difficulty=5.0, stability=1.5, reps=4, lapses=2, state='RELEARNING'),
}

for username, defaults in mastery_specs.items():
    SubtopicMastery.objects.update_or_create(
        learner=users[username],
        subtopic=subtopic,
        defaults={
            **defaults,
            'last_review': now - timezone.timedelta(days=2),
            'next_review': now - timezone.timedelta(minutes=10),
        },
    )

for username in ['learner', 'leader_alpha', 'leader_beta', 'leader_gamma']:
    user = users[username]
    has_seed_session = PracticeSession.objects.filter(
        learner=user,
        responses__question__in=questions,
    ).exists()
    if has_seed_session:
        continue

    correct_count = 0
    session = PracticeSession.objects.create(
        learner=user,
        end_time=now - timezone.timedelta(minutes=5),
        total_xp_earned=0,
    )
    for index, question in enumerate(questions):
        selected = question.correct_answer_index
        is_correct = True
        if username == 'leader_gamma' and index == 1:
            selected = 0
            is_correct = False
        QuestionResponse.objects.create(
            session=session,
            question=question,
            selected_answer_index=selected,
            is_correct=is_correct,
            time_taken_seconds=25 + (index * 7),
            confidence_rating=3 if is_correct else 1,
        )
        if is_correct:
            correct_count += 1
    session.total_xp_earned = correct_count * 10
    session.save(update_fields=['total_xp_earned'])

print('seeded_users=' + ','.join(sorted(users.keys())))
print(f'seeded_topic={topic.id} seeded_subtopic={subtopic.id} seeded_questions={len(questions)}')
print('login_accounts=learner/learner123,admin/admin123')
'@

Push-Location $repoRoot
try {
  docker compose exec -T backend uv run python -c $code
}
finally {
  Pop-Location
}
