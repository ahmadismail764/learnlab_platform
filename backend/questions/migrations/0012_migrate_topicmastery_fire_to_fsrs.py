# Generated manually – FIRe → FSRS migration for TopicMastery

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0011_remove_topic_encompassings_and_more'),
    ]

    operations = [
        # ── Drop old FIRe columns ──────────────────────────────────────
        migrations.RemoveField(
            model_name='topicmastery',
            name='rep_num',
        ),
        migrations.RemoveField(
            model_name='topicmastery',
            name='memory',
        ),
        migrations.RemoveField(
            model_name='topicmastery',
            name='speed',
        ),
        migrations.RemoveField(
            model_name='topicmastery',
            name='status',
        ),
        migrations.RemoveField(
            model_name='topicmastery',
            name='last_reviewed',
        ),
        migrations.RemoveField(
            model_name='topicmastery',
            name='next_due',
        ),

        # ── Add new FSRS columns ───────────────────────────────────────
        migrations.AddField(
            model_name='topicmastery',
            name='difficulty',
            field=models.FloatField(default=5.0, help_text='FSRS difficulty parameter (1\u201310)'),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='stability',
            field=models.FloatField(default=1.0, help_text='FSRS stability in days'),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='reps',
            field=models.IntegerField(default=0, help_text='Number of successful reviews'),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='lapses',
            field=models.IntegerField(default=0, help_text='Number of times forgotten'),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='state',
            field=models.CharField(
                choices=[('new', 'New'), ('learning', 'Learning'), ('review', 'Review'), ('relearning', 'Relearning')],
                default='new',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='last_review',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topicmastery',
            name='next_review',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
