<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\ScholarshipApplication;
use App\Models\FinancialInformation;
use App\Models\AcademicRecord;
use App\Models\School;
use App\Models\ScholarshipCategory;
use App\Models\AcademicPeriod;
use Carbon\Carbon;

class AnalyticsTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 15 test applications for analytics...');

        // Get or create required references
        $school = School::first() ?? School::create([
            'name' => 'Test University',
            'address' => '123 Test St',
            'contact_number' => '123-456-7890',
            'email' => 'test@university.edu'
        ]);

        $category = ScholarshipCategory::first() ?? ScholarshipCategory::create([
            'name' => 'Academic Scholarship',
            'description' => 'For academically excellent students'
        ]);

        $academicPeriod = AcademicPeriod::first() ?? AcademicPeriod::create([
            'name' => 'AY 2025-2026',
            'start_date' => Carbon::now()->startOfYear(),
            'end_date' => Carbon::now()->endOfYear(),
            'is_active' => true
        ]);

        // Define test data patterns
        $incomeRanges = [5000, 8000, 12000, 18000, 25000, 35000, 45000];
        $gpaRanges = [1.2, 1.5, 1.8, 2.0, 2.3, 2.7, 3.2];
        $rejectionReasons = [
            'Incomplete documentation - missing ITR',
            'Family income exceeds threshold',
            'GPA below minimum requirement',
            'Failed to attend interview',
            'Missing certificate of indigency'
        ];

        for ($i = 1; $i <= 15; $i++) {
            // Create student
            $student = Student::create([
                'student_id_number' => 'TEST-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'first_name' => 'Test',
                'last_name' => 'Student' . $i,
                'middle_name' => 'Middle',
                'sex' => $i % 2 === 0 ? 'Male' : 'Female',
                'birth_date' => Carbon::now()->subYears(20)->subDays($i),
                'contact_number' => '09' . str_pad($i, 9, '0', STR_PAD_LEFT),
                'email_address' => "test.student{$i}@email.com",
                'is_solo_parent' => $i % 5 === 0, // 20% solo parents
                'is_currently_enrolled' => true
            ]);

            // Create financial information
            FinancialInformation::create([
                'student_id' => $student->id,
                'monthly_income' => $incomeRanges[$i % count($incomeRanges)],
                'family_monthly_income_range' => $this->getIncomeRange($incomeRanges[$i % count($incomeRanges)]),
                'number_of_siblings' => rand(1, 4),
                'siblings_currently_enrolled' => rand(0, 2),
                'is_4ps_beneficiary' => $i % 4 === 0 // 25% 4Ps
            ]);

            // Create academic record
            AcademicRecord::create([
                'student_id' => $student->id,
                'school_id' => $school->id,
                'educational_level' => 'College',
                'program' => $i % 3 === 0 ? 'BS Computer Science' : ($i % 3 === 1 ? 'BS Education' : 'BS Engineering'),
                'year_level' => rand(1, 4),
                'school_year' => '2025-2026',
                'gpa' => $gpaRanges[$i % count($gpaRanges)],
                'is_current' => true
            ]);

            // Create application
            // 60% approved (9 apps), 40% rejected (6 apps)
            $isApproved = $i <= 9;

            $application = ScholarshipApplication::create([
                'application_number' => 'APP-2026-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'student_id' => $student->id,
                'category_id' => $category->id,
                'school_id' => $school->id,
                'academic_period_id' => $academicPeriod->id,
                'type' => 'new',
                'status' => $isApproved ? 'approved' : 'rejected',
                'requested_amount' => rand(5000, 15000),
                'approved_amount' => $isApproved ? rand(5000, 15000) : null,
                'rejection_reason' => !$isApproved ? $rejectionReasons[($i - 10) % count($rejectionReasons)] : null,
                'submitted_at' => Carbon::now()->subDays(rand(10, 60)),
                'reviewed_at' => Carbon::now()->subDays(rand(1, 9)),
                'approved_at' => $isApproved ? Carbon::now()->subDays(rand(1, 5)) : null
            ]);

            $this->command->info("Created application {$i}/15: {$application->application_number} - " . ($isApproved ? 'APPROVED' : 'REJECTED'));
        }

        $this->command->info('✓ Successfully created 15 test applications with complete data!');
        $this->command->info('  - 9 Approved applications');
        $this->command->info('  - 6 Rejected applications');
        $this->command->info('  - All with financial info, academic records, and rejection reasons');
    }

    private function getIncomeRange($income): string
    {
        if ($income < 5000)
            return 'Below 5,000';
        if ($income < 10000)
            return '5,000-10,000';
        if ($income < 15000)
            return '10,000-15,000';
        if ($income < 20000)
            return '15,000-20,000';
        if ($income < 30000)
            return '20,000-30,000';
        if ($income < 50000)
            return '30,000-50,000';
        return 'Above 50,000';
    }
}
