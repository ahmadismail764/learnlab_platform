import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_options_alter_user_managers_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferences',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action_type', models.CharField(
                    choices=[
                        ('user_register', 'User Registered'),
                        ('user_login', 'User Logged In'),
                        ('session_created', 'Practice Session Created'),
                        ('session_completed', 'Practice Session Completed'),
                        ('question_created', 'Question Created'),
                        ('question_updated', 'Question Updated'),
                        ('question_deleted', 'Question Deleted'),
                        ('topic_created', 'Topic Created'),
                        ('subtopic_created', 'Subtopic Created'),
                        ('preferences_updated', 'Preferences Updated'),
                    ],
                    db_index=True,
                    max_length=64,
                )),
                ('target_resource', models.CharField(blank=True, max_length=255)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('actor', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]
