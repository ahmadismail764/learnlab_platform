#!/bin/sh
set -e

echo "Waiting for database..."
until uv run python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnlab_platform.settings')
django.setup()
from django.db import connection
connection.ensure_connection()
" 2>/dev/null; do
  echo "  Database not ready — retrying in 2s"
  sleep 2
done

echo "Running migrations..."
uv run python manage.py migrate --noinput

echo "Collecting static files..."
uv run python manage.py collectstatic --noinput --clear

echo "Starting server..."
exec uv run gunicorn learnlab_platform.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --access-logfile -