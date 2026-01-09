#!/bin/sh
set -e

# Wait for the database to be ready (simple loop)
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  until nc -z $DB_HOST ${DB_PORT:-5432}; do
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
