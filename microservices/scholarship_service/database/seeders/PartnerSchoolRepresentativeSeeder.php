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
        // These citizen_ids MUST match the ones in auth_service PartnerSchoolRepsSeeder
        $representatives = [
            [
                'citizen_id' => 'PSR001',
                'school_name' => 'Caloocan City University',
                'campus' => 'Main Campus',
            ],
            [
                'citizen_id' => 'PSR002',
                'school_name' => 'Caloocan City Science High School',
            ],
            [
                'citizen_id' => 'PSR003',
                'school_name' => 'Caloocan City Business High School',
            ],
            [
                'citizen_id' => 'PSR004',
                'school_name' => 'Caloocan International Science and Technology High School',
            ],
        ];

        $created = 0;
        $skipped = 0;

        // Optional: Cleanup logic if we want to ensure only these exist
        // PartnerSchoolRepresentative::truncate(); 

        foreach ($representatives as $rep) {
            // Try to find the school by name and optionally campus
            $query = School::where('name', 'like', '%' . $rep['school_name'] . '%');

            if (isset($rep['campus'])) {
                $query->where('campus', $rep['campus']);
            }

            $school = $query->first();

            if (!$school) {
                $this->command->warn("School not found: {$rep['school_name']} " . ($rep['campus'] ?? '') . ". Skipping {$rep['citizen_id']}");
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
