<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ScholarshipCategorySeeder::class,
            SchoolSeeder::class,
            DocumentTypeSeeder::class,
            PartnerSchoolGuidelinesSeeder::class, // Partner school guidelines
            PartnerSchoolRepresentativeSeeder::class, // Must run after SchoolSeeder
            PartnerSchoolApplicationTestSeeder::class, // Generate verification documents for partner schools
                // StaffSeederWithRealIds::class, // Use the seeder with real user IDs
            StaffSeeder::class, // Use the seeder with real user IDs
            SampleApplicationSeeder::class,
            SampleDocumentSeeder::class, // Generate sample documents for applications
                //EnrollmentVerificationSeeder::class, // Must run after SampleApplicationSeeder
            InterviewScheduleSeeder::class, // Must run after SampleApplicationSeeder
            SscMembersSeeder::class, // SSC member profiles (for reference)
            SscMemberAssignmentSeeder::class, // SSC role assignments
        ]);
    }
}