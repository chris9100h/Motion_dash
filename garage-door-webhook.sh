#!/bin/bash
# Apple Home → Supabase + Telegram
# Speichert Garagenzustand (offen/geschlossen) und sendet Telegram-Nachricht.
# COOLDOWN verhindert Spam bei mehrfach-Auslösung.

DOOR_NAME="Garage"
STATE="${1:-open}"  # "open" oder "closed" als Argument
LOCK_FILE="/tmp/garage_telegram_lock_$STATE"
COOLDOWN=60

# Check cooldown
if [ -f "$LOCK_FILE" ]; then
  LAST_RUN=$(stat -c %Y "$LOCK_FILE")
  NOW=$(date +%s)
  if [ $((NOW - LAST_RUN)) -lt $COOLDOWN ]; then
    exit 0
  fi
fi
touch "$LOCK_FILE"

# Supabase REST API
SUPABASE_URL="https://ebbuvdzgstrhrcsbrlez.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnV2ZHpnc3RyaHJjc2JybGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjc4ODAsImV4cCI6MjA5MTYwMzg4MH0.RyTzHiqV1TPSZtM7lgenBJbUCTjj5fCUhoWauifjlIE"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TIME_DISPLAY=$(date '+%H:%M:%S')

# Supabase: Status aktualisieren (upsert)
curl -s -X POST "$SUPABASE_URL/rest/v1/door_status?on_conflict=door_name" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{\"door_name\":\"$DOOR_NAME\",\"state\":\"$STATE\",\"created_at\":\"$TIMESTAMP\"}" \
  > /dev/null 2>&1

# Telegram: Nachricht senden (dein aktueller Bot-Token und Chat-ID)
TEXT="$TIME_DISPLAY - $DOOR_NAME // $([ "$STATE" = "open" ] && echo "Geöffnet" || echo "Geschlossen")"
curl -s -X POST https://api.telegram.org/bot7582439841:AAGW4aMIc2vj4D0Hn1EXxvEBjLCsU9FAm9c/sendMessage \
  -d chat_id=-1002326006688 \
  -d text="$TEXT" \
  > /dev/null 2>&1

exit 0
