<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerSchoolRepresentative;
use App\Models\School;

class PartnerSchoolRepresentativeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, ensure we have schools to assign representatives to
        $schools = School::all();
        
        if ($schools->isEmpty()) {
            $this->command->warn('No schools found. Please run SchoolSeeder first.');
            return;
        }

        // Map citizen IDs to schools
        // These citizen_ids should match the ones in auth_service PartnerSchoolSeeder
        $representatives = [
            [
                'citizen_id' => 'PSREP-001',
                'school_name' => 'Caloocan City Science High School',
            ],
            [
                'citizen_id' => 'PSREP-002',
                'school_name' => 'University of Caloocan',
            ],
            [
                'citizen_id' => 'PSREP-003',
                'school_name' => 'St. Mary\'s Academy',
            ],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($representatives as $rep) {
            // Try to find the school by name
            $school = School::where('name', 'like', '%' . $rep['school_name'] . '%')->first();
            
            if (!$school) {
                $this->command->warn("School not found: {$rep['school_name']}. Skipping {$rep['citizen_id']}");
                $skipped++;
                continue;
            }

            // Create or update the representative assignment
            PartnerSchoolRepresentative::updateOrCreate(
                ['citizen_id' => $rep['citizen_id']],
                [
                    'school_id' => $school->id,
                    'is_active' => true,
                    'assigned_at' => now(),
                ]
            );

            $this->command->info("✓ Assigned {$rep['citizen_id']} to {$school->name}");
            $created++;
        }

        $this->command->info("\nPartner School Representatives Summary:");
        $this->command->info("- Assigned: {$created}");
        if ($skipped > 0) {
            $this->command->warn("- Skipped: {$skipped}");
        }
    }
}

