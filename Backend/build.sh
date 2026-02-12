#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Step 1: Create essential tables (contenttypes and auth) first
# We use --run-syncdb to ensure they are created immediately
python manage.py migrate contenttypes --no-input
python manage.py migrate auth --no-input

# Step 2: Apply the rest of the migrations
python manage.py migrate --no-input
