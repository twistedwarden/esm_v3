@echo off
echo Starting GovServe PH Services...
echo.

echo Starting Auth Service on port 8000...
start "Auth Service" cmd /k "cd microservices\auth_service && php artisan serve --host=0.0.0.0 --port=8000"

echo Starting Scholarship Service on port 8001...
start "Scholarship Service" cmd /k "cd microservices\scholarship_service && php artisan serve --host=0.0.0.0 --port=8001"

echo Starting Monitoring Service on port 8002...
start "Monitoring Service" cmd /k "cd microservices\monitoring_service && php artisan serve --host=0.0.0.0 --port=8002"

echo.
echo All services are starting...
echo Auth Service: http://localhost:8000
echo Scholarship Service: http://localhost:8001
echo Monitoring Service: http://localhost:8002
echo.
echo Press any key to exit...
pause

