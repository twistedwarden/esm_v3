<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PartnerSchoolRepsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $psRepUsers = [
            [
                'id' => 300,
                'citizen_id' => 'PSR001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'A.',
                'extension_name' => 'Dr.',
                'email' => 'psrep@ccu.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0001',
                'address' => 'Caloocan City University',
                'house_number' => '',
                'street' => 'Main Campus',
                'barangay' => 'Caloocan City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'assigned_school_id' => 1, // CCU Main Campus
            ],
            [
                'id' => 301,
                'citizen_id' => 'PSR002',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'B.',
                'extension_name' => 'Ms.',
                'email' => 'psrep@ccshs.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0002',
                'address' => 'Caloocan City Science High School',
                'house_number' => '',
                'street' => 'Main Campus',
                'barangay' => 'Caloocan City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'assigned_school_id' => 4, // CCSHS Main Campus
            ],
            [
                'id' => 302,
                'citizen_id' => 'PSR003',
                'first_name' => 'Pedro',
                'last_name' => 'Reyes',
                'middle_name' => 'C.',
                'extension_name' => 'Mr.',
                'email' => 'psrep@ccbhs.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0003',
                'address' => 'Caloocan City Business High School',
                'house_number' => '',
                'street' => 'Main Campus',
                'barangay' => 'Caloocan City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'assigned_school_id' => 5, // CCBHS Main Campus
            ],
            [
                'id' => 303,
                'citizen_id' => 'PSR004',
                'first_name' => 'Ana',
                'last_name' => 'Lim',
                'middle_name' => 'D.',
                'extension_name' => 'Mrs.',
                'email' => 'psrep@cisths.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0004',
                'address' => 'Caloocan International Science and Technology High School',
                'house_number' => '',
                'street' => 'Main Campus',
                'barangay' => 'Caloocan City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'assigned_school_id' => 6, // CISTHS Main Campus
            ],
        ];

        // Insert partner school representative users
        foreach ($psRepUsers as $user) {
            DB::table('users')->updateOrInsert(
                ['id' => $user['id']],
                $user
            );
        }

        $this->command->info('Partner School Representative users seeded successfully!');
        $this->command->info('Total PS Rep users created: ' . count($psRepUsers));

        $this->command->table(
            ['ID', 'Name', 'Email', 'Role', 'Status', 'School ID'],
            collect($psRepUsers)->map(function ($user) {
                $fullName = trim(($user['extension_name'] ?? '') . ' ' . $user['first_name'] . ' ' . ($user['middle_name'] ?? '') . ' ' . $user['last_name']);
                return [
                    $user['id'],
                    $fullName,
                    $user['email'],
                    $user['role'],
                    $user['is_active'] ? 'Active' : 'Inactive',
                    $user['assigned_school_id']
                ];
            })->toArray()
        );

        $this->command->warn('Default password for all PS Rep users: password123');
        $this->command->warn('Please change passwords in production environment!');
    }
}
