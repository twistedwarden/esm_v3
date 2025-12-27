Write-Host "Setting up User Management System..." -ForegroundColor Yellow

Write-Host "1. Setting up Auth Service..." -ForegroundColor Yellow
Set-Location microservices\auth_service

# Run migrations
Write-Host "Running auth service migrations..."
php artisan migrate --force

# Run user seeder
Write-Host "Seeding users in auth service..."
php artisan db:seed --class=UserSeeder

Write-Host "✓ Auth service setup complete" -ForegroundColor Green

Write-Host "2. Setting up Scholarship Service..." -ForegroundColor Yellow
Set-Location ..\scholarship_service

# Run migrations
Write-Host "Running scholarship service migrations..."
php artisan migrate --force

# Run user management seeder
Write-Host "Seeding staff records in scholarship service..."
php artisan db:seed --class=UserManagementSeeder

Write-Host "✓ Scholarship service setup complete" -ForegroundColor Green

Write-Host "3. Testing API endpoints..." -ForegroundColor Yellow

# Test auth service
Write-Host "Testing auth service..."
try {
    $authResponse = Invoke-WebRequest -Uri "http://localhost:8001/api/users" -Method GET -UseBasicParsing
    if ($authResponse.StatusCode -eq 200) {
        Write-Host "✓ Auth service is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Auth service not responding (HTTP $($authResponse.StatusCode))" -ForegroundColor Red
        Write-Host "Make sure auth service is running on port 8001" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Auth service not responding" -ForegroundColor Red
    Write-Host "Make sure auth service is running on port 8001" -ForegroundColor Red
}

# Test scholarship service
Write-Host "Testing scholarship service..."
try {
    $scholarshipResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/test/users" -Method GET -UseBasicParsing
    if ($scholarshipResponse.StatusCode -eq 200) {
        Write-Host "✓ Scholarship service is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Scholarship service not responding (HTTP $($scholarshipResponse.StatusCode))" -ForegroundColor Red
        Write-Host "Make sure scholarship service is running on port 8000" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Scholarship service not responding" -ForegroundColor Red
    Write-Host "Make sure scholarship service is running on port 8000" -ForegroundColor Red
}

Write-Host "User Management System setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Sample users created:" -ForegroundColor Cyan
Write-Host "- Admin: admin@caloocan.gov.ph (password: admin123)" -ForegroundColor White
Write-Host "- Staff: staff@caloocan.gov.ph (password: staff123)" -ForegroundColor White
Write-Host "- Citizens: citizen@example.com, juan.delacruz@example.com, ana.garcia@example.com (password: citizen123)" -ForegroundColor White
Write-Host "- Partner School Rep: school.rep@university.edu.ph (password: psrep123)" -ForegroundColor White
Write-Host ""
Write-Host "You can now access the User Management dashboard in the admin panel!" -ForegroundColor Green
