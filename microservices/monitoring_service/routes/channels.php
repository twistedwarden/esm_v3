<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Public analytics channel - accessible to admin, staff, and monitoring roles
Broadcast::channel('analytics', function ($user) {
    // Allow access if user has appropriate role
    // In development, you can return true to allow all authenticated users
    return in_array($user->role ?? 'guest', ['admin', 'staff', 'monitoring']);
});

// Private user-specific channel for personalized alerts
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
