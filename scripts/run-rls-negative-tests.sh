#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Running RLS negative tests against configured DATABASE_URL..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "scripts/rls-negative-tests.sql"
echo "RLS negative tests completed successfully."
