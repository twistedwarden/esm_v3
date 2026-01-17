<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;

class SchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = [
            // Caloocan City University with multiple campuses
            [
                'name' => 'Caloocan City University',
                'campus' => 'Main Campus',
                'contact_number' => '+63-2-1234-5678',
                'email' => 'info@ccu.edu.ph',
                'website' => 'www.ccu.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
            [
                'name' => 'Caloocan City University',
                'campus' => 'South Campus',
                'contact_number' => '+63-2-1234-5679',
                'email' => 'south@ccu.edu.ph',
                'website' => 'www.ccu.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
            [
                'name' => 'Caloocan City University',
                'campus' => 'North Campus',
                'contact_number' => '+63-2-1234-5680',
                'email' => 'north@ccu.edu.ph',
                'website' => 'www.ccu.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
            [
                'name' => 'Caloocan City Science High School',
                'campus' => 'Main Campus',
                'contact_number' => '+63-2-2345-6789',
                'email' => 'info@ccshs.edu.ph',
                'website' => 'www.ccshs.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
            [
                'name' => 'Caloocan City Business High School',
                'campus' => 'Main Campus',
                'contact_number' => '+63-2-4567-8901',
                'email' => 'info@ccbhs.edu.ph',
                'website' => 'www.ccbhs.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
            [
                'name' => 'Caloocan International Science and Technology High School',
                'campus' => 'Main Campus',
                'contact_number' => '+63-2-5678-9012',
                'email' => 'info@cisths.edu.ph',
                'website' => 'www.cisths.edu.ph',
                'classification' => 'STATE UNIVERSITY/COLLEGE (SUC)',
                'address' => 'Caloocan City',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'zip_code' => '1400',
                'is_public' => true,
                'is_partner_school' => true,
                'is_active' => true,
                'verification_status' => 'verified',
                'verification_date' => now(),
                'verification_expiry_date' => now()->addYears(1),
            ],
        ];

        foreach ($schools as $schoolData) {
            School::create($schoolData);
        }
    }
}
