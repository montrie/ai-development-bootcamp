#!/usr/bin/env bash
set -euo pipefail

DB_NAME="todo_db"
DB_USER="todo_app_user"
DB_PASS="todo_app_password"

echo "Creating PostgreSQL user '$DB_USER'..."
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" \
  | grep -q 1 \
  && echo "User '$DB_USER' already exists, skipping." \
  || psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

echo "Creating database '$DB_NAME'..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" \
  | grep -q 1 \
  && echo "Database '$DB_NAME' already exists, skipping." \
  || psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Done. Connect with: psql -U $DB_USER -d $DB_NAME"
