#!/bin/sh
set -e

echo "Waiting for database..."
until uv run python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME', ''),
        user=os.environ.get('DB_USER', ''),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', '5432')),
    ).close()
except Exception as e:
    print('  DB not ready:', e)
    sys.exit(1)
"; do
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
    --timeout 60 \
    --access-logfile -
