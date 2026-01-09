#!/bin/sh
set -e

## Wait for the database to be ready (use python resolver/connect loop)
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:${DB_PORT:-5432}..."
  # use Python script to wait for DB to be resolvable and accepting connections
  until python /app/wait_for_db.py; do
    echo "Waiting for postgres..."
    sleep 1
  done
fi

echo "Starting migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn plants.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3}
