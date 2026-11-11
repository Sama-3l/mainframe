$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "`nERROR: $m" -ForegroundColor Red; exit 1 }
function DockerReady { docker info *> $null; return ($LASTEXITCODE -eq 0) }

# Docker's bin folder may not be on PATH yet in this window
$env:Path += ";$env:ProgramFiles\Docker\Docker\resources\bin"
$dockerExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"

# ---------- 1. Make sure Docker Desktop is installed ----------
Step "Checking Docker Desktop"
if (-not (Test-Path $dockerExe)) {
  $virt = (Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled
  if ($virt -eq $false) {
    Write-Host "Warning: virtualization looks disabled. If Docker won't start later," -ForegroundColor Yellow
    Write-Host "enable 'Intel VT-x' / 'AMD SVM' in your BIOS." -ForegroundColor Yellow
  }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Start-Process "https://www.docker.com/products/docker-desktop/"
    Fail "Install Docker Desktop from the page that just opened, restart, then run this again."
  }
  Write-Host "Docker Desktop is not installed. Installing it now (approve the Windows prompt)..."
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { Fail "Docker Desktop installation failed." }
  Write-Host "`nDocker Desktop is installed." -ForegroundColor Green
  Write-Host "RESTART your computer, then double-click start.bat again." -ForegroundColor Yellow
  exit 0
}

# ---------- 2. Make sure Docker is running ----------
if (-not (DockerReady)) {
  Step "Starting Docker Desktop (first start can take a minute or two)"
  Start-Process $dockerExe
  $ok = $false
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 2
    if (DockerReady) { $ok = $true; break }
  }
  if (-not $ok) {
    Fail "Docker didn't start. Open Docker Desktop yourself, accept its license agreement, wait until it says it's running, then run this again."
  }
}
Write-Host "Docker is running." -ForegroundColor Green

# ---------- 3. First run: ask for the target folder ----------
function Ask-Folder {
  $default = "C:\MainframeData"
  while ($true) {
    $p = (Read-Host "Where should your files be stored? Full folder path [$default]").Trim().Trim('"').Trim("'")
    if (-not $p) { $p = $default }
    if ($p -like "*OneDrive*") {
      Write-Host "Please avoid OneDrive folders (they lock files while the server writes). Pick another." -ForegroundColor Yellow
      continue
    }
    try {
      New-Item -ItemType Directory -Force -Path $p -ErrorAction Stop | Out-Null
      return (Resolve-Path $p).Path
    } catch {
      Write-Host "Can't use that path: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

if (-not (Test-Path .env)) {
  Step "Choose storage folder"
  $root = Ask-Folder
  $uploads = Join-Path $root "uploads"
  $db = Join-Path $root "database"
  New-Item -ItemType Directory -Force -Path $uploads, $db | Out-Null

  # Docker wants forward slashes. ASCII avoids the BOM that PowerShell 5 adds.
  $g = $uploads -replace '\\','/'
  $d = $db -replace '\\','/'
  @"
GALLERY_PATH=$g
DB_PATH=$d
"@ | Set-Content -Path .env -Encoding ascii
  Write-Host "Files:    $uploads"
  Write-Host "Database: $db"
}

# ---------- 4. Download and start ----------
Step "Downloading the latest version"
docker compose pull
if ($LASTEXITCODE -ne 0) { Fail "Download failed. Check your internet connection and try again." }

# Port check, only if our own stack isn't already running
$running = docker compose ps -q setup
if (-not $running) {
  $busy = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
  if ($busy) { Fail "Port 4000 is used by another program. Close it and run this again." }
}

Step "Starting the server"
docker compose up -d
if ($LASTEXITCODE -ne 0) { Fail "Could not start. Run 'docker compose logs' in this folder to see why." }

Step "Waiting for the tunnel (up to 3 minutes)"
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  try {
    $r = Invoke-WebRequest -Uri http://localhost:4000/ -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
  Start-Sleep -Seconds 2
}
if (-not $ready) { Fail "The server didn't become ready. Run 'docker compose logs' in this folder and send it to the developer." }

Start-Process "http://localhost:4000"
Write-Host "`nDone! Scan the QR code in your browser with the app." -ForegroundColor Green
Write-Host "Keep Docker Desktop running so your phone can reach this computer."