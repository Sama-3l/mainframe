#!/usr/bin/env bash
set -u
cd "$(dirname "$0")"

OS="$(uname -s)"
D="docker"   # becomes "sudo docker" on Linux if the user isn't in the docker group yet

step() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[33m%s\033[0m\n' "$1"; }
fail() { printf '\n\033[31mERROR: %s\033[0m\n' "$1"; exit 1; }
docker_ready() { $D info >/dev/null 2>&1; }

# Docker Desktop's CLI may not be on PATH in this window yet
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin"

# ---------- 1. Docker ----------
step "Checking Docker"

if [ "$OS" = "Linux" ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Installing it now (you will be asked for your password)..."
    if ! command -v curl >/dev/null 2>&1; then
      sudo apt-get update -y && sudo apt-get install -y curl || fail "Could not install curl."
    fi
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || fail "Could not download the Docker installer."
    sudo sh /tmp/get-docker.sh || fail "Docker installation failed."
    sudo systemctl enable --now docker
  fi

  # Make sure the user can use docker without sudo from the next login on
  id -nG | grep -qw docker || sudo usermod -aG docker "$USER"

  if ! docker_ready; then
    sudo systemctl start docker >/dev/null 2>&1 || true
    sleep 3
    if docker_ready; then :
    elif sudo docker info >/dev/null 2>&1; then
      D="sudo docker"
      warn "Using sudo for Docker this time. After you log out and back in, it won't be needed."
    else
      fail "Docker is installed but not running. Try: sudo systemctl start docker"
    fi
  fi

  if ! $D compose version >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin \
      || fail "Docker Compose is missing and could not be installed."
  fi

elif [ "$OS" = "Darwin" ]; then
  if [ ! -d /Applications/Docker.app ]; then
    echo "Docker Desktop is not installed. Installing it now (you will be asked for your Mac password)..."
    case "$(uname -m)" in arm64) A=arm64 ;; *) A=amd64 ;; esac
    curl -fL "https://desktop.docker.com/mac/main/$A/Docker.dmg" -o /tmp/Docker.dmg \
      || fail "Could not download Docker Desktop."
    sudo hdiutil attach -nobrowse /tmp/Docker.dmg >/dev/null || fail "Could not open the Docker installer."
    sudo /Volumes/Docker/Docker.app/Contents/MacOS/install --accept-license \
      || { sudo hdiutil detach /Volumes/Docker >/dev/null 2>&1; fail "Docker Desktop installation failed."; }
    sudo hdiutil detach /Volumes/Docker >/dev/null 2>&1
    rm -f /tmp/Docker.dmg
  fi

  if ! docker_ready; then
    step "Starting Docker Desktop (first start can take a minute or two)"
    open -a Docker
    ok=0
    for i in $(seq 1 90); do
      sleep 2
      if docker_ready; then ok=1; break; fi
    done
    [ "$ok" = "1" ] || fail "Docker didn't start. Open Docker Desktop yourself, finish any prompts it shows, wait until it says it's running, then run this again."
  fi
else
  fail "Unsupported system: $OS. Use start.bat on Windows."
fi
printf '\033[32mDocker is running.\033[0m\n'

# ---------- 2. First run: ask for the target folder ----------
if [ ! -f .env ]; then
  step "Choose storage folder"
  DEFAULT="$HOME/MainframeData"
  while true; do
    read -r -p "Where should your files be stored? Full folder path [$DEFAULT]: " P
    P="${P:-$DEFAULT}"
    P="${P//\\ / }"                                   # drag-and-drop paths: "My\ Folder"
    P="${P#"${P%%[![:space:]]*}"}"; P="${P%"${P##*[![:space:]]}"}"   # trim spaces
    P="${P%\"}"; P="${P#\"}"; P="${P%\'}"; P="${P#\'}"               # strip quotes
    case "$P" in "~"*) P="$HOME${P#"~"}" ;; esac                     # expand ~

    case "$P" in
      *OneDrive*|*Dropbox*|*"Google Drive"*|*"Mobile Documents"*|*iCloud*|*CloudStorage*)
        warn "Please avoid cloud-synced folders (they lock files while the server writes). Pick another."
        continue ;;
    esac

    if ! mkdir -p "$P/uploads" "$P/database" 2>/dev/null; then
      warn "Can't use that path. Check that it exists and you have permission."
      continue
    fi
    ABS="$(cd "$P" && pwd)"
    break
  done

  {
    echo "GALLERY_PATH=\"$ABS/uploads\""
    echo "DB_PATH=\"$ABS/database\""
    if [ "$OS" = "Linux" ]; then
      echo "HOST_UID=$(id -u)"
      echo "HOST_GID=$(id -g)"
    fi
  } > .env
  echo "Files:    $ABS/uploads"
  echo "Database: $ABS/database"
fi

# ---------- 3. Download and start ----------
step "Downloading the latest version"
$D compose pull || fail "Download failed. Check your internet connection and try again."

port_busy() {
  if command -v lsof >/dev/null 2>&1; then lsof -iTCP:4000 -sTCP:LISTEN >/dev/null 2>&1
  elif command -v ss >/dev/null 2>&1; then ss -ltn 2>/dev/null | grep -q ':4000 '
  else return 1; fi
}
if [ -z "$($D compose ps -q setup 2>/dev/null)" ] && port_busy; then
  fail "Port 4000 is used by another program. Close it and run this again."
fi

step "Starting the server"
$D compose up -d || fail "Could not start. Run '$D compose logs' in this folder to see why."

step "Waiting for the tunnel (up to 3 minutes)"
ready=0
for i in $(seq 1 90); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/ 2>/dev/null || true)"
  if [ "$code" = "200" ]; then ready=1; break; fi
  sleep 2
done
[ "$ready" = "1" ] || fail "The server didn't become ready. Run '$D compose logs' in this folder and send it to the developer."

URL="http://localhost:4000"
if [ "$OS" = "Darwin" ]; then open "$URL"
elif [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 &
else echo "Open $URL in your browser."; fi

printf '\n\033[32mDone! Scan the QR code in your browser with the app.\033[0m\n'
echo "Keep Docker running so your phone can reach this computer."