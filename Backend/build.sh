#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Run migrations in a way that handles the auth_user dependency correctly
python manage.py migrate --no-input --run-syncdb
