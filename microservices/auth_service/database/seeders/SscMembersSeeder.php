<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SscMembersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sscMembers = [
            // SSC Chairperson - City Administrator
            [
                'id' => 1,
                'citizen_id' => 'SSC001',
                'first_name' => 'Dale Gonzalo',
                'last_name' => 'Malapitan',
                'middle_name' => 'C.',
                'extension_name' => 'Hon.',
                'email' => 'twistedwarden626@gmail.com',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8888',
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

            // Document Verification Stage
            [
                'id' => 2,
                'first_name' => 'Maria Luisa',
                'last_name' => 'Santos',
                'middle_name' => 'C.',
                'extension_name' => 'Hon.',
                'email' => 'kishaia1871@gmail.com',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8889',
                'address' => 'City Council Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'first_name' => 'Roberto',
                'last_name' => 'Cruz',
                'middle_name' => 'M.',
                'extension_name' => 'Atty.',
                'email' => 'hrd@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8890',
                'address' => 'HRD Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'first_name' => 'Ana Maria',
                'last_name' => 'Reyes',
                'middle_name' => 'L.',
                'extension_name' => 'Dr.',
                'email' => 'social.services@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8891',
                'address' => 'Social Services Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Financial Review Stage
            [
                'id' => 5,
                'first_name' => 'Carlos',
                'last_name' => 'Mendoza',
                'middle_name' => 'P.',
                'extension_name' => 'Engr.',
                'email' => 'jheyjheypogi30@gmail.com',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8892',
                'address' => 'Budget Department Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 6,
                'first_name' => 'Maria Elena',
                'last_name' => 'Torres',
                'middle_name' => 'S.',
                'extension_name' => 'CPA',
                'email' => 'accounting@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8893',
                'address' => 'Accounting Department Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 7,
                'first_name' => 'Juan Carlos',
                'last_name' => 'Villanueva',
                'middle_name' => 'D.',
                'extension_name' => 'CPA',
                'email' => 'treasurer@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8894',
                'address' => 'Treasurer Office Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Academic Review Stage
            [
                'id' => 8,
                'first_name' => 'Patricia',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'A.',
                'extension_name' => 'Dr.',
                'email' => 'yvonnebarotilla16@gmail.com',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8895',
                'address' => 'Education Affairs Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 9,
                'first_name' => 'Jennifer',
                'last_name' => 'Morales',
                'middle_name' => 'L.',
                'extension_name' => 'Ms.',
                'email' => 'qcydo@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8896',
                'address' => 'QCYDO Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 10,
                'first_name' => 'Miguel',
                'last_name' => 'Santiago',
                'middle_name' => 'R.',
                'extension_name' => 'Arch.',
                'email' => 'planning@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8897',
                'address' => 'Planning Department Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 11,
                'first_name' => 'Rosario',
                'last_name' => 'Bautista',
                'middle_name' => 'M.',
                'extension_name' => 'Dr.',
                'email' => 'schools.division@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8898',
                'address' => 'Schools Division Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 12,
                'first_name' => 'Francisco',
                'last_name' => 'Aguilar',
                'middle_name' => 'J.',
                'extension_name' => 'Dr.',
                'email' => 'qcu@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8899',
                'address' => 'Quezon City University',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => true,
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Backup/Alternate Members
            [
                'id' => 13,
                'first_name' => 'Ricardo',
                'last_name' => 'Gutierrez',
                'middle_name' => 'T.',
                'extension_name' => 'Hon.',
                'email' => 'council.education.alt@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8900',
                'address' => 'City Council Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => false,
                'status' => 'inactive',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 14,
                'first_name' => 'Lourdes',
                'last_name' => 'Fernandez',
                'middle_name' => 'C.',
                'extension_name' => 'Ms.',
                'email' => 'budget.alt@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8901',
                'address' => 'Budget Department Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => false,
                'status' => 'inactive',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 15,
                'first_name' => 'Antonio',
                'last_name' => 'Rodriguez',
                'middle_name' => 'M.',
                'extension_name' => 'Dr.',
                'email' => 'education.affairs.alt@caloocan.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'ssc',
                'mobile' => '+63-2-8888-8902',
                'address' => 'Education Affairs Building',
                'house_number' => '',
                'street' => 'A. Mabini Street',
                'barangay' => 'Barangay 1',
                'is_active' => false,
                'status' => 'inactive',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert SSC members into users table
        foreach ($sscMembers as $index => $member) {
            // Add citizen_id if not present
            if (!isset($member['citizen_id'])) {
                $member['citizen_id'] = 'SSC' . str_pad($member['id'], 3, '0', STR_PAD_LEFT);
            }

            DB::table('users')->updateOrInsert(
                ['id' => $member['id']],
                $member
            );
        }

        $this->command->info('SSC Members seeded successfully in auth service!');
        $this->command->info('Total SSC members created: ' . count($sscMembers));
        $this->command->info('Active members: ' . collect($sscMembers)->where('is_active', true)->count());
        $this->command->info('Inactive/backup members: ' . collect($sscMembers)->where('is_active', false)->count());

        $this->command->table(
            ['ID', 'Name', 'Email', 'Role', 'Status'],
            collect($sscMembers)->map(function ($member) {
                $fullName = trim(($member['extension_name'] ?? '') . ' ' . $member['first_name'] . ' ' . ($member['middle_name'] ?? '') . ' ' . $member['last_name']);
                return [
                    $member['id'],
                    $fullName,
                    $member['email'],
                    $member['role'],
                    $member['is_active'] ? 'Active' : 'Inactive'
                ];
            })->toArray()
        );

        $this->command->warn('Default password for all SSC members: password123');
        $this->command->warn('Please change passwords in production environment!');
    }
}