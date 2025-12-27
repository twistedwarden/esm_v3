<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class PartnerSchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test partner school representative accounts
        $psReps = [
            [
                'citizen_id' => 'PSREP-001',
                'email' => 'psrep@ccshs.edu.ph',
                'password' => 'psrep123',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'school_name' => 'Caloocan City Science High School',
            ],
            [
                'citizen_id' => 'PSREP-002',
                'email' => 'psrep@uc.edu.ph',
                'password' => 'psrep123',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Reyes',
                'school_name' => 'University of Caloocan',
            ],
            [
                'citizen_id' => 'PSREP-003',
                'email' => 'psrep@stmarys.edu.ph',
                'password' => 'psrep123',
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'school_name' => 'St. Mary\'s Academy',
            ]
        ];

        foreach ($psReps as $psRep) {
            User::create([
                'citizen_id' => $psRep['citizen_id'],
                'email' => $psRep['email'],
                'password' => Hash::make($psRep['password']),
                'first_name' => $psRep['first_name'],
                'last_name' => $psRep['last_name'],
                'middle_name' => $psRep['middle_name'],
                'role' => 'ps_rep',
                'is_active' => true,
                'email_verified_at' => now(),
                // Required fields for user model
                'address' => $psRep['school_name'] . ', Caloocan City',
                'mobile' => '09171234567',
                'birthdate' => '1980-01-01',
                'house_number' => '1',
                'street' => 'School Street',
                'barangay' => 'Barangay 1',
            ]);
        }

        $this->command->info('Partner School Representative accounts created successfully!');
        $this->command->info('Test accounts:');
        foreach ($psReps as $psRep) {
            $this->command->info("- Email: {$psRep['email']}, Password: {$psRep['password']}, School: {$psRep['school_name']}");
        }
    }
}
