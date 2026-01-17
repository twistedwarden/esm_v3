# Security Implementation Quick Start Guide
## Step-by-Step Implementation

This guide will help you implement the critical security enhancements in your GSM system.

---

## Prerequisites

- All microservices are running
- You have access to modify .env files
- You have shell/terminal access
- Basic understanding of Laravel middleware

---

## Phase 1: Generate Security Keys (15 minutes)

### Step 1: Generate Keys

**Windows (PowerShell):**
```powershell
cd C:\Users\mahus\Desktop\esmv3_local
.\generate-security-keys.ps1
```

**Linux/Mac (Bash):**
```bash
cd /path/to/esmv3_local
chmod +x generate-security-keys.sh
./generate-security-keys.sh
```

### Step 2: Save Keys Securely

Copy the generated keys to a secure password manager or encrypted file. **DO NOT** commit them to Git.

---

## Phase 2: Configure Services (30 minutes)

### Auth Service

**File:** `microservices/auth_service/.env`

Add these lines:
```env
# Service identification
APP_SERVICE_NAME=auth_service

# API Keys
API_KEY=your_generated_auth_service_api_key
SCHOLARSHIP_SERVICE_API_KEY=your_generated_scholarship_api_key
AID_SERVICE_API_KEY=your_generated_aid_api_key
MONITORING_SERVICE_API_KEY=your_generated_monitoring_api_key

# Shared Secrets
AUTH_SERVICE_SHARED_SECRET=your_generated_auth_shared_secret
SCHOLARSHIP_SERVICE_SHARED_SECRET=your_generated_scholarship_shared_secret
AID_SERVICE_SHARED_SECRET=your_generated_aid_shared_secret
MONITORING_SERVICE_SHARED_SECRET=your_generated_monitoring_shared_secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
SCHOLARSHIP_SERVICE_URL=http://localhost:8001
AID_SERVICE_URL=http://localhost:8002
MONITORING_SERVICE_URL=http://localhost:8003

# Rate Limiting
RATE_LIMIT_API=60
RATE_LIMIT_AUTH=5
RATE_LIMIT_OTP=3
```

### Scholarship Service

**File:** `microservices/scholarship_service/.env`

Add these lines:
```env
# Service identification
APP_SERVICE_NAME=scholarship_service

# API Keys (use the SAME keys generated above)
API_KEY=your_generated_scholarship_api_key
AUTH_SERVICE_API_KEY=your_generated_auth_service_api_key
AID_SERVICE_API_KEY=your_generated_aid_api_key
MONITORING_SERVICE_API_KEY=your_generated_monitoring_api_key

# Shared Secrets (use the SAME secrets generated above)
AUTH_SERVICE_SHARED_SECRET=your_generated_auth_shared_secret
SCHOLARSHIP_SERVICE_SHARED_SECRET=your_generated_scholarship_shared_secret
AID_SERVICE_SHARED_SECRET=your_generated_aid_shared_secret
MONITORING_SERVICE_SHARED_SECRET=your_generated_monitoring_shared_secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
SCHOLARSHIP_SERVICE_URL=http://localhost:8001
AID_SERVICE_URL=http://localhost:8002
MONITORING_SERVICE_URL=http://localhost:8003
```

### Aid Service

**File:** `microservices/aid_service/.env`

Add these lines:
```env
# Service identification
APP_SERVICE_NAME=aid_service

# API Keys (use the SAME keys generated above)
API_KEY=your_generated_aid_api_key
AUTH_SERVICE_API_KEY=your_generated_auth_service_api_key
SCHOLARSHIP_SERVICE_API_KEY=your_generated_scholarship_api_key
MONITORING_SERVICE_API_KEY=your_generated_monitoring_api_key

# Shared Secrets (use the SAME secrets generated above)
AUTH_SERVICE_SHARED_SECRET=your_generated_auth_shared_secret
SCHOLARSHIP_SERVICE_SHARED_SECRET=your_generated_scholarship_shared_secret
AID_SERVICE_SHARED_SECRET=your_generated_aid_shared_secret
MONITORING_SERVICE_SHARED_SECRET=your_generated_monitoring_shared_secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
SCHOLARSHIP_SERVICE_URL=http://localhost:8001
AID_SERVICE_URL=http://localhost:8002
MONITORING_SERVICE_URL=http://localhost:8003
```

### Monitoring Service

**File:** `microservices/monitoring_service/.env`

```env
# Service identification
APP_SERVICE_NAME=monitoring_service

# API Keys (use the SAME keys generated above)
API_KEY=your_generated_monitoring_api_key
AUTH_SERVICE_API_KEY=your_generated_auth_service_api_key
SCHOLARSHIP_SERVICE_API_KEY=your_generated_scholarship_api_key
AID_SERVICE_API_KEY=your_generated_aid_api_key

# Shared Secrets (use the SAME secrets generated above)
AUTH_SERVICE_SHARED_SECRET=your_generated_auth_shared_secret
SCHOLARSHIP_SERVICE_SHARED_SECRET=your_generated_scholarship_shared_secret
AID_SERVICE_SHARED_SECRET=your_generated_aid_shared_secret
MONITORING_SERVICE_SHARED_SECRET=your_generated_monitoring_shared_secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
SCHOLARSHIP_SERVICE_URL=http://localhost:8001
AID_SERVICE_URL=http://localhost:8002
MONITORING_SERVICE_URL=http://localhost:8003
```

---

## Phase 3: Update Services Configuration (15 minutes)

### All Services: Update config/services.php

**File:** `microservices/*/config/services.php`

Add this section to each service:
```php
<?php

return [
    // ... existing configuration ...

    'auth_service' => [
        'url' => env('AUTH_SERVICE_URL', 'http://localhost:8000'),
        'api_key' => env('AUTH_SERVICE_API_KEY'),
        'shared_secret' => env('AUTH_SERVICE_SHARED_SECRET'),
    ],

    'scholarship_service' => [
        'url' => env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8001'),
        'api_key' => env('SCHOLARSHIP_SERVICE_API_KEY'),
        'shared_secret' => env('SCHOLARSHIP_SERVICE_SHARED_SECRET'),
    ],

    'aid_service' => [
        'url' => env('AID_SERVICE_URL', 'http://localhost:8002'),
        'api_key' => env('AID_SERVICE_API_KEY'),
        'shared_secret' => env('AID_SERVICE_SHARED_SECRET'),
    ],

    'monitoring_service' => [
        'url' => env('MONITORING_SERVICE_URL', 'http://localhost:8003'),
        'api_key' => env('MONITORING_SERVICE_API_KEY'),
        'shared_secret' => env('MONITORING_SERVICE_SHARED_SECRET'),
    ],
];
```

---

## Phase 4: Register Middleware (20 minutes)

### Scholarship Service: Update bootstrap/app.php

**File:** `microservices/scholarship_service/bootstrap/app.php`

Update the middleware configuration:
```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Security middleware - applied in order
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\SecurityHeaders::class,      // NEW
            \App\Http\Middleware\ValidateInput::class,        // NEW
            \App\Http\Middleware\AuditLogMiddleware::class,
        ]);
        
        // Middleware aliases
        $middleware->alias([
            'auth.auth_service' => \App\Http\Middleware\AuthFromAuthService::class,
            'role' => \App\Http\Middleware\CheckRole::class,  // NEW
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
```

### Aid Service: Create bootstrap/app.php

**File:** `microservices/aid_service/bootstrap/app.php`

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\ApiKeyAuth::class,           // NEW
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
```

---

## Phase 5: Update Routes with Role-Based Access (30 minutes)

### Scholarship Service: Update routes/api.php

Add role middleware to protected routes:

```php
// Admin-only routes
Route::middleware(['auth.auth_service', 'role:admin'])->group(function () {
    // User management
    Route::prefix('users')->group(function () {
        Route::get('/', [UserManagementController::class, 'getAllUsers']);
        Route::post('/', [UserManagementController::class, 'createUser']);
        Route::delete('/{id}', [UserManagementController::class, 'deleteUser']);
    });
    
    // System settings
    Route::prefix('admin')->group(function () {
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });
});

// SSC and Admin routes
Route::middleware(['auth.auth_service', 'role:admin,ssc'])->group(function () {
    Route::prefix('applications')->group(function () {
        Route::post('/{application}/ssc-approve', [ScholarshipApplicationController::class, 'sscApprove']);
        Route::post('/{application}/ssc-reject', [ScholarshipApplicationController::class, 'sscReject']);
    });
});

// Staff, SSC, and Admin routes
Route::middleware(['auth.auth_service', 'role:admin,ssc,staff'])->group(function () {
    Route::prefix('applications')->group(function () {
        Route::get('/', [ScholarshipApplicationController::class, 'index']);
        Route::get('/{application}', [ScholarshipApplicationController::class, 'show']);
        Route::post('/{application}/review', [ScholarshipApplicationController::class, 'review']);
    });
});
```

---

## Phase 6: Test Security Implementation (30 minutes)

### Test 1: Rate Limiting

```bash
# Test login rate limiting (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  echo "Attempt $i"
done

# Expected: First 5 succeed with 401, attempts 6-10 get 429 (Too Many Requests)
```

### Test 2: Input Validation

```bash
# Test SQL injection protection
curl -X POST http://localhost:8001/api/students \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John'\'' OR 1=1--","last_name":"Doe"}' \
  -v

# Expected: 400 Bad Request with "Invalid input detected"
```

### Test 3: Security Headers

```bash
# Check security headers
curl -I http://localhost:8001/api/health

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
```

### Test 4: Role-Based Access

```bash
# Test admin route with regular user token (should fail)
curl -X GET http://localhost:8001/api/users \
  -H "Authorization: Bearer test-token" \
  -H "X-User-Role: citizen" \
  -v

# Expected: 403 Forbidden

# Test with admin role (should succeed)
curl -X GET http://localhost:8001/api/users \
  -H "Authorization: Bearer test-token" \
  -H "X-User-Role: admin" \
  -v

# Expected: 200 OK with user list
```

### Test 5: API Key Authentication (Aid Service)

```bash
# Test without API key (should fail)
curl -X GET http://localhost:8002/api/school-aid/disbursements \
  -v

# Expected: 401 Unauthorized

# Test with API key (should succeed)
curl -X GET http://localhost:8002/api/school-aid/disbursements \
  -H "X-API-Key: your_scholarship_api_key" \
  -H "X-Service-Name: scholarship_service" \
  -v

# Expected: 200 OK with disbursements
```

---

## Phase 7: Restart Services (5 minutes)

```bash
# Stop all services
# Press Ctrl+C in each terminal

# Start services with new configuration
cd microservices/auth_service
php artisan serve --port=8000

cd microservices/scholarship_service
php artisan serve --port=8001

cd microservices/aid_service
php artisan serve --port=8002

cd microservices/monitoring_service
php artisan serve --port=8003
```

---

## Phase 8: Monitor Logs (Ongoing)

Watch for security events:

```bash
# Monitor scholarship service logs
tail -f microservices/scholarship_service/storage/logs/laravel.log | grep -i "security\|malicious\|unauthorized"

# Watch for rate limiting
tail -f microservices/auth_service/storage/logs/laravel.log | grep -i "rate\|throttle"

# Monitor API key authentication
tail -f microservices/aid_service/storage/logs/laravel.log | grep -i "api key\|authentication"
```

---

## Troubleshooting

### Issue: "Missing authentication headers"

**Solution:** Make sure all microservices have the API keys configured in their `.env` files and that HTTP clients include the required headers:
```php
'X-API-Key' => config('services.target_service.api_key'),
'X-Service-Name' => config('app.service_name'),
```

### Issue: "Invalid signature"

**Solution:** Ensure all services have the same shared secrets configured. Check that request signing is implemented correctly when making inter-service calls.

### Issue: Rate limiting not working

**Solution:** Clear cache and restart services:
```bash
php artisan cache:clear
php artisan config:clear
```

### Issue: Security headers not appearing

**Solution:** Make sure SecurityHeaders middleware is registered in `bootstrap/app.php` and that it's not being overridden by other middleware.

---

## Next Steps

After implementing Phase 1 security enhancements:

1. **Review audit logs** regularly for suspicious activity
2. **Set up monitoring alerts** for security events
3. **Plan Phase 2 implementation** (data encryption, request signing)
4. **Schedule security training** for the development team
5. **Conduct penetration testing** to identify remaining vulnerabilities

---

## Security Checklist

- [ ] Generated and saved secure API keys
- [ ] Updated all .env files with keys and secrets
- [ ] Updated config/services.php in all services
- [ ] Registered security middleware
- [ ] Applied role-based access control to routes
- [ ] Tested rate limiting
- [ ] Tested input validation
- [ ] Verified security headers
- [ ] Tested API key authentication
- [ ] Restarted all services
- [ ] Reviewed logs for errors
- [ ] Documented API key locations (securely)
- [ ] Created backup of .env files (encrypted)

---

## Support

For issues or questions:
- Review: `SECURITY_IMPLEMENTATION_REVIEW.md`
- Check logs: `storage/logs/laravel.log`
- Test endpoints with curl or Postman
- Contact security team lead

---

**Implementation Time:** ~2-3 hours  
**Difficulty:** Intermediate  
**Impact:** High security improvement
