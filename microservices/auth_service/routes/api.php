<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GsmAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PartnerSchoolAccountController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/auth/google', [AuthController::class, 'googleCallback']);
Route::post('/register/google', [AuthController::class, 'registerWithGoogle']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('auth:sanctum');

// OTP routes
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/request-login-otp', [AuthController::class, 'requestLoginOtp']);
Route::post('/login-with-otp', [AuthController::class, 'loginWithOtp']);

// GSM-compatible endpoints (migrated from sqlite PHP script)
Route::post('/gsm/login', [GsmAuthController::class, 'login']);
Route::post('/gsm/login-with-otp', [GsmAuthController::class, 'loginWithOtp']);
Route::post('/gsm/check-email', [GsmAuthController::class, 'checkEmail']);

// User management endpoints (for other services)
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'getAllUsers']);
    Route::get('/role/{role}', [UserController::class, 'getUsersByRole']);
    Route::get('/stats', [UserController::class, 'getUserStats']);
    Route::get('/{id}', [UserController::class, 'getUserById']);
    Route::post('/', [UserController::class, 'createUser']);
    Route::put('/{id}', [UserController::class, 'updateUser']);
    Route::get('/email/{email}', [UserController::class, 'getUserByEmail']);
    Route::post('/batch', [UserController::class, 'getUsersByIds']);
    Route::get('/staff', [UserController::class, 'getStaffUsers']);
    Route::put('/{id}/assign-school', [UserController::class, 'assignSchool']);
    Route::put('/{id}/unassign-school', [UserController::class, 'unassignSchool']);
    Route::put('/{id}/activate', [UserController::class, 'activateUser']);
    Route::delete('/{id}', [UserController::class, 'deleteUser']);
    Route::delete('/{id}/permanent', [UserController::class, 'permanentDeleteUser']);
});

// Settings routes (protected by authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    // User notification preferences
    Route::get('/user/notifications', [SettingsController::class, 'getNotificationPreferences']);
    Route::put('/user/notifications', [SettingsController::class, 'updateNotificationPreferences']);
    
    // System settings (admin only)
    Route::get('/admin/settings', [SettingsController::class, 'getSystemSettings']);
    Route::put('/admin/settings', [SettingsController::class, 'updateSystemSettings']);
    
    // Admin dashboard routes
    Route::get('/admin/health', [AdminController::class, 'getSystemHealth']);
    Route::get('/admin/stats', [AdminController::class, 'getAdminStats']);
    Route::post('/admin/export/{type}', [AdminController::class, 'exportData']);
    Route::post('/admin/clear-cache', [AdminController::class, 'clearCache']);
    
    // Dashboard routes
    Route::get('/dashboard/overview', [DashboardController::class, 'getOverview']);
    Route::get('/dashboard/trends', [DashboardController::class, 'getTrends']);
    Route::get('/dashboard/status-distribution', [DashboardController::class, 'getStatusDistribution']);
    Route::get('/dashboard/ssc-workflow', [DashboardController::class, 'getSSCWorkflow']);
    Route::get('/dashboard/scholarship-categories', [DashboardController::class, 'getScholarshipCategories']);
    Route::get('/dashboard/recent-activities', [DashboardController::class, 'getRecentActivities']);
    Route::get('/dashboard/top-schools', [DashboardController::class, 'getTopSchools']);
    Route::post('/dashboard/export', [DashboardController::class, 'exportReport']);
});

// Partner School Account Management (authenticated)
Route::prefix('partner-school')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/check-password-reset-required', [PartnerSchoolAccountController::class, 'checkPasswordResetRequired']);
    Route::post('/force-password-reset', [PartnerSchoolAccountController::class, 'forcePasswordReset']);
});

// Public password reset (no auth required for token-based reset)
Route::post('/partner-school/reset-password', [PartnerSchoolAccountController::class, 'resetPassword']);
