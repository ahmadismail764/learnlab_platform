from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('topics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='topic',
            name='parent_module',
            field=models.CharField(default='Uncategorized', max_length=255),
        ),
    ]
