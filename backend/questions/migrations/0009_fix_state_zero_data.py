"""
Data migration: Update any existing TopicMastery rows with the invalid state=0
to the correct state=1 (Learning), matching the fsrs.State enum.
"""
from django.db import migrations


def fix_invalid_state_zero(apps, schema_editor):
    TopicMastery = apps.get_model('questions', 'TopicMastery')
    updated = TopicMastery.objects.filter(state=0).update(state=1)
    if updated:
        print(f"\n  → Fixed {updated} TopicMastery rows: state 0 → 1 (Learning)")


def reverse_noop(apps, schema_editor):
    pass  # No meaningful reverse — state=0 was always invalid


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0008_fix_state_default_to_learning'),
    ]

    operations = [
        migrations.RunPython(fix_invalid_state_zero, reverse_noop),
    ]
