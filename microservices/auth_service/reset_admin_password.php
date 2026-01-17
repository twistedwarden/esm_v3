<?php
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'cursorai626@gmail.com';
$password = 'password123';

$user = DB::table('users')->where('email', $email)->first();

if ($user) {
    DB::table('users')->where('email', $email)->update([
        'password' => Hash::make($password),
        'status' => 'active',
        'is_active' => 1,
        'email_verified_at' => now()
    ]);
    echo "Password for $email has been reset to: $password\n";
    echo "Status set to active.\n";
} else {
    echo "User $email not found.\n";
}
