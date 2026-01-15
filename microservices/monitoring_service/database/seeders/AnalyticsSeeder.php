<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AnalyticsDailyEnrollment;
use App\Models\AnalyticsStudentPerformance;
use App\Models\AnalyticsSystemMetric;
use App\Models\AnalyticsApplicationDaily;
use App\Models\AnalyticsFinancialDaily;
use App\Models\AnalyticsSscDaily;
use App\Models\AnalyticsInterviewDaily;
use App\Models\AnalyticsDemographicsDaily;
use App\Models\AnalyticsAlert;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding analytics data...');

        // Clear existing data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        AnalyticsApplicationDaily::truncate();
        AnalyticsFinancialDaily::truncate();
        AnalyticsSscDaily::truncate();
        AnalyticsInterviewDaily::truncate();
        AnalyticsDemographicsDaily::truncate();
        AnalyticsAlert::truncate();
        AnalyticsDailyEnrollment::truncate();
        AnalyticsStudentPerformance::truncate();
        AnalyticsSystemMetric::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->seedApplicationDaily();
        $this->seedFinancialDaily();
        $this->seedSscDaily();
        $this->seedInterviewDaily();
        $this->seedDemographicsDaily();
        $this->seedAlerts();
        $this->seedLegacyData();

        $this->command->info('Analytics data seeded successfully!');
    }

    /**
     * Seed Application Pipeline Analytics
     */
    private function seedApplicationDaily(): void
    {
        $startDate = Carbon::now()->subDays(60);
        $baseTotal = 800;

        for ($i = 0; $i <= 60; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Simulate growth over time
            $growth = $i * 8;
            $total = $baseTotal + $growth + rand(-20, 30);
            
            // Distribute by status
            $draft = (int)($total * 0.04) + rand(0, 5);
            $submitted = (int)($total * 0.12) + rand(0, 10);
            $reviewed = (int)($total * 0.08) + rand(0, 8);
            $approved = (int)($total * 0.52) + rand(0, 20);
            $rejected = (int)($total * 0.14) + rand(0, 5);
            $processing = (int)($total * 0.06) + rand(0, 5);
            $released = (int)($total * 0.04) + rand(0, 3);
            
            // Daily activity
            $submittedToday = rand(5, 25);
            $approvedToday = rand(3, 15);
            $rejectedToday = rand(0, 5);

            AnalyticsApplicationDaily::create([
                'snapshot_date' => $date,
                'total_applications' => $total,
                'draft_count' => $draft,
                'submitted_count' => $submitted,
                'reviewed_count' => $reviewed,
                'approved_count' => $approved,
                'rejected_count' => $rejected,
                'processing_count' => $processing,
                'released_count' => $released,
                'on_hold_count' => rand(0, 10),
                'cancelled_count' => rand(0, 5),
                'new_applications' => (int)($total * 0.65),
                'renewal_applications' => (int)($total * 0.35),
                'merit_count' => (int)($total * 0.30),
                'need_based_count' => (int)($total * 0.45),
                'special_count' => (int)($total * 0.25),
                'avg_processing_days' => rand(8, 18) + (rand(0, 99) / 100),
                'applications_submitted_today' => $submittedToday,
                'applications_approved_today' => $approvedToday,
                'applications_rejected_today' => $rejectedToday,
                'total_requested_amount' => $total * rand(8000, 15000),
                'total_approved_amount' => $approved * rand(8000, 12000),
            ]);
        }

        $this->command->info('  - Application daily analytics seeded (60 days)');
    }

    /**
     * Seed Financial Analytics
     */
    private function seedFinancialDaily(): void
    {
        $startDate = Carbon::now()->subDays(60);
        $totalBudget = 10000000.00;
        $schoolYear = '2025-2026';

        for ($i = 0; $i <= 60; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Simulate disbursement progress
            $disbursementProgress = ($i / 60) * 0.55; // 55% by end of period
            $disbursed = $totalBudget * $disbursementProgress;
            $allocated = $disbursed * 1.3; // Allocated is higher than disbursed
            
            $dailyDisbursements = rand(5, 20);
            $dailyAmount = $dailyDisbursements * rand(8000, 15000);

            AnalyticsFinancialDaily::create([
                'snapshot_date' => $date,
                'school_year' => $schoolYear,
                'total_budget' => $totalBudget,
                'allocated_budget' => min($allocated, $totalBudget * 0.85),
                'disbursed_budget' => $disbursed,
                'remaining_budget' => $totalBudget - $disbursed,
                'disbursements_count' => $dailyDisbursements,
                'disbursements_amount' => $dailyAmount,
                'avg_disbursement_amount' => $dailyDisbursements > 0 ? $dailyAmount / $dailyDisbursements : 0,
                'gcash_amount' => $dailyAmount * 0.45,
                'paymaya_amount' => $dailyAmount * 0.25,
                'bank_amount' => $dailyAmount * 0.20,
                'cash_amount' => $dailyAmount * 0.10,
                'other_amount' => 0,
            ]);
        }

        $this->command->info('  - Financial daily analytics seeded (60 days)');
    }

    /**
     * Seed SSC Review Analytics
     */
    private function seedSscDaily(): void
    {
        $startDate = Carbon::now()->subDays(60);

        for ($i = 0; $i <= 60; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Pending reviews decrease over time as they're processed
            $basePending = max(5, 50 - ($i * 0.5));

            AnalyticsSscDaily::create([
                'snapshot_date' => $date,
                'doc_verification_pending' => (int)$basePending + rand(0, 15),
                'doc_verification_completed' => 150 + $i * 2 + rand(0, 10),
                'financial_review_pending' => (int)($basePending * 0.8) + rand(0, 10),
                'financial_review_completed' => 140 + $i * 2 + rand(0, 10),
                'academic_review_pending' => (int)($basePending * 0.6) + rand(0, 8),
                'academic_review_completed' => 130 + $i * 2 + rand(0, 10),
                'final_approval_pending' => (int)($basePending * 0.4) + rand(0, 5),
                'final_approval_completed' => 120 + $i * 2 + rand(0, 10),
                'total_approved' => 100 + $i * 2 + rand(0, 8),
                'total_rejected' => 15 + (int)($i * 0.3) + rand(0, 3),
                'total_needs_revision' => rand(2, 8),
                'avg_review_time_hours' => 36 + rand(0, 24),
                'reviews_completed_today' => rand(10, 30),
            ]);
        }

        $this->command->info('  - SSC daily analytics seeded (60 days)');
    }

    /**
     * Seed Interview Analytics
     */
    private function seedInterviewDaily(): void
    {
        $startDate = Carbon::now()->subDays(60);

        for ($i = 0; $i <= 60; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Skip weekends for interviews
            if ($date->isWeekend()) {
                continue;
            }

            $scheduled = rand(10, 25);
            $completed = (int)($scheduled * rand(75, 95) / 100);
            $noShow = rand(0, max(1, (int)($scheduled * 0.1)));
            $cancelled = max(0, $scheduled - $completed - $noShow);
            
            $passed = (int)($completed * rand(70, 90) / 100);
            $failed = $completed - $passed - rand(0, 2);

            AnalyticsInterviewDaily::create([
                'snapshot_date' => $date,
                'scheduled_count' => $scheduled,
                'completed_count' => $completed,
                'cancelled_count' => $cancelled,
                'no_show_count' => $noShow,
                'rescheduled_count' => rand(0, 3),
                'passed_count' => max(0, $passed),
                'failed_count' => max(0, $failed),
                'needs_followup_count' => rand(0, 2),
                'in_person_count' => (int)($scheduled * 0.5),
                'online_count' => (int)($scheduled * 0.4),
                'phone_count' => (int)($scheduled * 0.1),
            ]);
        }

        $this->command->info('  - Interview daily analytics seeded (60 days, excluding weekends)');
    }

    /**
     * Seed Demographics Analytics
     */
    private function seedDemographicsDaily(): void
    {
        $startDate = Carbon::now()->subDays(60);
        $baseStudents = 3000;

        for ($i = 0; $i <= 60; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            $total = $baseStudents + ($i * 5) + rand(-10, 20);
            $enrolled = (int)($total * 0.88);

            AnalyticsDemographicsDaily::create([
                'snapshot_date' => $date,
                'total_students' => $total,
                'currently_enrolled' => $enrolled,
                'graduating_students' => (int)($total * 0.08),
                'new_registrations_today' => rand(2, 15),
                'male_count' => (int)($total * 0.42),
                'female_count' => (int)($total * 0.58),
                'pwd_count' => (int)($total * 0.045),
                'solo_parent_count' => (int)($total * 0.03),
                'indigenous_count' => (int)($total * 0.02),
                'fourps_beneficiary_count' => (int)($total * 0.23),
                'informal_settler_count' => (int)($total * 0.08),
                'partner_schools_count' => rand(45, 55),
                'caloocan_school_applicants' => (int)($total * 0.65),
            ]);
        }

        $this->command->info('  - Demographics daily analytics seeded (60 days)');
    }

    /**
     * Seed Sample Alerts
     */
    private function seedAlerts(): void
    {
        $alerts = [
            [
                'alert_type' => 'budget_low',
                'severity' => 'medium',
                'title' => 'Budget Utilization at 75%',
                'message' => 'The scholarship budget for 2025-2026 has reached 75% utilization. Consider budget review.',
                'context' => ['budget_remaining' => 2500000, 'utilization_rate' => 75],
            ],
            [
                'alert_type' => 'review_backlog',
                'severity' => 'high',
                'title' => 'Document Verification Backlog',
                'message' => '45 applications pending document verification for more than 7 days.',
                'context' => ['pending_count' => 45, 'stage' => 'document_verification'],
            ],
            [
                'alert_type' => 'no_show_rate',
                'severity' => 'medium',
                'title' => 'High Interview No-Show Rate',
                'message' => 'Interview no-show rate reached 12% this week, above the 10% threshold.',
                'context' => ['no_show_rate' => 12, 'threshold' => 10],
            ],
            [
                'alert_type' => 'processing_time',
                'severity' => 'low',
                'title' => 'Extended Processing Time',
                'message' => 'Average application processing time is 18 days, target is 14 days.',
                'context' => ['avg_days' => 18, 'target_days' => 14],
            ],
        ];

        foreach ($alerts as $alert) {
            AnalyticsAlert::create(array_merge($alert, [
                'is_acknowledged' => false,
            ]));
        }

        $this->command->info('  - Sample alerts seeded (4 alerts)');
    }

    /**
     * Seed Legacy Data (enrollment, performance, system metrics)
     */
    private function seedLegacyData(): void
    {
        // Legacy enrollment data
        $programs = ['BS CS', 'BS IT', 'BS IS', 'BSBA', 'BSA'];
        $years = ['1st', '2nd', '3rd', '4th'];
        $startDate = Carbon::now()->subDays(30);

        for ($i = 0; $i <= 30; $i++) {
            $date = $startDate->copy()->addDays($i);
            foreach ($programs as $program) {
                foreach ($years as $year) {
                    $base = 50 + rand(10, 30);
                    AnalyticsDailyEnrollment::create([
                        'snapshot_date' => $date,
                        'program' => $program,
                        'year_level' => $year,
                        'total_students' => $base,
                        'active_students' => (int)($base * 0.95),
                        'dropped_students' => rand(0, 3),
                        'graduated_students' => $year === '4th' ? rand(0, 2) : 0,
                    ]);
                }
            }
        }

        // Legacy student performance
        $terms = ['2025-1', '2025-2'];
        foreach ($terms as $term) {
            for ($id = 1001; $id <= 1300; $id++) {
                $gpa = 1.5 + (rand(0, 250) / 100);
                $attendance = 65 + (rand(0, 35));
                $risk = 'low';
                if ($gpa < 2.0 || $attendance < 75) $risk = 'high';
                elseif ($gpa < 2.5 || $attendance < 80) $risk = 'medium';

                AnalyticsStudentPerformance::create([
                    'student_id' => $id,
                    'academic_term' => $term,
                    'gpa' => round($gpa, 2),
                    'attendance_rate' => round($attendance, 1),
                    'failed_subjects_count' => $gpa < 2.0 ? rand(1, 3) : 0,
                    'risk_level' => $risk,
                ]);
            }
        }

        // System metrics
        $startTime = Carbon::now()->subHours(24);
        for ($i = 0; $i < 288; $i++) { // Every 5 minutes for 24 hours
            $time = $startTime->copy()->addMinutes($i * 5);
            
            AnalyticsSystemMetric::create([
                'recorded_at' => $time,
                'metric_type' => 'response_time',
                'value' => 50 + rand(0, 200),
                'metadata' => ['service' => 'scholarship_service'],
            ]);

            if ($i % 6 === 0) { // Every 30 minutes
                AnalyticsSystemMetric::create([
                    'recorded_at' => $time,
                    'metric_type' => 'active_users',
                    'value' => rand(10, 100),
                    'metadata' => ['environment' => 'production'],
                ]);
            }
        }

        $this->command->info('  - Legacy data seeded (enrollment, performance, system metrics)');
    }
}
