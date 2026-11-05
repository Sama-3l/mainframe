#!/usr/bin/env bash
set -m  # job control: each background job gets its own process group (works on Linux and macOS)

BASE_DIR="${BASE_DIR:-$HOME/Documents/Projects/mainframe}"
DB_DIR="/Users/samael/mainframe_data/mainframe_DB"
PIDS=()
CLEANED=0

# Returns the first free port at or above $1 (checks up to 50 ports)
find_free_port() {
  local port=$1 max=$(( $1 + 50 ))
  while [ "$port" -lt "$max" ]; do
    # If the connection succeeds, something is listening, so try the next port
    if ! (exec 3<>/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
      echo "$port"
      return 0
    fi
    port=$(( port + 1 ))
  done
  return 1
}

cleanup() {
  [ "$CLEANED" = 1 ] && return
  CLEANED=1
  echo
  echo "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM EXIT

# Delete existing database files before starting the server
echo "Removing existing database files in $DB_DIR..."
rm -f "$DB_DIR/app.db" "$DB_DIR/app.db-shm" "$DB_DIR/app.db-wal"

METRICS_PORT=$(find_free_port 20241) || { echo "No free metrics port found" >&2; exit 1; }

echo "Starting API on port 3000..."
(cd "$BASE_DIR/api" && exec npm run dev) &
PIDS+=($!)

sleep 3

echo "Starting Cloudflare tunnel (metrics on http://127.0.0.1:$METRICS_PORT)..."
cloudflared tunnel --url http://localhost:3000 --metrics 127.0.0.1:"$METRICS_PORT" &
PIDS+=($!)

echo "Starting setup on port 4000..."
(cd "$BASE_DIR/setup" && exec npm run dev) &
PIDS+=($!)

echo "All services started. Press Ctrl+C to stop everything."
wait