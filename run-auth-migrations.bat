@echo off
REM Script to run migrations on Railway auth service (Windows)
REM Usage: run-auth-migrations.bat

echo ==========================================
echo Auth Service Migration Runner
echo ==========================================
echo.

REM Check if railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Railway CLI is not installed.
    echo.
    echo Please install it first:
    echo   npm install -g @railway/cli
    echo.
    pause
    exit /b 1
)

echo [OK] Railway CLI is installed
echo.

REM Navigate to auth service directory
cd microservices\auth_service

REM Check if we're in the right directory
if not exist "artisan" (
    echo [X] Error: artisan file not found. Make sure you're running this from the project root.
    pause
    exit /b 1
)

echo [OK] Found auth service directory
echo.

REM Check if logged in to Railway
echo Checking Railway login status...
railway whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Not logged in to Railway. Logging in...
    railway login
    if %ERRORLEVEL% NEQ 0 (
        echo [X] Failed to login to Railway
        pause
        exit /b 1
    )
)

echo [OK] Logged in to Railway
echo.

REM Link to project if not already linked
echo Linking to Railway project...
railway link
if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to link to Railway project
    pause
    exit /b 1
)

echo [OK] Linked to Railway project
echo.

REM Show current migration status
echo Current migration status:
echo ----------------------------------------
railway run php artisan migrate:status
echo ----------------------------------------
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to run migrations now? (y/n): "
if /i "%CONFIRM%" NEQ "y" (
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo Running migrations...
echo ----------------------------------------
railway run php artisan migrate --force
echo ----------------------------------------
echo.

if %ERRORLEVEL% EQU 0 (
    echo [OK] Migrations completed successfully!
    echo.
    echo New migration status:
    echo ----------------------------------------
    railway run php artisan migrate:status
    echo ----------------------------------------
) else (
    echo [X] Migrations failed!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Migration process completed!
echo ==========================================
echo.
echo You can now try creating users with SSC roles.
echo.
pause

