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
                'first_name' => 'Maria',
                'last_name' => 'Rodriguez',
                'middle_name' => 'C.',
                'extension_name' => 'Prof.',
                'email' => 'maria.rodriguez@up.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0001',
                'address' => 'University of the Philippines',
                'house_number' => '',
                'street' => 'Diliman Campus',
                'barangay' => 'Quezon City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 301,
                'citizen_id' => 'PSR002',
                'first_name' => 'Juan',
                'last_name' => 'Santos',
                'middle_name' => 'M.',
                'extension_name' => 'Dr.',
                'email' => 'juan.santos@ateneo.edu',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0002',
                'address' => 'Ateneo de Manila University',
                'house_number' => '',
                'street' => 'Loyola Heights',
                'barangay' => 'Quezon City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 302,
                'citizen_id' => 'PSR003',
                'first_name' => 'Ana',
                'last_name' => 'Cruz',
                'middle_name' => 'L.',
                'extension_name' => 'Ms.',
                'email' => 'ana.cruz@dlsu.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0003',
                'address' => 'De La Salle University',
                'house_number' => '',
                'street' => 'Taft Avenue',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 303,
                'citizen_id' => 'PSR004',
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'middle_name' => 'P.',
                'extension_name' => 'Engr.',
                'email' => 'carlos.mendoza@ust.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0004',
                'address' => 'University of Santo Tomas',
                'house_number' => '',
                'street' => 'España Boulevard',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 304,
                'citizen_id' => 'PSR005',
                'first_name' => 'Patricia',
                'last_name' => 'Garcia',
                'middle_name' => 'A.',
                'extension_name' => 'Dr.',
                'email' => 'patricia.garcia@feu.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0005',
                'address' => 'Far Eastern University',
                'house_number' => '',
                'street' => 'Nicanor Reyes Street',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 305,
                'citizen_id' => 'PSR006',
                'first_name' => 'Miguel',
                'last_name' => 'Torres',
                'middle_name' => 'R.',
                'extension_name' => 'Prof.',
                'email' => 'miguel.torres@mapua.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0006',
                'address' => 'Mapúa University',
                'house_number' => '',
                'street' => 'Muralla Street',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 306,
                'citizen_id' => 'PSR007',
                'first_name' => 'Sofia',
                'last_name' => 'Reyes',
                'middle_name' => 'M.',
                'extension_name' => 'Ms.',
                'email' => 'sofia.reyes@admu.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0007',
                'address' => 'Ateneo de Manila University',
                'house_number' => '',
                'street' => 'Loyola Heights',
                'barangay' => 'Quezon City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 307,
                'citizen_id' => 'PSR008',
                'first_name' => 'Roberto',
                'last_name' => 'Villanueva',
                'middle_name' => 'D.',
                'extension_name' => 'Dr.',
                'email' => 'roberto.villanueva@up.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0008',
                'address' => 'University of the Philippines',
                'house_number' => '',
                'street' => 'Diliman Campus',
                'barangay' => 'Quezon City',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 308,
                'citizen_id' => 'PSR009',
                'first_name' => 'Isabella',
                'last_name' => 'Fernandez',
                'middle_name' => 'C.',
                'extension_name' => 'Ms.',
                'email' => 'isabella.fernandez@dlsu.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0009',
                'address' => 'De La Salle University',
                'house_number' => '',
                'street' => 'Taft Avenue',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 309,
                'citizen_id' => 'PSR010',
                'first_name' => 'Antonio',
                'last_name' => 'Morales',
                'middle_name' => 'J.',
                'extension_name' => 'Prof.',
                'email' => 'antonio.morales@ust.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'ps_rep',
                'mobile' => '+63-917-100-0010',
                'address' => 'University of Santo Tomas',
                'house_number' => '',
                'street' => 'España Boulevard',
                'barangay' => 'Manila',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
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
            ['ID', 'Name', 'Email', 'Role', 'Status'],
            collect($psRepUsers)->map(function ($user) {
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

        $this->command->warn('Default password for all PS Rep users: password123');
        $this->command->warn('Please change passwords in production environment!');
    }
}
