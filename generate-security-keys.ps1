# ========================================
# Security Keys Generator (PowerShell)
# ========================================
# This script generates secure random keys for microservices authentication

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "GSM Security Keys Generator" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to generate secure random key
function Generate-SecureKey {
    param (
        [int]$Length = 32
    )
    
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    
    return [Convert]::ToBase64String($bytes)
}

Write-Host "Generating API Keys (32 bytes each)..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "# API Keys for each service" -ForegroundColor Green
Write-Host "# Add these to each service's .env file" -ForegroundColor Green
Write-Host ""
Write-Host "AUTH_SERVICE_API_KEY=$(Generate-SecureKey -Length 32)"
Write-Host "SCHOLARSHIP_SERVICE_API_KEY=$(Generate-SecureKey -Length 32)"
Write-Host "AID_SERVICE_API_KEY=$(Generate-SecureKey -Length 32)"
Write-Host "MONITORING_SERVICE_API_KEY=$(Generate-SecureKey -Length 32)"
Write-Host ""

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "Generating Shared Secrets (64 bytes each)..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "# Shared Secrets for HMAC request signing" -ForegroundColor Green
Write-Host "# Add these to each service's .env file" -ForegroundColor Green
Write-Host ""
Write-Host "AUTH_SERVICE_SHARED_SECRET=$(Generate-SecureKey -Length 64)"
Write-Host "SCHOLARSHIP_SERVICE_SHARED_SECRET=$(Generate-SecureKey -Length 64)"
Write-Host "AID_SERVICE_SHARED_SECRET=$(Generate-SecureKey -Length 64)"
Write-Host "MONITORING_SERVICE_SHARED_SECRET=$(Generate-SecureKey -Length 64)"
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Keys generated successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "1. Store these keys securely" -ForegroundColor White
Write-Host "2. Never commit them to version control" -ForegroundColor White
Write-Host "3. Use different keys for each environment (dev, staging, prod)" -ForegroundColor White
Write-Host "4. Rotate keys regularly (every 90 days recommended)" -ForegroundColor White
Write-Host "5. Each microservice needs ALL keys to communicate" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the keys above to each microservice's .env file" -ForegroundColor White
Write-Host "2. Make sure each service has its own unique API_KEY" -ForegroundColor White
Write-Host "3. All services should share the same keys for other services" -ForegroundColor White
Write-Host "4. Restart all services after updating .env files" -ForegroundColor White
Write-Host ""
