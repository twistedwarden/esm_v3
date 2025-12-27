# GSPH Debugging Guide - System Health Check Plan

## Overview

Comprehensive debugging guide for the GoServePH (GSPH) scholarship management system. This plan covers all microservices, frontend application, environment configuration, port management, and common troubleshooting scenarios.

---

## 1. PROJECT STRUCTURE ANALYSIS

### Root Directory: `GSPH-main/`

```
GSPH-main/
├── GSM/                          # Frontend React Application
│   ├── src/                      # Source code
│   ├── dist/                     # Production build
│   ├── node_modules/             # Dependencies
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.ts            # Vite configuration
│   └── .env                      # Frontend environment variables
│
├── microservices/                # Backend Services
│   ├── auth_service/             # Authentication & User Management
│   ├── scholarship_service/      # Scholarship Programs & Applications
│   ├── aid_service/              # School Aid Distribution
│   └── monitoring_service/       # System Monitoring
│
├── start_services.bat            # Windows service starter
└── setup.sh                      # Linux setup script
```

---

## 2. MICROSERVICES HEALTH CHECK

### 2.1 Authentication Service (`auth_service/`)

**Purpose:** User authentication, registration, OTP verification, Google OAuth

**Technology Stack:**

- Laravel 11 (PHP)
- MySQL Database
- Brevo (OTP via email)

**Key Files to Check:**

```
auth_service/
├── .env                          # Environment configuration
├── config/
│   ├── database.php              # Database settings
│   ├── mail.php                  # Email/OTP configuration
│   └── services.php              # Google OAuth settings
├── routes/
│   └── api.php                   # API endpoints
├── app/
│   ├── Http/Controllers/         # Request handlers
│   └── Models/                   # Database models
└── database/
    ├── migrations/               # Database schema
    └── seeders/                  # Sample data
```

**Health Check Commands:**

```bash
# Navigate to service
cd microservices/auth_service

# Check dependencies
composer install

# Check environment
php artisan config:clear
php artisan cache:clear

# Check database connection
php artisan db:show

# Run migrations
php artisan migrate --force

# Seed database (if needed)
php artisan db:seed

# Start service
php artisan serve --port=8001
```

**Expected Port:** `8001`

**Critical Environment Variables:**

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=auth_service
DB_USERNAME=root
DB_PASSWORD=

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# Brevo OTP
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=GoServePH

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# CORS
FRONTEND_URL=http://localhost:5173
```

**Test Endpoints:**

```bash
# Health check
curl http://localhost:8001/api/health

# Test registration (without OTP)
curl -X POST http://localhost:8001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test login
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "Test123!@#"
  }'
```

---

### 2.2 Scholarship Service (`scholarship_service/`)

**Purpose:** Scholarship programs, applications, disbursements, staff management

**Technology Stack:**

- Laravel 11 (PHP)
- MySQL Database

**Key Files to Check:**

```
scholarship_service/
├── .env
├── config/
│   └── database.php
├── routes/
│   └── api.php
├── app/
│   ├── Http/Controllers/
│   │   ├── ScholarshipController.php
│   │   ├── ApplicationController.php
│   │   └── DisbursementController.php
│   └── Models/
│       ├── Scholarship.php
│       ├── Application.php
│       └── Disbursement.php
└── database/
    ├── migrations/
    └── seeders/
```

**Health Check Commands:**

```bash
cd microservices/scholarship_service

composer install
php artisan config:clear
php artisan cache:clear
php artisan db:show
php artisan migrate --force
php artisan db:seed

# Start service
php artisan serve --port=8002
```

**Expected Port:** `8002`

**Critical Environment Variables:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scholarship_service
DB_USERNAME=root
DB_PASSWORD=

# Integration with Auth Service
AUTH_SERVICE_URL=http://localhost:8001
```

**Test Endpoints:**

```bash
# Get scholarships
curl http://localhost:8002/api/scholarships

# Get applications
curl http://localhost:8002/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2.3 School Aid Service (`aid_service/`)

**Purpose:** School aid applications, payment processing, distribution tracking

**Technology Stack:**

- Laravel 11 (PHP)
- MySQL Database

**Health Check Commands:**

```bash
cd microservices/aid_service

composer install
php artisan config:clear
php artisan migrate --force

# Start service
php artisan serve --port=8003
```

**Expected Port:** `8003`

**Critical Environment Variables:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aid_service
DB_USERNAME=root
DB_PASSWORD=

AUTH_SERVICE_URL=http://localhost:8001
```

---

### 2.4 Monitoring Service (`monitoring_service/`)

**Purpose:** System health monitoring, audit logs, performance tracking

**Health Check Commands:**

```bash
cd microservices/monitoring_service

composer install
php artisan migrate --force

# Start service
php artisan serve --port=8004
```

**Expected Port:** `8004`

---

## 3. FRONTEND APPLICATION HEALTH CHECK

### 3.1 GSM React Application

**Purpose:** User interface for students, admins, staff, partner schools

**Technology Stack:**

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS
- Zustand (state management)

**Key Files to Check:**

```
GSM/
├── .env                          # Environment configuration
├── src/
│   ├── config/
│   │   ├── environment.ts        # Environment variable loader
│   │   └── api.js                # API base URLs
│   ├── store/
│   │   └── v1authStore.ts        # Authentication state
│   ├── pages/
│   │   ├── GatewayLogin.tsx      # Main login page
│   │   ├── Portal.tsx            # Student portal
│   │   └── auth/Login.tsx        # Admin login
│   └── admin/
│       └── App.tsx               # Admin dashboard
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Health Check Commands:**

```bash
cd GSM

# Install dependencies
npm install

# Check for vulnerabilities
npm audit

# Check TypeScript
npm run type-check

# Build for production
npm run build

# Start development server
npm run dev
```

**Expected Port:** `5173` (development)

**Critical Environment Variables (.env):**

```env
# API Base URLs
VITE_API_BASE_URL=http://localhost:8001/api
VITE_SCHOLARSHIP_SERVICE_URL=http://localhost:8002/api
VITE_SCHOOL_AID_SERVICE_URL=http://localhost:8003/api
VITE_MONITORING_SERVICE_URL=http://localhost:8004/api

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Dialogflow Chatbot (optional)
VITE_DIALOGFLOW_PROJECT_ID=your_project_id
VITE_DIALOGFLOW_CLIENT_ID=your_client_id

# Environment
VITE_ENV=development
```

**Test in Browser:**

```
http://localhost:5173          # Main login
http://localhost:5173/admin    # Admin dashboard
http://localhost:5173/portal   # Student portal
```

---

## 4. PORT CONFIGURATION CHECKLIST

### Default Port Assignment

```
Service                  | Port  | Status
-------------------------|-------|--------
Auth Service            | 8001  | ☐
Scholarship Service     | 8002  | ☐
School Aid Service      | 8003  | ☐
Monitoring Service      | 8004  | ☐
Frontend (Dev)          | 5173  | ☐
MySQL Database          | 3306  | ☐
```

### Port Conflict Check (Windows)

```powershell
# Check all ports
netstat -ano | findstr "8001 8002 8003 8004 5173 3306"

# Kill process on port (if needed)
taskkill /PID <PID> /F
```

### Port Conflict Check (Linux/Mac)

```bash
# Check all ports
lsof -i :8001
lsof -i :8002
lsof -i :8003
lsof -i :8004
lsof -i :5173
lsof -i :3306

# Kill process (if needed)
kill -9 <PID>
```

---

## 5. ENVIRONMENT VARIABLE VALIDATION

### 5.1 Auth Service Environment Check

**Create Validation Script:** `microservices/auth_service/check_env.php`

```php
<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 AUTH SERVICE ENVIRONMENT CHECK\n";
echo "================================\n\n";

// Database
echo "✓ DB_CONNECTION: " . env('DB_CONNECTION', 'NOT SET') . "\n";
echo "✓ DB_HOST: " . env('DB_HOST', 'NOT SET') . "\n";
echo "✓ DB_PORT: " . env('DB_PORT', 'NOT SET') . "\n";
echo "✓ DB_DATABASE: " . env('DB_DATABASE', 'NOT SET') . "\n";

// JWT
$jwt = env('JWT_SECRET', 'NOT SET');
echo "✓ JWT_SECRET: " . ($jwt !== 'NOT SET' ? 'SET (length: ' . strlen($jwt) . ')' : 'NOT SET') . "\n";

// Brevo OTP
$brevoKey = env('BREVO_API_KEY', 'NOT SET');
echo "✓ BREVO_API_KEY: " . ($brevoKey !== 'NOT SET' ? 'SET' : 'NOT SET') . "\n";
echo "✓ BREVO_SENDER_EMAIL: " . env('BREVO_SENDER_EMAIL', 'NOT SET') . "\n";

// Google OAuth
$googleId = env('GOOGLE_CLIENT_ID', 'NOT SET');
echo "✓ GOOGLE_CLIENT_ID: " . ($googleId !== 'NOT SET' ? 'SET' : 'NOT SET (Optional)') . "\n";

// CORS
echo "✓ FRONTEND_URL: " . env('FRONTEND_URL', 'NOT SET') . "\n";

echo "\n✅ Environment check complete!\n";
```

**Run:** `php check_env.php`

---

### 5.2 Frontend Environment Check

**Create Validation Script:** `GSM/check_env.js`

```javascript
import fs from "fs";
import path from "path";

console.log("🔍 FRONTEND ENVIRONMENT CHECK");
console.log("==============================\n");

const envPath = path.resolve(process.cwd(), ".env");

if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found!");
  console.log("📝 Create .env file from .env.example");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = envContent.split("\n").reduce((acc, line) => {
  const [key, value] = line.split("=");
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

// Required variables
const required = [
  "VITE_API_BASE_URL",
  "VITE_SCHOLARSHIP_SERVICE_URL",
  "VITE_SCHOOL_AID_SERVICE_URL",
];

// Optional variables
const optional = ["VITE_GOOGLE_CLIENT_ID", "VITE_DIALOGFLOW_PROJECT_ID"];

console.log("Required Variables:");
required.forEach((key) => {
  const value = envVars[key];
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log("\nOptional Variables:");
optional.forEach((key) => {
  const value = envVars[key];
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`⚠️  ${key}: NOT SET (Optional)`);
  }
});

console.log("\n✅ Environment check complete!\n");
```

**Run:** `node check_env.js`

---

## 6. DATABASE HEALTH CHECK

### 6.1 MySQL Connection Test

**Test Script:** `test_db_connection.php`

```php
<?php
function testDBConnection($service, $host, $port, $database, $username, $password) {
    echo "\n🔍 Testing $service...\n";

    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        echo "✅ Connected to $service successfully!\n";

        // Test query
        $stmt = $pdo->query("SELECT DATABASE()");
        $db = $stmt->fetchColumn();
        echo "   Current database: $db\n";

        // Check tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Tables found: " . count($tables) . "\n";

        return true;
    } catch (PDOException $e) {
        echo "❌ Connection failed: " . $e->getMessage() . "\n";
        return false;
    }
}

// Test all services
testDBConnection('Auth Service', '127.0.0.1', 3306, 'auth_service', 'root', '');
testDBConnection('Scholarship Service', '127.0.0.1', 3306, 'scholarship_service', 'root', '');
testDBConnection('Aid Service', '127.0.0.1', 3306, 'aid_service', 'root', '');
testDBConnection('Monitoring Service', '127.0.0.1', 3306, 'monitoring_service', 'root', '');

echo "\n✅ Database check complete!\n";
```

---

## 7. COMMON ISSUES & SOLUTIONS

### Issue 1: React Error #300 (Hooks)

**Symptom:** "Minified React error #300" after login
**Cause:** Hook called after early return
**Solution:** Move all hooks before early returns
**Reference:** `REACT_ERROR_300_FIX.md`

---

### Issue 2: CORS Errors

**Symptom:** "Access-Control-Allow-Origin" error in browser console
**Fix in Laravel services:** `config/cors.php`

```php
return [
    'paths' => ['api/*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'https://edu.goserveph.com'
    ],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
```

---

### Issue 3: JWT Token Expired

**Symptom:** "Token expired" or 401 errors
**Solution:**

```bash
# In auth_service
php artisan jwt:secret
```

Update `.env`:

```env
JWT_TTL=60  # Token lifetime in minutes
```

---

### Issue 4: Database Migration Errors

**Symptom:** "Table already exists" or migration conflicts
**Solution:**

```bash
# Reset database (WARNING: Data loss)
php artisan migrate:fresh --seed

# Or rollback and re-migrate
php artisan migrate:rollback
php artisan migrate
```

---

### Issue 5: OTP Not Sending

**Symptom:** No OTP email received
**Debug Steps:**

1. Check Brevo API key in `.env`
2. Check sender email is verified in Brevo
3. Test Brevo connection:

```bash
cd microservices/auth_service
php test-otp-integration.php
```

---

### Issue 6: Google OAuth Not Working

**Symptom:** Google sign-in button not appearing or failing
**Debug Steps:**

1. Check `VITE_GOOGLE_CLIENT_ID` in frontend `.env`
2. Check `GOOGLE_CLIENT_ID` in auth service `.env`
3. Verify redirect URI in Google Console matches your app
4. Check browser console for Google script loading errors

---

### Issue 7: Frontend Build Errors

**Symptom:** `npm run build` fails
**Solution:**

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Fix linting issues
npm run lint -- --fix
```

---

### Issue 8: Port Already in Use

**Symptom:** "Address already in use" when starting service
**Solution (Windows):**

```powershell
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

**Solution (Linux/Mac):**

```bash
lsof -ti:8001 | xargs kill -9
```

---

## 8. STARTUP SEQUENCE

### Recommended Order:

1. ✅ Start MySQL
2. ✅ Start Auth Service (port 8001)
3. ✅ Start Scholarship Service (port 8002)
4. ✅ Start Aid Service (port 8003)
5. ✅ Start Monitoring Service (port 8004)
6. ✅ Start Frontend (port 5173)

### Windows Batch Script: `start_all_services.bat`

```batch
@echo off
echo Starting GSPH Services...

REM Start Auth Service
start "Auth Service" cmd /k "cd microservices\auth_service && php artisan serve --port=8001"
timeout /t 3

REM Start Scholarship Service
start "Scholarship Service" cmd /k "cd microservices\scholarship_service && php artisan serve --port=8002"
timeout /t 3

REM Start Aid Service
start "Aid Service" cmd /k "cd microservices\aid_service && php artisan serve --port=8003"
timeout /t 3

REM Start Monitoring Service
start "Monitoring Service" cmd /k "cd microservices\monitoring_service && php artisan serve --port=8004"
timeout /t 3

REM Start Frontend
start "Frontend" cmd /k "cd GSM && npm run dev"

echo All services started!
pause
```

### Linux/Mac Shell Script: `start_all_services.sh`

```bash
#!/bin/bash

echo "Starting GSPH Services..."

# Start Auth Service
cd microservices/auth_service
php artisan serve --port=8001 &
sleep 2

# Start Scholarship Service
cd ../scholarship_service
php artisan serve --port=8002 &
sleep 2

# Start Aid Service
cd ../aid_service
php artisan serve --port=8003 &
sleep 2

# Start Monitoring Service
cd ../monitoring_service
php artisan serve --port=8004 &
sleep 2

# Start Frontend
cd ../../GSM
npm run dev &

echo "All services started!"
```

---

## 9. HEALTH CHECK DASHBOARD

### Create: `health_check.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <title>GSPH Health Check</title>
    <style>
      body {
        font-family: Arial;
        padding: 20px;
      }
      .service {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ddd;
      }
      .online {
        background: #d4edda;
      }
      .offline {
        background: #f8d7da;
      }
    </style>
  </head>
  <body>
    <h1>GSPH System Health Check</h1>
    <div id="services"></div>

    <script>
      const services = [
        { name: "Auth Service", url: "http://localhost:8001/api/health" },
        {
          name: "Scholarship Service",
          url: "http://localhost:8002/api/health",
        },
        { name: "Aid Service", url: "http://localhost:8003/api/health" },
        { name: "Monitoring Service", url: "http://localhost:8004/api/health" },
        { name: "Frontend", url: "http://localhost:5173" },
      ];

      const container = document.getElementById("services");

      services.forEach(async (service) => {
        const div = document.createElement("div");
        div.className = "service";
        div.innerHTML = `<strong>${service.name}</strong>: Checking...`;
        container.appendChild(div);

        try {
          const response = await fetch(service.url);
          if (response.ok) {
            div.className = "service online";
            div.innerHTML = `<strong>${service.name}</strong>: ✅ Online`;
          } else {
            div.className = "service offline";
            div.innerHTML = `<strong>${service.name}</strong>: ❌ Offline (${response.status})`;
          }
        } catch (error) {
          div.className = "service offline";
          div.innerHTML = `<strong>${service.name}</strong>: ❌ Offline (${error.message})`;
        }
      });
    </script>
  </body>
</html>
```

---

## 10. MONITORING & LOGS

### Log Locations:

```
auth_service/storage/logs/laravel.log
scholarship_service/storage/logs/laravel.log
aid_service/storage/logs/laravel.log
monitoring_service/storage/logs/laravel.log
```

### View Real-time Logs:

```bash
# Windows
type microservices\auth_service\storage\logs\laravel.log

# Linux/Mac
tail -f microservices/auth_service/storage/logs/laravel.log
```

### Clear Logs:

```bash
cd microservices/auth_service
php artisan log:clear
```

---

## 11. QUICK DEBUG CHECKLIST

Use this checklist when debugging issues:

```
☐ 1. Check all services are running (ports 8001-8004, 5173)
☐ 2. Check database connections (MySQL on 3306)
☐ 3. Verify .env files exist and are configured
☐ 4. Check CORS settings in Laravel services
☐ 5. Verify JWT_SECRET is set in auth service
☐ 6. Check frontend API URLs match backend ports
☐ 7. Clear Laravel cache (config:clear, cache:clear)
☐ 8. Clear browser cache and localStorage
☐ 9. Check browser console for JavaScript errors
☐ 10. Check Laravel logs for backend errors
☐ 11. Verify database tables exist (run migrations)
☐ 12. Test API endpoints with curl or Postman
☐ 13. Check network tab in browser DevTools
☐ 14. Verify authentication tokens are valid
☐ 15. Check for port conflicts
```

---

## 12. TESTING CHECKLIST

### Manual Testing Checklist:

```
Authentication:
☐ User registration (email/password)
☐ User registration (Google OAuth)
☐ User login (email/password)
☐ User login (Google OAuth)
☐ OTP verification
☐ Password reset
☐ Logout

Student Portal:
☐ View scholarships
☐ Apply for scholarship
☐ View application status
☐ Upload documents
☐ Renewal application

Admin Dashboard:
☐ View all applications
☐ Approve/reject applications
☐ Manage scholarships
☐ View reports
☐ Export data

School Aid:
☐ Submit aid application
☐ Track payment status
☐ View distribution history

Partner School:
☐ View assigned students
☐ Submit academic reports
☐ Track disbursements
```

---

## 13. PERFORMANCE OPTIMIZATION

### Frontend Optimization:

- Enable code splitting
- Lazy load components
- Optimize images
- Use production build

### Backend Optimization:

- Enable query caching
- Use eager loading for relationships
- Add database indexes
- Enable OPcache for PHP

---

## 14. SECURITY CHECKLIST

```
☐ All API endpoints require authentication
☐ CORS properly configured
☐ JWT tokens expire appropriately
☐ Sensitive data encrypted
☐ SQL injection prevention (use prepared statements)
☐ XSS prevention (escape user input)
☐ CSRF protection enabled
☐ HTTPS enabled in production
☐ Environment variables not exposed
☐ File upload validation
```

---

## 15. DEPLOYMENT CHECKLIST

Before deploying to production:

```
☐ Update all .env files with production values
☐ Set APP_ENV=production
☐ Set APP_DEBUG=false
☐ Generate new JWT_SECRET
☐ Update FRONTEND_URL to production domain
☐ Update CORS allowed origins
☐ Run database migrations
☐ Build frontend (npm run build)
☐ Test all critical user flows
☐ Set up SSL certificates
☐ Configure firewall rules
☐ Set up backup strategy
☐ Configure monitoring alerts
```

---

## CONTACT & SUPPORT

For issues not covered in this guide:

1. Check `REACT_ERROR_300_FIX.md` for React-specific issues
2. Check `IMPLEMENTATION_PLAN_CLEAN.md` for architecture details
3. Review service-specific README files
4. Check Laravel logs in `storage/logs/`

---

**Last Updated:** October 17, 2025
**Version:** 1.0
