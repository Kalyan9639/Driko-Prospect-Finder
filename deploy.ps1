# deploy.ps1 — 1-Click Cloud Run Deployment Script for PowerShell
# Deploys kriu-icp-lab to Google Cloud Run in us-central1 (hireforge-ai)

param (
    [string]$ProjectId = "hireforge-ai",
    [string]$ServiceName = "kriu-icp-lab",
    [string]$GeminiApiKey = "",
    [string]$GroqApiKey = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Deploying $ServiceName to Google Cloud Run" -ForegroundColor Cyan
Write-Host "   Project: $ProjectId | Region: us-central1" -ForegroundColor Cyan
Write-Host "   Specs: 2 vCPU | 2 GiB RAM | Timeout: 300s" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Google Cloud SDK (gcloud) is not installed or not in PATH."
    Write-Host "Download it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Extract GEMINI_API_KEY and GROQ_API_KEY from .env if not provided as argument
if (Test-Path ".env") {
    if (-not $GeminiApiKey) {
        $envMatch = Get-Content ".env" | Select-String -Pattern "^GEMINI_API_KEY=(.+)$"
        if ($envMatch) {
            $GeminiApiKey = $envMatch.Matches[0].Groups[1].Value.Trim()
        }
    }
    if (-not $GroqApiKey) {
        $groqMatch = Get-Content ".env" | Select-String -Pattern "^GROQ_API_KEY=(.+)$"
        if ($groqMatch) {
            $GroqApiKey = $groqMatch.Matches[0].Groups[1].Value.Trim()
        }
    }
}

if (-not $GeminiApiKey) {
    $GeminiApiKey = Read-Host "Enter your GEMINI_API_KEY (leave empty to use deterministic fallback)"
}

Write-Host "`nSetting active GCP project to $ProjectId..." -ForegroundColor Green
gcloud config set project $ProjectId

Write-Host "`nEnabling required GCP APIs (Cloud Run, Cloud Build, Artifact Registry)..." -ForegroundColor Green
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $ProjectId

Write-Host "`nBuilding and deploying service to Cloud Run..." -ForegroundColor Green
gcloud run deploy $ServiceName `
    --source . `
    --region us-central1 `
    --platform managed `
    --allow-unauthenticated `
    --cpu 2 `
    --memory 2Gi `
    --timeout 300 `
    --concurrency 80 `
    --set-env-vars "GEMINI_API_KEY=$GeminiApiKey,GROQ_API_KEY=$GroqApiKey,GEMINI_MODEL=gemini-2.5-flash-lite,ENABLE_CACHE=true" `
    --project $ProjectId

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n Deployment successful!" -ForegroundColor Green
    $ServiceUrl = (gcloud run services describe $ServiceName --platform managed --region us-central1 --format "value(status.url)" 2>$null)
    Write-Host "`nAccess your live instance at:" -ForegroundColor Cyan
    Write-Host "  Landing Page: $ServiceUrl" -ForegroundColor Green
    Write-Host "  GTM Workbench: $ServiceUrl/app" -ForegroundColor Green
    Write-Host "  API Health: $ServiceUrl/api/health" -ForegroundColor Green
} else {
    Write-Host "`nDeployment failed. Check the error output above." -ForegroundColor Red
}
