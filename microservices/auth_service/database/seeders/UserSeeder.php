<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@caloocan.gov.ph'],
            [
                'citizen_id' => 'ADMIN-001',
                'password' => Hash::make('admin123'),
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create staff user (Legacy John Doe removed to avoid conflict with Maria Reyes STAFF-001/ID 401)

        // Create test citizen users
        User::firstOrCreate(
            ['email' => 'citizen@example.com'],
            [
                'citizen_id' => 'CITIZEN-001',
                'password' => Hash::make('citizen123'),
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'role' => 'citizen',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'juan.delacruz@example.com'],
            [
                'citizen_id' => 'CITIZEN-002',
                'password' => Hash::make('citizen123'),
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Santos',
                'role' => 'citizen',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'ana.garcia@example.com'],
            [
                'citizen_id' => 'CITIZEN-003',
                'password' => Hash::make('citizen123'),
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'role' => 'citizen',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create additional staff users
        User::firstOrCreate(
            ['email' => 'jane.smith@caloocan.gov.ph'],
            [
                'citizen_id' => 'STAFF-007',
                'password' => Hash::make('staff123'),
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'middle_name' => 'A',
                'role' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'mike.johnson@caloocan.gov.ph'],
            [
                'citizen_id' => 'STAFF-008',
                'password' => Hash::make('staff123'),
                'first_name' => 'Mike',
                'last_name' => 'Johnson',
                'middle_name' => 'B',
                'role' => 'staff',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create partner school representative
        User::firstOrCreate(
            ['email' => 'school.rep@university.edu.ph'],
            [
                'citizen_id' => 'PS-001',
                'password' => Hash::make('psrep123'),
                'first_name' => 'Dr. Sarah',
                'last_name' => 'Wilson',
                'middle_name' => 'M',
                'role' => 'ps_rep',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Interviewer staff users are now created in StaffUserSeeder with specific IDs
    }
}