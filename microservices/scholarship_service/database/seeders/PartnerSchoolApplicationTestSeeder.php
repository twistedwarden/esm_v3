<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerSchoolApplication;
use App\Models\School;

class PartnerSchoolApplicationTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates test data for partner school applications
     */
    public function run(): void
    {
        // Get or create a test school first (needed for applications)
        $school = School::first();
        if (!$school) {
            $school = School::create([
                'name' => 'Test Partner School',
                'campus' => 'Main Campus',
                'email' => 'test@school.edu',
                'contact_number' => '09123456789',
                'classification' => 'PRIVATE UNIVERSITY/COLLEGE',
                'address' => '123 Test Street',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'region' => 'NCR',
                'is_partner_school' => false,
                'is_active' => true,
            ]);
        }

        // Create test applications with different statuses
        $applications = [
            [
                'school_id' => $school->id,
                'status' => 'draft',
                'admin_notes' => 'Test draft application - ready to submit',
            ],
            [
                'school_id' => $school->id,
                'status' => 'submitted',
                'submitted_at' => now()->subDays(3),
                'submitted_by' => 1,
                'admin_notes' => 'Test submitted application - waiting for account creation',
            ],
            [
                'school_id' => $school->id,
                'status' => 'under_review',
                'submitted_at' => now()->subDays(5),
                'submitted_by' => 1,
                'admin_notes' => 'Test application under review - documents pending',
            ],
            [
                'school_id' => $school->id,
                'status' => 'under_review',
                'submitted_at' => now()->subDays(7),
                'submitted_by' => 1,
                'admin_notes' => 'Test application under review',
            ],
            [
                'school_id' => $school->id,
                'status' => 'approved',
                'submitted_at' => now()->subDays(10),
                'reviewed_at' => now()->subDays(8),
                'submitted_by' => 1,
                'reviewed_by' => 1,
                'admin_notes' => 'Test approved application',
            ],
            [
                'school_id' => $school->id,
                'status' => 'rejected',
                'submitted_at' => now()->subDays(12),
                'reviewed_at' => now()->subDays(11),
                'submitted_by' => 1,
                'reviewed_by' => 1,
                'rejection_reason' => 'Test rejection - insufficient documentation',
                'admin_notes' => 'Test rejected application',
            ],
        ];

        foreach ($applications as $app) {
            PartnerSchoolApplication::create($app);
        }

        $this->command->info('✅ Test data created successfully!');
        $this->command->info('   - 6 Applications with various statuses');
        $this->command->info('');
        $this->command->info('You can now test the application workflow in the UI!');
    }
}
