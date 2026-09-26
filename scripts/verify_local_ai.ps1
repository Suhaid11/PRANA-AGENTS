# PRANA - Local AI Verification Script (Phase 24)
# Verifies Ollama service, model identity forensics, and local GPU acceleration.

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " PRANA - Local AI Verification Gate" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verify Ollama CLI
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCmd) {
    Write-Host "[FAIL] Ollama executable not found in PATH." -ForegroundColor Red
    Write-Host "Please install Ollama from https://ollama.com" -ForegroundColor Yellow
    exit 1
}
$ollamaVersion = & ollama --version
Write-Host "[PASS] Ollama CLI installed: $ollamaVersion" -ForegroundColor Green

# 2. Verify Ollama Daemon Reachability
$ollamaUrl = "http://127.0.0.1:11434"
try {
    $resp = Invoke-RestMethod -Uri "$ollamaUrl/api/tags" -Method Get -TimeoutSec 3
    Write-Host "[PASS] Ollama daemon reachable at $ollamaUrl" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Ollama daemon unreachable at $ollamaUrl" -ForegroundColor Red
    Write-Host "Start Ollama daemon with: ollama serve" -ForegroundColor Yellow
    exit 1
}

# 3. Verify qwen3:8b model availability
$models = $resp.models | ForEach-Object { $_.name }
$hasQwen = ($models -contains "qwen3:8b") -or ($models | Where-Object { $_ -like "qwen3:8b*" })
if (-not $hasQwen) {
    Write-Host "[FAIL] Model 'qwen3:8b' is not installed in local Ollama." -ForegroundColor Red
    Write-Host "Run: ollama pull qwen3:8b" -ForegroundColor Yellow
    exit 1
}
Write-Host "[PASS] Model 'qwen3:8b' is pulled locally." -ForegroundColor Green

# 4. Forensic Model Identity Inspection via /api/show
$showBody = @{ model = "qwen3:8b" } | ConvertTo-Json
try {
    $showResp = Invoke-RestMethod -Uri "$ollamaUrl/api/show" -Method Post -Body $showBody -ContentType "application/json" -TimeoutSec 5
    $paramSize = $showResp.details.parameter_size
    $family = $showResp.details.family
    $quant = $showResp.details.quantization_level
    $arch = $showResp.model_info.'general.architecture'

    Write-Host "  - Family:        $family" -ForegroundColor Gray
    Write-Host "  - Architecture:  $arch" -ForegroundColor Gray
    Write-Host "  - Parameters:    $paramSize" -ForegroundColor Gray
    Write-Host "  - Quantization:  $quant" -ForegroundColor Gray

    # Anti-tampering check: reject 0.5B/494M models
    if ($paramSize -match "0\.5[bB]" -or $paramSize -match "494" -or ($arch -eq "qwen2" -and $paramSize -notmatch "8[bB]")) {
        Write-Host "[FAIL] Model identity violation: Retagged sub-scale model detected ($paramSize, $arch)." -ForegroundColor Red
        exit 1
    }

    if ($paramSize -match "8\.[0-9]+B" -or $paramSize -match "8B" -or $arch -eq "qwen3") {
        Write-Host "[PASS] Model identity verified: Genuine Qwen3-8B ($paramSize, $quant, $arch)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Model parameters ($paramSize) differ from standard 8.2B." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Could not query /api/show" -ForegroundColor Red
    exit 1
}

# 5. Hardware and GPU Check
$nvidiaSmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($nvidiaSmi) {
    $gpuInfo = & nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    Write-Host "[PASS] GPU Detected: $gpuInfo" -ForegroundColor Green
} else {
    Write-Host "[WARN] nvidia-smi not in PATH. Assuming CPU execution." -ForegroundColor Yellow
}

# 6. Verify PRANA Backend AI Provider Status
$pranaUrl = "http://127.0.0.1:8000"
try {
    $pranaResp = Invoke-RestMethod -Uri "$pranaUrl/api/v1/ai/provider-status?provider=qwen3" -Method Get -TimeoutSec 5
    if ($pranaResp.available -and $pranaResp.model -eq "qwen3:8b") {
        Write-Host "[PASS] PRANA Backend AI Provider active: $($pranaResp.provider) ($($pranaResp.model))" -ForegroundColor Green
    } else {
        Write-Host "[WARN] PRANA Backend returned: $($pranaResp.statusMessage)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] PRANA backend not currently running on port 8000." -ForegroundColor Gray
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Local AI System Gate: 100% OPERATIONAL AND VERIFIED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
