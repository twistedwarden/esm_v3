<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUsers = [
            [
                'id' => 100,
                'citizen_id' => 'ADM001',
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'middle_name' => null,
                'extension_name' => null,
                'email' => 'cursorai626@gmail.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'mobile' => '+63-2-8888-0001',
                'address' => 'Caloocan City Hall',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // [
            //     'id' => 101,
            //     'citizen_id' => 'ADM002',
            //     'first_name' => 'Maria',
            //     'last_name' => 'Santos',
            //     'middle_name' => 'C.',
            //     'extension_name' => 'Ms.',
            //     'email' => 'maria.santos@caloocan.gov.ph',
            //     'password' => Hash::make('admin123'),
            //     'role' => 'admin',
            //     'mobile' => '+63-2-8888-0002',
            //     'address' => 'Caloocan City Hall',
            //     'house_number' => '',
            //     'street' => 'A. Mabini Street',
            //     'barangay' => 'Barangay 1',
            //     'is_active' => true,
            //     'status' => 'active',
            //     'email_verified_at' => now(),
            //     'created_at' => now(),
            //     'updated_at' => now(),
            // ],
            // [
            //     'id' => 102,
            //     'citizen_id' => 'ADM003',
            //     'first_name' => 'Juan',
            //     'last_name' => 'Cruz',
            //     'middle_name' => 'M.',
            //     'extension_name' => 'Mr.',
            //     'email' => 'juan.cruz@caloocan.gov.ph',
            //     'password' => Hash::make('admin123'),
            //     'role' => 'admin',
            //     'mobile' => '+63-2-8888-0003',
            //     'address' => 'Caloocan City Hall',
            //     'house_number' => '',
            //     'street' => 'A. Mabini Street',
            //     'barangay' => 'Barangay 1',
            //     'is_active' => true,
            //     'status' => 'active',
            //     'email_verified_at' => now(),
            //     'created_at' => now(),
            //     'updated_at' => now(),
            // ],
        ];

        // Insert admin users
        foreach ($adminUsers as $user) {
            DB::table('users')->updateOrInsert(
                ['id' => $user['id']],
                $user
            );
        }

        $this->command->info('Admin users seeded successfully!');
        $this->command->info('Total admin users created: ' . count($adminUsers));

        $this->command->table(
            ['ID', 'Name', 'Email', 'Role', 'Status'],
            collect($adminUsers)->map(function ($user) {
                $fullName = trim(($user['extension_name'] ?? '') . ' ' . $user['first_name'] . ' ' . ($user['middle_name'] ?? '') . ' ' . $user['last_name']);
                return [
                    $user['id'],
                    $fullName,
                    $user['email'],
                    $user['role'],
                    $user['is_active'] ? 'Active' : 'Inactive'
                ];
            })->toArray()
        );

        $this->command->warn('Default password for all admin users: admin123');
        $this->command->warn('Please change passwords in production environment!');
    }
}
