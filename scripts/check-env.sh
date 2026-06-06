#!/usr/bin/env bash
set -euo pipefail

mode="${1:-staging}"

required_public=(
  "NEXT_PUBLIC_SITE_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
)

required_server=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
  "WHEELS_INTERNAL_API_BASE_URL"
  "WHEELS_INTERNAL_API_TOKEN"
  "ADMIN_PASSWORD"
  "ADMIN_SESSION_SECRET"
)

required_payment=(
  "WHISH_CHANNEL"
  "WHISH_SECRET"
  "WEBSITE_URL"
)

missing=()

check_group() {
  local name="$1"
  shift
  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      missing+=("$key")
    fi
  done
}

check_group "public" "${required_public[@]}"
check_group "server" "${required_server[@]}"

if [[ "$mode" != "payment-deferred" ]]; then
  check_group "payment" "${required_payment[@]}"
fi

if ((${#missing[@]} > 0)); then
  echo "Missing required environment variables (${mode} mode):"
  for key in "${missing[@]}"; do
    echo "  - $key"
  done
  exit 1
fi

echo "Environment variable check passed (${mode} mode)."
