# Security Implementation Review & Enhancement Guide
## GSM Scholarship Management System

**Date**: January 15, 2026  
**Status**: Comprehensive Security Analysis  
**Priority**: HIGH

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Security Implementation](#current-security-implementation)
3. [Security Gaps Identified](#security-gaps-identified)
4. [Recommended Security Enhancements](#recommended-security-enhancements)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Security Best Practices](#security-best-practices)

---

## 1. Executive Summary

### Current Security Posture: ⭐⭐⭐ (3/5)

**Strengths:**
- ✅ Document virus scanning (ClamAV integration)
- ✅ Audit logging system implemented
- ✅ CORS middleware configured
- ✅ Basic authentication via Laravel Sanctum
- ✅ Service-to-service authentication (partial)

**Critical Gaps:**
- ❌ **No rate limiting** on API endpoints
- ❌ **No input validation middleware** across all services
- ❌ **No API key authentication** for microservices
- ❌ **No request signature verification**
- ❌ **Inconsistent authentication** across services
- ❌ **No encryption** for sensitive data at rest
- ❌ **Missing CSRF protection** on state-changing endpoints
- ❌ **No IP whitelisting** for admin operations

---

## 2. Current Security Implementation

### 2.1 Authentication & Authorization

#### ✅ **Implemented**

**Auth Service** (`microservices/auth_service/`)
```php
// Laravel Sanctum for token-based authentication
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
]

// Authentication methods:
- OTP-based login
- Google OAuth integration
- Email/password authentication
- Token-based API authentication
```

**Scholarship Service** (`microservices/scholarship_service/`)
```php
// Custom authentication middleware
AuthFromAuthService::class
- Validates bearer tokens
- Communicates with auth service
- Fallback test token for development
```

**Monitoring Service** (`microservices/monitoring_service/`)
```php
// Internal service authentication
InternalServiceAuth::class
- X-Service-Token header validation
- Bearer token support
- Localhost bypass in debug mode
```

#### ❌ **Missing**
- Role-based access control (RBAC) middleware
- Permission-based authorization
- Multi-factor authentication (MFA) enforcement
- Session timeout enforcement
- Concurrent session management

### 2.2 Document Security

#### ✅ **Implemented**

**Virus Scanning** (ClamAV Integration)
```
Location: microservices/scholarship_service/
Features:
- Client-side file validation
- Server-side virus scanning
- Async processing with queues
- Quarantine system for infected files
- Admin monitoring dashboard
- Multiple scanner support (ClamAV, VirusTotal, Windows Defender)
```

**File Upload Restrictions**
- File type validation (client-side)
- File size limits
- Virus scan logs
- Document verification workflow

#### ⚠️ **Needs Enhancement**
- File encryption at rest
- Digital signatures for documents
- Metadata sanitization
- Secure file deletion (shredding)
- Document access logging

### 2.3 Audit Logging

#### ✅ **Implemented**

**Audit Log System** (`microservices/scholarship_service/`)
```php
Location: app/Http/Middleware/AuditLogMiddleware.php

Features:
- Automatic request logging
- User action tracking
- IP address logging
- Request/response data capture
- Sensitive data redaction
- Admin dashboard for log review
```

**Logged Actions:**
- CREATE, UPDATE, DELETE operations
- User authentication events
- Data exports
- System configuration changes

#### ⚠️ **Needs Enhancement**
- Real-time security event alerts
- Log integrity protection (tamper-proof)
- Centralized logging across all services
- Log retention policies
- Automated anomaly detection

### 2.4 CORS Configuration

#### ✅ **Implemented**

**CORS Middleware** (`microservices/auth_service/`)
```php
Allowed Origins:
- http://localhost:5173
- http://localhost:3000
- http://127.0.0.1:5173
- http://127.0.0.1:3000
- https://educ.goserveph.com

Features:
- Dynamic origin validation
- Credential support
- Preflight request handling
```

#### ⚠️ **Needs Enhancement**
- Environment-based origin configuration
- Stricter origin validation in production
- CORS error logging
- Origin validation per route

---

## 3. Security Gaps Identified

### 🚨 **CRITICAL** (Immediate Action Required)

#### 3.1 No Rate Limiting
**Risk:** API abuse, DDoS attacks, credential stuffing

**Current State:**
```php
// NO rate limiting on ANY endpoints
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
```

**Impact:**
- Attackers can perform unlimited login attempts
- OTP endpoints can be abused
- API can be overwhelmed with requests
- No protection against brute force attacks

#### 3.2 Missing Input Validation Middleware
**Risk:** SQL injection, XSS, command injection

**Current State:**
```php
// No centralized input validation
// Each controller manually validates (inconsistent)
```

**Impact:**
- Inconsistent validation across services
- Potential SQL injection vulnerabilities
- XSS attacks through unvalidated input
- Command injection risks

#### 3.3 No API Key Authentication for Microservices
**Risk:** Unauthorized inter-service communication

**Current State:**
```php
// Only monitoring service has internal auth
// Other services have NO authentication between them

// Scholarship Service -> Auth Service: ❌ No validation
// Aid Service -> Scholarship Service: ❌ No validation
```

**Impact:**
- Any service can call any other service
- No way to verify legitimate internal requests
- Potential for service impersonation

#### 3.4 Plaintext Sensitive Data
**Risk:** Data breach exposure

**Current State:**
```php
// Database stores sensitive data in plaintext:
- Citizen IDs
- Phone numbers
- Addresses
- Academic records
- Financial information
```

**Impact:**
- Full data exposure if database is compromised
- Non-compliance with data protection regulations
- No defense-in-depth

### ⚠️ **HIGH** (Address Within 30 Days)

#### 3.5 Inconsistent Authentication Across Services
**Risk:** Security gaps, confused deputy attacks

**Current State:**
```
✅ Auth Service: Laravel Sanctum
✅ Scholarship Service: AuthFromAuthService (custom)
⚠️ Aid Service: NO authentication middleware
⚠️ Monitoring Service: InternalServiceAuth only
```

#### 3.6 No Request Signing
**Risk:** Man-in-the-middle attacks, request tampering

**Current State:**
- No HMAC signing for inter-service requests
- No request timestamp validation
- No replay attack protection

#### 3.7 Missing Security Headers
**Risk:** XSS, clickjacking, MIME sniffing attacks

**Current State:**
```php
// Missing security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy
- Permissions-Policy
```

### 📌 **MEDIUM** (Address Within 60 Days)

#### 3.8 No IP Whitelisting for Admin Operations
**Risk:** Unauthorized admin access

#### 3.9 No Session Management
**Risk:** Session hijacking, concurrent login issues

#### 3.10 Missing CSRF Protection
**Risk:** Cross-site request forgery attacks

---

## 4. Recommended Security Enhancements

### 4.1 Rate Limiting Implementation

#### **A. Install Laravel Rate Limiting**

**Step 1: Update RouteServiceProvider**
```php
// microservices/auth_service/app/Providers/RouteServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // API rate limiting
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
    
    // Auth endpoints - stricter limits
    RateLimiter::for('auth', function (Request $request) {
        return [
            Limit::perMinute(5)->by($request->ip()),
            Limit::perHour(20)->by($request->ip()),
        ];
    });
    
    // OTP endpoints - very strict
    RateLimiter::for('otp', function (Request $request) {
        return [
            Limit::perMinute(3)->by($request->ip()),
            Limit::perHour(10)->by($request->ip()),
        ];
    });
    
    // Admin endpoints - moderate limits
    RateLimiter::for('admin', function (Request $request) {
        return Limit::perMinute(100)->by($request->user()?->id ?: $request->ip());
    });
}
```

**Step 2: Apply to Routes**
```php
// microservices/auth_service/routes/api.php

// Apply rate limiting to auth routes
Route::middleware(['throttle:auth'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/auth/google', [AuthController::class, 'googleCallback']);
});

// Apply strict rate limiting to OTP routes
Route::middleware(['throttle:otp'])->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/request-login-otp', [AuthController::class, 'requestLoginOtp']);
});

// Apply to all API routes
Route::middleware(['throttle:api'])->group(function () {
    // ... existing routes
});
```

**Step 3: Custom Rate Limit Response**
```php
// app/Http/Middleware/ThrottleRequests.php (override)

protected function buildException($key, $maxAttempts)
{
    $retryAfter = $this->limiter->availableIn($key);
    
    return response()->json([
        'success' => false,
        'message' => 'Too many requests. Please try again later.',
        'retry_after' => $retryAfter,
        'error_code' => 'RATE_LIMIT_EXCEEDED'
    ], 429);
}
```

### 4.2 Input Validation Middleware

#### **A. Create Validation Middleware**

```php
// microservices/scholarship_service/app/Http/Middleware/ValidateInput.php

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateInput
{
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize all input
        $this->sanitizeInput($request);
        
        // Detect malicious patterns
        if ($this->detectMaliciousInput($request)) {
            \Log::warning('Malicious input detected', [
                'ip' => $request->ip(),
                'path' => $request->path(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected',
                'error_code' => 'INVALID_INPUT'
            ], 400);
        }
        
        return $next($request);
    }
    
    private function sanitizeInput(Request $request): void
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove null bytes
                $value = str_replace("\0", '', $value);
                
                // Trim whitespace
                $value = trim($value);
                
                // Remove control characters (except newline and tab)
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
            }
        });
        
        $request->merge($input);
    }
    
    private function detectMaliciousInput(Request $request): bool
    {
        $input = json_encode($request->all());
        
        // SQL injection patterns
        $sqlPatterns = [
            '/(\bunion\b.*\bselect\b)/i',
            '/(\bselect\b.*\bfrom\b)/i',
            '/(\binsert\b.*\binto\b)/i',
            '/(\bdelete\b.*\bfrom\b)/i',
            '/(\bdrop\b.*\btable\b)/i',
            '/(\bor\b.*=.*)/i',
            '/\'.*--/',
            '/;.*drop/i'
        ];
        
        // XSS patterns
        $xssPatterns = [
            '/<script\b[^>]*>.*?<\/script>/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe\b/i',
            '/<object\b/i',
            '/<embed\b/i'
        ];
        
        // Command injection patterns
        $commandPatterns = [
            '/;.*\b(cat|ls|pwd|whoami|wget|curl)\b/i',
            '/\|.*\b(cat|ls|pwd|whoami)\b/i',
            '/`.*`/',
            '/\$\(.*\)/'
        ];
        
        $allPatterns = array_merge($sqlPatterns, $xssPatterns, $commandPatterns);
        
        foreach ($allPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
}
```

**B. Apply Middleware**
```php
// microservices/scholarship_service/bootstrap/app.php

->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(prepend: [
        \App\Http\Middleware\ValidateInput::class,
    ]);
})
```

### 4.3 API Key Authentication for Microservices

#### **A. Create API Key Middleware**

```php
// microservices/aid_service/app/Http/Middleware/ApiKeyAuth.php

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');
        $serviceName = $request->header('X-Service-Name');
        
        // Validate API key
        if (!$this->isValidApiKey($apiKey, $serviceName)) {
            \Log::warning('Invalid API key attempt', [
                'ip' => $request->ip(),
                'service' => $serviceName,
                'path' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Invalid API key',
                'error_code' => 'INVALID_API_KEY'
            ], 401);
        }
        
        // Add service context to request
        $request->merge(['calling_service' => $serviceName]);
        
        return $next($request);
    }
    
    private function isValidApiKey(?string $apiKey, ?string $serviceName): bool
    {
        if (!$apiKey || !$serviceName) {
            return false;
        }
        
        // Get valid API keys from config/environment
        $validKeys = [
            'auth_service' => config('services.auth_service.api_key'),
            'scholarship_service' => config('services.scholarship_service.api_key'),
            'aid_service' => config('services.aid_service.api_key'),
            'monitoring_service' => config('services.monitoring_service.api_key'),
        ];
        
        return isset($validKeys[$serviceName]) 
            && hash_equals($validKeys[$serviceName], $apiKey);
    }
}
```

**B. Environment Configuration**
```env
# .env for each microservice

# Auth Service
AUTH_SERVICE_API_KEY=auth_key_secure_random_string_here_32_chars

# Scholarship Service
SCHOLARSHIP_SERVICE_API_KEY=scholarship_key_secure_random_32_chars

# Aid Service
AID_SERVICE_API_KEY=aid_key_secure_random_string_32_chars

# Monitoring Service
MONITORING_SERVICE_API_KEY=monitoring_key_secure_random_32_chars
```

**C. Update Service Configuration**
```php
// config/services.php (all microservices)

return [
    'auth_service' => [
        'url' => env('AUTH_SERVICE_URL', 'http://localhost:8000'),
        'api_key' => env('AUTH_SERVICE_API_KEY'),
    ],
    
    'scholarship_service' => [
        'url' => env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8001'),
        'api_key' => env('SCHOLARSHIP_SERVICE_API_KEY'),
    ],
    
    'aid_service' => [
        'url' => env('AID_SERVICE_URL', 'http://localhost:8002'),
        'api_key' => env('AID_SERVICE_API_KEY'),
    ],
    
    'monitoring_service' => [
        'url' => env('MONITORING_SERVICE_URL', 'http://localhost:8003'),
        'api_key' => env('MONITORING_SERVICE_API_KEY'),
    ],
];
```

**D. Update HTTP Client Calls**
```php
// Example: Scholarship service calling Auth service

use Illuminate\Support\Facades\Http;

$response = Http::timeout(5)
    ->withHeaders([
        'X-API-Key' => config('services.auth_service.api_key'),
        'X-Service-Name' => 'scholarship_service',
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json'
    ])
    ->get(config('services.auth_service.url') . '/api/user');
```

### 4.4 Request Signing (HMAC)

#### **A. Create Request Signing Middleware**

```php
// microservices/aid_service/app/Http/Middleware/VerifyRequestSignature.php

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyRequestSignature
{
    private const SIGNATURE_TTL = 300; // 5 minutes
    
    public function handle(Request $request, Closure $next): Response
    {
        // Skip signature verification for certain routes
        if ($this->shouldSkipSignature($request)) {
            return $next($request);
        }
        
        $signature = $request->header('X-Signature');
        $timestamp = $request->header('X-Timestamp');
        $serviceName = $request->header('X-Service-Name');
        
        // Validate presence
        if (!$signature || !$timestamp || !$serviceName) {
            return $this->unauthorizedResponse('Missing signature headers');
        }
        
        // Validate timestamp (prevent replay attacks)
        if (!$this->isValidTimestamp($timestamp)) {
            return $this->unauthorizedResponse('Request expired or invalid timestamp');
        }
        
        // Verify signature
        if (!$this->verifySignature($request, $signature, $timestamp, $serviceName)) {
            \Log::warning('Invalid request signature', [
                'service' => $serviceName,
                'path' => $request->path(),
                'timestamp' => $timestamp
            ]);
            
            return $this->unauthorizedResponse('Invalid signature');
        }
        
        return $next($request);
    }
    
    private function verifySignature(Request $request, string $signature, string $timestamp, string $serviceName): bool
    {
        // Get shared secret for the calling service
        $secret = $this->getSharedSecret($serviceName);
        
        if (!$secret) {
            return false;
        }
        
        // Build signature payload
        $payload = implode('|', [
            $request->method(),
            $request->path(),
            $timestamp,
            $request->getContent()
        ]);
        
        // Calculate expected signature
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        
        // Timing-safe comparison
        return hash_equals($expectedSignature, $signature);
    }
    
    private function isValidTimestamp(string $timestamp): bool
    {
        if (!is_numeric($timestamp)) {
            return false;
        }
        
        $requestTime = (int) $timestamp;
        $currentTime = time();
        
        // Check if timestamp is within acceptable range
        return abs($currentTime - $requestTime) <= self::SIGNATURE_TTL;
    }
    
    private function getSharedSecret(string $serviceName): ?string
    {
        $secrets = [
            'auth_service' => config('services.auth_service.shared_secret'),
            'scholarship_service' => config('services.scholarship_service.shared_secret'),
            'monitoring_service' => config('services.monitoring_service.shared_secret'),
        ];
        
        return $secrets[$serviceName] ?? null;
    }
    
    private function shouldSkipSignature(Request $request): bool
    {
        $skipPaths = [
            'health',
            'api/health',
        ];
        
        foreach ($skipPaths as $path) {
            if ($request->is($path)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error_code' => 'INVALID_SIGNATURE'
        ], 401);
    }
}
```

**B. Signing Helper Class**

```php
// app/Services/RequestSigner.php

<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;

class RequestSigner
{
    public static function signRequest(PendingRequest $request, string $method, string $path, string $body, string $targetService): PendingRequest
    {
        $timestamp = time();
        $serviceName = config('app.service_name', 'unknown_service');
        $secret = config("services.{$targetService}.shared_secret");
        
        // Build signature payload
        $payload = implode('|', [
            strtoupper($method),
            $path,
            $timestamp,
            $body
        ]);
        
        // Calculate signature
        $signature = hash_hmac('sha256', $payload, $secret);
        
        // Add headers
        return $request->withHeaders([
            'X-Signature' => $signature,
            'X-Timestamp' => (string) $timestamp,
            'X-Service-Name' => $serviceName,
        ]);
    }
}
```

**C. Usage Example**

```php
use App\Services\RequestSigner;
use Illuminate\Support\Facades\Http;

$body = json_encode(['key' => 'value']);
$path = '/api/applications';

$request = Http::timeout(10);
$request = RequestSigner::signRequest($request, 'POST', $path, $body, 'scholarship_service');

$response = $request->post(
    config('services.scholarship_service.url') . $path,
    json_decode($body, true)
);
```

### 4.5 Security Headers Middleware

```php
// app/Http/Middleware/SecurityHeaders.php

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');
        
        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Enable XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Force HTTPS (if in production)
        if (config('app.env') === 'production') {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        
        // Content Security Policy
        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]);
        $response->headers->set('Content-Security-Policy', $csp);
        
        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions Policy
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        return $response;
    }
}
```

### 4.6 Data Encryption at Rest

#### **A. Install Encryption Package**

```bash
composer require pragmarx/laravel-encryption
```

#### **B. Create Encryption Service**

```php
// app/Services/DataEncryptionService.php

<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

class DataEncryptionService
{
    /**
     * Encrypt sensitive data
     */
    public static function encrypt(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        
        try {
            return Crypt::encryptString((string) $value);
        } catch (\Exception $e) {
            \Log::error('Encryption failed', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Decrypt sensitive data
     */
    public static function decrypt(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            \Log::error('Decryption failed', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
```

#### **C. Create Encrypted Cast Trait**

```php
// app/Traits/HasEncryptedAttributes.php

<?php

namespace App\Traits;

use App\Services\DataEncryptionService;

trait HasEncryptedAttributes
{
    /**
     * Get encrypted attributes
     */
    abstract protected function getEncryptedAttributes(): array;
    
    /**
     * Get an attribute
     */
    public function getAttribute($key)
    {
        $value = parent::getAttribute($key);
        
        if (in_array($key, $this->getEncryptedAttributes()) && $value !== null) {
            return DataEncryptionService::decrypt($value);
        }
        
        return $value;
    }
    
    /**
     * Set an attribute
     */
    public function setAttribute($key, $value)
    {
        if (in_array($key, $this->getEncryptedAttributes()) && $value !== null) {
            $value = DataEncryptionService::encrypt($value);
        }
        
        return parent::setAttribute($key, $value);
    }
}
```

#### **D. Usage in Models**

```php
// app/Models/Student.php

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasEncryptedAttributes;

class Student extends Model
{
    use HasEncryptedAttributes;
    
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'citizen_id',
        'phone',
        'address',
        // ... other fields
    ];
    
    /**
     * Define which attributes should be encrypted
     */
    protected function getEncryptedAttributes(): array
    {
        return [
            'citizen_id',
            'phone',
            'address',
        ];
    }
}
```

### 4.7 Role-Based Access Control (RBAC)

```php
// app/Http/Middleware/CheckRole.php

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->input('auth_user');
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No user data',
                'error_code' => 'NO_USER_DATA'
            ], 401);
        }
        
        $userRole = $user['role'] ?? null;
        
        if (!$userRole || !in_array($userRole, $roles)) {
            \Log::warning('Unauthorized role access attempt', [
                'user_id' => $user['id'] ?? null,
                'user_role' => $userRole,
                'required_roles' => $roles,
                'path' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Insufficient permissions',
                'error_code' => 'INSUFFICIENT_PERMISSIONS',
                'required_roles' => $roles
            ], 403);
        }
        
        return $next($request);
    }
}
```

**Usage:**
```php
// Register middleware alias
$middleware->alias([
    'role' => \App\Http\Middleware\CheckRole::class,
]);

// Apply to routes
Route::middleware(['auth.auth_service', 'role:admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'getUsers']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
});

Route::middleware(['auth.auth_service', 'role:admin,ssc'])->group(function () {
    Route::get('/applications/{id}/review', [ApplicationController::class, 'review']);
});
```

---

## 5. Implementation Roadmap

### Phase 1: Critical Security (Week 1-2)

#### Week 1
- [ ] **Day 1-2**: Implement rate limiting across all services
  - Auth service: Login, OTP, registration
  - Scholarship service: Document upload, application submission
  - Aid service: Payment endpoints
  
- [ ] **Day 3-4**: Deploy input validation middleware
  - Create ValidateInput middleware
  - Apply to all POST/PUT/PATCH routes
  - Test with malicious payloads

- [ ] **Day 5-7**: Implement API key authentication
  - Generate secure API keys
  - Update all microservices
  - Test inter-service communication

#### Week 2
- [ ] **Day 1-3**: Add security headers middleware
  - Implement SecurityHeaders middleware
  - Test CSP violations
  - Configure production settings

- [ ] **Day 4-5**: Deploy RBAC middleware
  - Create CheckRole middleware
  - Update all protected routes
  - Test role-based access

- [ ] **Day 6-7**: Security testing & fixes
  - Penetration testing
  - Fix identified issues
  - Document changes

### Phase 2: Enhanced Security (Week 3-4)

#### Week 3
- [ ] **Day 1-3**: Implement request signing (HMAC)
  - Create VerifyRequestSignature middleware
  - Implement RequestSigner service
  - Update HTTP clients

- [ ] **Day 4-5**: Data encryption at rest
  - Implement DataEncryptionService
  - Update models with encryption
  - Migrate existing data

- [ ] **Day 6-7**: Audit log enhancements
  - Centralized logging
  - Real-time alerts
  - Log integrity protection

#### Week 4
- [ ] **Day 1-2**: Session management
  - Implement session timeout
  - Concurrent session handling
  - Session activity tracking

- [ ] **Day 3-4**: IP whitelisting for admin
  - Create IP whitelist middleware
  - Configure allowed IPs
  - Test restrictions

- [ ] **Day 5-7**: Security documentation & training
  - Update API documentation
  - Create security guidelines
  - Team training session

### Phase 3: Advanced Security (Week 5-6)

- [ ] Multi-factor authentication (MFA)
- [ ] Intrusion detection system (IDS)
- [ ] Web application firewall (WAF)
- [ ] Security monitoring dashboard
- [ ] Automated security scanning
- [ ] Compliance reporting (GDPR, etc.)

---

## 6. Security Best Practices

### 6.1 Development Guidelines

#### **Environment Variables**
```env
# NEVER commit these to git
# Use strong, random values in production

# API Keys (minimum 32 characters)
AUTH_SERVICE_API_KEY=use_openssl_rand_-base64_32_here
SCHOLARSHIP_SERVICE_API_KEY=use_openssl_rand_-base64_32_here

# Shared Secrets (minimum 64 characters)
AUTH_SERVICE_SHARED_SECRET=use_openssl_rand_-base64_64_here

# Database Encryption Key
APP_KEY=base64:your_laravel_key_here

# JWT Secret (if using JWT)
JWT_SECRET=use_openssl_rand_-base64_32_here
```

#### **Generate Secure Keys**
```bash
# Generate API key
openssl rand -base64 32

# Generate shared secret
openssl rand -base64 64

# Generate Laravel app key
php artisan key:generate
```

### 6.2 Deployment Checklist

#### **Pre-Production**
- [ ] All API keys rotated to production values
- [ ] Rate limiting configured appropriately
- [ ] Debug mode disabled (`APP_DEBUG=false`)
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domains only
- [ ] Database credentials secured
- [ ] File permissions set correctly
- [ ] Audit logging enabled
- [ ] Error logging configured
- [ ] Backup strategy in place

#### **Production Monitoring**
- [ ] Set up security monitoring
- [ ] Configure log aggregation
- [ ] Enable real-time alerts
- [ ] Monitor failed authentication attempts
- [ ] Track API usage patterns
- [ ] Review audit logs regularly
- [ ] Schedule security scans
- [ ] Plan incident response procedures

### 6.3 Code Review Checklist

- [ ] No hardcoded credentials
- [ ] Input validation on all user input
- [ ] SQL queries use parameter binding
- [ ] Authentication required on protected endpoints
- [ ] Authorization checks on sensitive operations
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak information
- [ ] Audit logging for critical operations
- [ ] Rate limiting on authentication endpoints
- [ ] CSRF protection on state-changing operations

---

## 7. Testing Security Implementation

### 7.1 Rate Limiting Test

```bash
# Test auth rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done
```

### 7.2 Input Validation Test

```bash
# Test SQL injection protection
curl -X POST http://localhost:8001/api/students \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John'\'' OR 1=1--","last_name":"Doe"}'

# Test XSS protection
curl -X POST http://localhost:8001/api/students \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"<script>alert(1)</script>","last_name":"Doe"}'
```

### 7.3 API Key Authentication Test

```bash
# Test without API key (should fail)
curl -X GET http://localhost:8002/api/disbursements

# Test with valid API key (should succeed)
curl -X GET http://localhost:8002/api/disbursements \
  -H "X-API-Key: your_api_key_here" \
  -H "X-Service-Name: scholarship_service"
```

### 7.4 Security Headers Test

```bash
# Check security headers
curl -I http://localhost:8000/api/health | grep -E "(X-Frame|X-Content|X-XSS|Strict-Transport|Content-Security)"
```

---

## 8. Emergency Response

### 8.1 Security Incident Response

#### **If API Keys Are Compromised:**
1. Immediately rotate all API keys
2. Review audit logs for unauthorized access
3. Identify affected services
4. Deploy new keys to all services
5. Monitor for unusual activity

#### **If Data Breach Detected:**
1. Isolate affected systems
2. Preserve evidence (logs, database state)
3. Assess scope of breach
4. Notify stakeholders
5. Implement fixes
6. Document incident
7. Review and improve security

### 8.2 Emergency Contacts

```
Security Team Lead: [Name] - [Email] - [Phone]
System Administrator: [Name] - [Email] - [Phone]
Database Administrator: [Name] - [Email] - [Phone]
```

---

## 9. Compliance & Regulations

### 9.1 Data Protection Compliance

#### **Data Classification**
- **Public**: School names, scholarship categories
- **Internal**: Application statistics, reports
- **Confidential**: User personal data, financial records
- **Restricted**: Passwords, API keys, encryption keys

#### **Data Retention**
- Audit logs: 7 years
- Application data: 5 years after graduation
- User accounts: Until account deletion requested
- Backup data: 30 days

#### **Data Subject Rights**
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object

---

## 10. Additional Resources

### 10.1 Security Tools

- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Security testing platform
- **SonarQube**: Code quality and security analysis
- **Snyk**: Dependency vulnerability scanning

### 10.2 Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security Best Practices](https://laravel.com/docs/security)
- [PHP Security Guide](https://www.php.net/manual/en/security.php)

---

## Summary

This security implementation guide provides a comprehensive roadmap to enhance the security posture of the GSM Scholarship Management System. The identified gaps are categorized by severity, and detailed implementation steps are provided for each security enhancement.

**Estimated Implementation Time**: 6-8 weeks  
**Priority**: Critical security measures should be implemented within 2 weeks  
**Team Required**: 2-3 developers, 1 security reviewer

**Next Steps:**
1. Review this document with the development team
2. Prioritize security enhancements
3. Create implementation tickets
4. Begin Phase 1 implementation
5. Schedule security testing
6. Deploy to production with monitoring

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Ready for Implementation
