<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class StaffUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $staffUsers = [
            [
                'id' => 401,
                'citizen_id' => 'STAFF-001',
                'email' => 'maria.reyes@scholarship.gov.ph',
                'password' => Hash::make('password123'),
                'first_name' => 'Maria',
                'last_name' => 'Reyes',
                'middle_name' => 'Santos',
                'role' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
                'mobile' => '+63-912-345-6790',
                'address' => 'Caloocan City, Metro Manila',
                'status' => 'active',
            ],
            [
                'id' => 402,
                'citizen_id' => 'STAFF-002',
                'email' => 'john.cruz@scholarship.gov.ph',
                'password' => Hash::make('password123'),
                'first_name' => 'John',
                'last_name' => 'Cruz',
                'middle_name' => 'Reyes',
                'role' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
                'mobile' => '+63-912-345-6791',
                'address' => 'Caloocan City, Metro Manila',
                'status' => 'active',
            ],
            [
                'id' => 403,
                'citizen_id' => 'STAFF-003',
                'email' => 'ana.lopez@scholarship.gov.ph',
                'password' => Hash::make('password123'),
                'first_name' => 'Ana',
                'last_name' => 'Lopez',
                'middle_name' => 'Maria',
                'role' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
                'mobile' => '+63-912-345-6792',
                'address' => 'Caloocan City, Metro Manila',
                'status' => 'active',
            ],
        ];

        foreach ($staffUsers as $userData) {
            // Check if user already exists
            $existingUser = User::where('email', $userData['email'])
                ->orWhere('citizen_id', $userData['citizen_id'])
                ->first();

            if (!$existingUser) {
                $user = User::forceCreate($userData);
                $this->command->info("Created staff user: {$user->first_name} {$user->last_name} (ID: {$user->id})");
            } else {
                $this->command->info("Staff user already exists: {$existingUser->first_name} {$existingUser->last_name} (ID: {$existingUser->id})");
            }
        }

        $this->command->info('Staff users seeding completed.');
    }
}
