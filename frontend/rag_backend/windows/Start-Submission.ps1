param(
  [Parameter(Mandatory = $true)][string]$SarvamApiKey,
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [int]$MinimumFreeGiB = 12,
  [int]$RowsPerShard = 0
)

$ErrorActionPreference = "Stop"
$driveName = (Split-Path -Qualifier $Root).TrimEnd(':')
$freeGiB = (Get-PSDrive -Name $driveName).Free / 1GB
if ($freeGiB -lt ($MinimumFreeGiB + 8)) { throw "Only $([math]::Round($freeGiB, 1)) GiB is free. Keep at least $MinimumFreeGiB GiB reserved before starting." }

if (-not (Get-Command nvidia-smi -ErrorAction SilentlyContinue)) { throw "NVIDIA driver was not detected. Install the current NVIDIA driver before starting." }
& nvidia-smi

Set-Location $Root
New-Item -ItemType Directory -Force -Path "$Root\data" | Out-Null
docker compose -f "$Root\windows\compose.submission.yml" up -d

if (-not (Test-Path "$Root\.venv")) { py -3.11 -m venv "$Root\.venv" }
$python = "$Root\.venv\Scripts\python.exe"
& $python -m pip install --upgrade pip
& $python -m pip install torch --index-url https://download.pytorch.org/whl/cu121
& $python -m pip install -r "$Root\requirements.txt"

$env:SARVAM_API_KEY = $SarvamApiKey
$env:QDRANT_URL = "http://127.0.0.1:6333"
$env:LEXICAL_DB_PATH = "$Root\data\lexical.sqlite3"
$env:EMBEDDING_DEVICE = "cuda"
$env:RERANKER_DEVICE = "cuda"
$env:EMBEDDING_BATCH_SIZE = "96"
$env:MIN_FREE_GB = "$MinimumFreeGiB"
$env:OMP_NUM_THREADS = [math]::Max(2, [math]::Floor([Environment]::ProcessorCount * 0.75))
$env:MKL_NUM_THREADS = $env:OMP_NUM_THREADS

& $python -m app.preflight
Write-Host "Measuring 1,000 real rows before setting the final submission cap..."
$reportPath = "$Root\data\submission-measurement.json"
& $python -m app.measure --rows 1000 --data-root "$Root\data" --state-path "$Root\data\ingest-state.sqlite3" --reserved-free-gb $MinimumFreeGiB --report $reportPath
$measurement = Get-Content -Raw $reportPath | ConvertFrom-Json
if ($RowsPerShard -le 0) {
  $RowsPerShard = [math]::Min(50000, [math]::Max(1000, [int]$measurement.conservative_rows_per_shard_within_50_gb))
}
if ($RowsPerShard -lt 1000) { throw "Measured capacity is too low for a safe submission run. Free additional disk space or choose a smaller corpus." }
$env:SUBMISSION_ROWS_PER_SHARD = "$RowsPerShard"
Write-Host "Starting guarded submission index with $RowsPerShard rows per language shard and a $MinimumFreeGiB GiB disk reserve."
& $python -m app.ingest --source parquet --submission-mode --batch-size 96 --min-free-gb $MinimumFreeGiB
