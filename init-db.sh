#!/bin/bash
set -e

# Create the application user if it doesn't exist yet
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'learnlab_app') THEN
      CREATE USER learnlab_app WITH PASSWORD '${LEARNLAB_APP_DB_PASSWORD}';
    END IF;
  END \$\$;
EOSQL

# Create the application database only if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'learnlab'" | grep -q 1 || \
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
  "CREATE DATABASE learnlab OWNER learnlab_app;"

# Grant full access
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
  "GRANT ALL PRIVILEGES ON DATABASE learnlab TO learnlab_app;"
