#!/usr/bin/env bash

# Use nvm's Node 22 instead of the old system Node (v12), since
# double-click launchers don't load ~/.bashrc
export PATH="/home/samael/.nvm/versions/node/v22.23.2/bin:$PATH"
echo "Using Node $(node -v)"

BASE_DIR="/home/samael/Documents/Projects/mainframe"
DB_DIR="/home/samael/mainframe_DB"
PIDS=()

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    # Kill the whole process group so npm's child processes die too
    kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM EXIT

# Delete existing database files before starting the server
echo "Removing existing database files in $DB_DIR..."
rm -f "$DB_DIR/app.db" "$DB_DIR/app.db-shm" "$DB_DIR/app.db-wal"

# Run each service in its own process group (setsid) so cleanup is reliable
echo "Starting API on port 3000..."
(cd "$BASE_DIR/api" && exec setsid npm run dev) &
PIDS+=($!)

# Give the API a moment to come up before opening the tunnel
sleep 3

echo "Starting Cloudflare tunnel..."
setsid cloudflared tunnel --url http://192.168.1.13:3000 --metrics 127.0.0.1:20241 &
PIDS+=($!)

echo "Starting setup on port 4000..."
(cd "$BASE_DIR/setup" && exec setsid npm run dev) &
PIDS+=($!)

echo "All services started. Press Ctrl+C to stop everything."
wait