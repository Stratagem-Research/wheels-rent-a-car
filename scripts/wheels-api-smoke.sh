#!/usr/bin/env bash
# Wheels Public API smoke pass.
#
# Hits the three documented endpoints (per
# `docs/api protokoll - wizard wheels acc.pdf`) against the Laravel test URL
# and records each response into `lib/api/wheels-public/__tests__/fixtures/`
# for downstream schema/adapter tests.
#
# Usage:
#   ./scripts/wheels-api-smoke.sh                    # capture default fixtures
#   ./scripts/wheels-api-smoke.sh --base-url <url>   # point at staging/prod
#   ./scripts/wheels-api-smoke.sh --no-write         # print only, don't save
#
# Safety notes:
# - Never deletes anything.
# - Uses sentinel customer email `smoke+<timestamp>@stratagemresearch.co`
#   so the backend team can grep/purge created bookings.
# - Picks rental dates ~12 months out so it never collides with real ops.
# - Posts the same booking payload twice to verify the 409 conflict path
#   (the second call is expected to fail — that IS the test).
#
# Requires: bash, curl, jq.

set -euo pipefail

BASE_URL="${WHEELS_API_BASE_URL:-https://adoring-hugle.85-215-232-144.plesk.page/api/public}"
INTERNAL_BASE_URL="${WHEELS_INTERNAL_API_BASE_URL:-${BASE_URL%/api/public}/api/v1}"
INTERNAL_API_TOKEN="${WHEELS_INTERNAL_API_TOKEN:-}"
FIXTURE_DIR="$(cd "$(dirname "$0")/.." && pwd)/lib/api/wheels-public/__tests__/fixtures"
WRITE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --no-write)
      WRITE=0
      shift
      ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (brew install jq)" >&2
  exit 1
fi

mkdir -p "$FIXTURE_DIR"

# Far-future window so we never clash with real ops.
START="2027-04-15 10:00"
END="2027-04-19 10:00"
START_ENC="${START// /%20}"
END_ENC="${END// /%20}"

TIMESTAMP="$(date +%s)"
SENTINEL_EMAIL="smoke+${TIMESTAMP}@stratagemresearch.co"
SENTINEL_EMAIL_ENC="${SENTINEL_EMAIL//+/%2B}"
SENTINEL_EMAIL_ENC="${SENTINEL_EMAIL_ENC//@/%40}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim()  { printf '\033[2m%s\033[0m\n' "$*"; }

save() {
  local name="$1" body="$2"
  if [[ "$WRITE" -eq 1 ]]; then
    echo "$body" | jq '.' > "$FIXTURE_DIR/$name"
    dim "  saved → $FIXTURE_DIR/$name"
  fi
}

# 1. GET /availability ────────────────────────────────────────────────
bold "[1/6] GET /availability"
dim   "      $BASE_URL/availability?start_date_time=$START&end_date_time=$END"
RES_AVAIL=$(curl -sS -X GET \
  "$BASE_URL/availability?start_date_time=$START_ENC&end_date_time=$END_ENC" \
  -H "Accept: application/json")
echo "$RES_AVAIL" | jq '{success, data: {start_date_time: .data.start_date_time, end_date_time: .data.end_date_time, count: .data.count, first_vehicle: .data.vehicles[0]}}'
save "availability-success.json" "$RES_AVAIL"

FIRST_VEHICLE_ID=$(echo "$RES_AVAIL" | jq -r '.data.vehicles[0].id // empty')
if [[ -z "$FIRST_VEHICLE_ID" ]]; then
  echo "No vehicles returned by availability — aborting." >&2
  exit 2
fi
dim "  picked vehicle id: $FIRST_VEHICLE_ID"

# 2. GET /availability/{vehicleId} ────────────────────────────────────
bold "[2/6] GET /availability/$FIRST_VEHICLE_ID"
RES_ONE=$(curl -sS -X GET \
  "$BASE_URL/availability/$FIRST_VEHICLE_ID?start_date_time=$START_ENC&end_date_time=$END_ENC" \
  -H "Accept: application/json")
echo "$RES_ONE" | jq '.'
save "availability-one-vehicle.json" "$RES_ONE"

# 3. POST /booking-request (success) ──────────────────────────────────
bold "[3/6] POST /booking-request (success)"
PAYLOAD_FILE="$(mktemp)"
trap 'rm -f "$PAYLOAD_FILE" /tmp/wheels-conflict.json' EXIT
cat > "$PAYLOAD_FILE" <<EOF
{
  "vehicle_id": $FIRST_VEHICLE_ID,
  "start_date_time": "$START",
  "end_date_time": "$END",
  "pickup_address": 1,
  "drop_off_address": 1,
  "payment_method": "cash_on_pickup",
  "payment_status": "unpaid",
  "customer": {
    "first_name": "Smoke",
    "last_name": "Test",
    "email": "$SENTINEL_EMAIL",
    "phone_number": "+96170000000",
    "birth_date": "1990-01-01",
    "license_number": "SMOKE-TEST"
  },
  "notes": "Created by scripts/wheels-api-smoke.sh — safe to delete"
}
EOF
PAYLOAD="$(cat "$PAYLOAD_FILE")"
dim "      vehicle_id=$FIRST_VEHICLE_ID start=$START end=$END email=$SENTINEL_EMAIL"
RES_BOOK=$(curl -sS -X POST "$BASE_URL/booking-request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD_FILE")
echo "$RES_BOOK" | jq '.'
save "booking-success.json" "$RES_BOOK"

# 4. POST /booking-request (conflict) ─────────────────────────────────
bold "[4/6] POST /booking-request (expect 409 conflict on same window)"
HTTP_AND_BODY=$(curl -sS -o /tmp/wheels-conflict.json -w '%{http_code}' \
  -X POST "$BASE_URL/booking-request" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD_FILE" || true)
RES_CONFLICT=$(cat /tmp/wheels-conflict.json)
dim "  HTTP $HTTP_AND_BODY"
echo "$RES_CONFLICT" | jq '.'
save "booking-conflict.json" "$RES_CONFLICT"

BOOKING_REFERENCE="$(echo "$RES_BOOK" | jq -r '.data.reference // empty')"
PUBLIC_TOKEN="$(echo "$RES_BOOK" | jq -r '.data.public_token // empty')"

# 5. GET /bookings/{reference}?email=... ──────────────────────────────
if [[ -n "$BOOKING_REFERENCE" ]]; then
  bold "[5/6] GET /bookings/$BOOKING_REFERENCE?email=..."
  RES_LOOKUP=$(curl -sS -X GET \
    "$BASE_URL/bookings/$BOOKING_REFERENCE?email=${SENTINEL_EMAIL_ENC}" \
    -H "Accept: application/json")
  echo "$RES_LOOKUP" | jq '.'
  save "booking-lookup-success.json" "$RES_LOOKUP"
else
  dim "  skipping lookup probe: no reference in booking response"
fi

# 6. GET /booking-status/{public_token} ────────────────────────────────
if [[ -n "$PUBLIC_TOKEN" ]]; then
  bold "[6/6] GET /booking-status/$PUBLIC_TOKEN"
  RES_STATUS=$(curl -sS -X GET \
    "$BASE_URL/booking-status/$PUBLIC_TOKEN" \
    -H "Accept: application/json")
  echo "$RES_STATUS" | jq '.'
  save "booking-status-success.json" "$RES_STATUS"
else
  dim "  skipping status probe: no public_token in booking response"
fi

# 7. POST /api/v1/bookings/{reference}/sync-status (optional) ───────────
if [[ -n "$BOOKING_REFERENCE" && -n "$INTERNAL_BASE_URL" && -n "$INTERNAL_API_TOKEN" ]]; then
  bold "[7/7] POST internal sync-status for $BOOKING_REFERENCE"
  # Mirrors lib/api/wheels-public/sync-status.ts: "pending" lifecycle maps to
  # Wizard's "pending_approval" status (Wizard has no raw "pending" enum value).
  RES_SYNC=$(curl -sS -X POST \
    "$INTERNAL_BASE_URL/bookings/$BOOKING_REFERENCE/sync-status" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $INTERNAL_API_TOKEN" \
    --data-binary "$(cat <<'EOF'
{
  "status": "pending_approval",
  "payment_status": "unpaid",
  "sync_type": "status_update",
  "message": "Smoke probe from scripts/wheels-api-smoke.sh"
}
EOF
)")
  echo "$RES_SYNC" | jq '.'
  save "booking-sync-status.json" "$RES_SYNC"
else
  dim "  skipping internal sync-status probe: set WHEELS_INTERNAL_API_BASE_URL and WHEELS_INTERNAL_API_TOKEN"
fi

bold "Done."
dim "Sentinel email used: $SENTINEL_EMAIL"
dim "If WRITE was on, fixtures are now under $FIXTURE_DIR"
