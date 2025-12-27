@echo off
echo Running migration to add assigned_school_id to users table...

cd microservices\auth_service
php artisan migrate
echo Migration completed!

echo.
echo Please restart the auth service for changes to take effect.
pause
