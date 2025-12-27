<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CitizenUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $citizenUsers = [
            [
                'id' => 200,
                'citizen_id' => 'CIT001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middle_name' => 'M.',
                'extension_name' => null,
                'email' => 'john.doe@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-123-4567',
                'address' => '123 Main Street',
                'house_number' => '123',
                'street' => 'Main Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 201,
                'citizen_id' => 'CIT002',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'middle_name' => 'L.',
                'extension_name' => null,
                'email' => 'jane.smith@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-234-5678',
                'address' => '456 Oak Avenue',
                'house_number' => '456',
                'street' => 'Oak Avenue',
                'barangay' => 'Barangay 2',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 202,
                'citizen_id' => 'CIT003',
                'first_name' => 'Michael',
                'last_name' => 'Johnson',
                'middle_name' => 'R.',
                'extension_name' => null,
                'email' => 'michael.johnson@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-345-6789',
                'address' => '789 Pine Street',
                'house_number' => '789',
                'street' => 'Pine Street',
                'barangay' => 'Barangay 3',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 203,
                'citizen_id' => 'CIT004',
                'first_name' => 'Sarah',
                'last_name' => 'Wilson',
                'middle_name' => 'A.',
                'extension_name' => null,
                'email' => 'sarah.wilson@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-456-7890',
                'address' => '321 Elm Street',
                'house_number' => '321',
                'street' => 'Elm Street',
                'barangay' => 'Barangay 4',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 204,
                'citizen_id' => 'CIT005',
                'first_name' => 'David',
                'last_name' => 'Brown',
                'middle_name' => 'K.',
                'extension_name' => null,
                'email' => 'david.brown@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-567-8901',
                'address' => '654 Maple Drive',
                'house_number' => '654',
                'street' => 'Maple Drive',
                'barangay' => 'Barangay 5',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 205,
                'citizen_id' => 'CIT006',
                'first_name' => 'Lisa',
                'last_name' => 'Garcia',
                'middle_name' => 'M.',
                'extension_name' => null,
                'email' => 'lisa.garcia@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-678-9012',
                'address' => '987 Cedar Lane',
                'house_number' => '987',
                'street' => 'Cedar Lane',
                'barangay' => 'Barangay 6',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 206,
                'citizen_id' => 'CIT007',
                'first_name' => 'Robert',
                'last_name' => 'Martinez',
                'middle_name' => 'J.',
                'extension_name' => null,
                'email' => 'robert.martinez@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-789-0123',
                'address' => '147 Birch Street',
                'house_number' => '147',
                'street' => 'Birch Street',
                'barangay' => 'Barangay 7',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 207,
                'citizen_id' => 'CIT008',
                'first_name' => 'Jennifer',
                'last_name' => 'Anderson',
                'middle_name' => 'S.',
                'extension_name' => null,
                'email' => 'jennifer.anderson@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-890-1234',
                'address' => '258 Willow Avenue',
                'house_number' => '258',
                'street' => 'Willow Avenue',
                'barangay' => 'Barangay 8',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 208,
                'citizen_id' => 'CIT009',
                'first_name' => 'Christopher',
                'last_name' => 'Taylor',
                'middle_name' => 'D.',
                'extension_name' => null,
                'email' => 'christopher.taylor@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-901-2345',
                'address' => '369 Spruce Road',
                'house_number' => '369',
                'street' => 'Spruce Road',
                'barangay' => 'Barangay 9',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 209,
                'citizen_id' => 'CIT010',
                'first_name' => 'Amanda',
                'last_name' => 'Thomas',
                'middle_name' => 'N.',
                'extension_name' => null,
                'email' => 'amanda.thomas@email.com',
                'password' => Hash::make('password123'),
                'role' => 'citizen',
                'mobile' => '+63-917-012-3456',
                'address' => '741 Poplar Street',
                'house_number' => '741',
                'street' => 'Poplar Street',
                'barangay' => 'Barangay 10',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert citizen users
        foreach ($citizenUsers as $user) {
            DB::table('users')->updateOrInsert(
                ['id' => $user['id']],
                $user
            );
        }

        $this->command->info('Citizen users seeded successfully!');
        $this->command->info('Total citizen users created: ' . count($citizenUsers));
        
        $this->command->table(
            ['ID', 'Name', 'Email', 'Role', 'Status'],
            collect($citizenUsers)->map(function ($user) {
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

        $this->command->warn('Default password for all citizen users: password123');
        $this->command->warn('Please change passwords in production environment!');
    }
}
