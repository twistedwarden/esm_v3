Write-Host "Setting up Audit Log System..." -ForegroundColor Yellow

Write-Host "1. Running database migration..." -ForegroundColor Yellow
Set-Location microservices\scholarship_service

# Run migration
Write-Host "Creating audit_logs table..."
php artisan migrate --force

Write-Host "✓ Database migration complete" -ForegroundColor Green

Write-Host "2. Seeding sample audit logs..." -ForegroundColor Yellow
# Run audit log seeder
Write-Host "Creating sample audit log entries..."
php artisan db:seed --class=AuditLogSeeder

Write-Host "✓ Sample audit logs created" -ForegroundColor Green

Write-Host "3. Testing API endpoints..." -ForegroundColor Yellow

# Test audit log API
Write-Host "Testing audit log API..."
try {
    $auditResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/audit-logs/recent" -Method GET -UseBasicParsing
    if ($auditResponse.StatusCode -eq 200) {
        Write-Host "✓ Audit log API is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Audit log API not responding (HTTP $($auditResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Audit log API not responding" -ForegroundColor Red
    Write-Host "Make sure scholarship service is running on port 8000" -ForegroundColor Red
}

Write-Host "Audit Log System setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Features available:" -ForegroundColor Cyan
Write-Host "- View all audit logs with filtering and search" -ForegroundColor White
Write-Host "- Export audit logs to JSON" -ForegroundColor White
Write-Host "- View detailed log information" -ForegroundColor White
Write-Host "- Statistics dashboard" -ForegroundColor White
Write-Host "- Filter by action, user role, resource type, status, and date range" -ForegroundColor White
Write-Host ""
Write-Host "Access the Audit Logs section in the admin panel!" -ForegroundColor Green
