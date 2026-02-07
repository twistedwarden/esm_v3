<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class SyncMonitoringData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitoring:sync {--date= : Snapshot date (Y-m-d format, defaults to today)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync scholarship data to monitoring service for analytics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $snapshotDate = $this->option('date') ?? Carbon::today()->toDateString();
        $monitoringUrl = config('services.monitoring.url', 'http://localhost:8003');

        $this->info("Syncing data for snapshot date: {$snapshotDate}");

        try {
            // 1. Sync Application Metrics
            $this->info('Aggregating application metrics...');
            $applicationData = $this->aggregateApplicationMetrics($snapshotDate);
            $this->sendToMonitoring("{$monitoringUrl}/api/internal/analytics/application-snapshot", $applicationData);
            $this->info('✓ Application metrics synced');

            // 2. Sync Financial Metrics
            $this->info('Aggregating financial metrics...');
            $financialData = $this->aggregateFinancialMetrics($snapshotDate);
            $this->sendToMonitoring("{$monitoringUrl}/api/internal/analytics/financial-snapshot", $financialData);
            $this->info('✓ Financial metrics synced');

            // 3. Sync Demographics
            $this->info('Aggregating demographics...');
            $demographicsData = $this->aggregateDemographics($snapshotDate);
            $this->sendToMonitoring("{$monitoringUrl}/api/internal/analytics/demographics-snapshot", $demographicsData);
            $this->info('✓ Demographics synced');

            // 4. Sync Interview Statistics
            $this->info('Aggregating interview statistics...');
            $interviewData = $this->aggregateInterviewStats($snapshotDate);
            $this->sendToMonitoring("{$monitoringUrl}/api/internal/analytics/interview-snapshot", $interviewData);
            $this->info('✓ Interview statistics synced');

            // 5. Sync SSC Review Data (if applicable)
            $this->info('Aggregating SSC review data...');
            $sscData = $this->aggregateSscReviews($snapshotDate);
            $this->sendToMonitoring("{$monitoringUrl}/api/internal/analytics/ssc-snapshot", $sscData);
            $this->info('✓ SSC review data synced');

            $this->info('');
            $this->info('🎉 All data synced successfully!');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Failed to sync data: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Aggregate application metrics
     */
    private function aggregateApplicationMetrics($snapshotDate)
    {
        $today = Carbon::parse($snapshotDate);

        // Get counts by status
        $byStatus = DB::table('scholarship_applications')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Get counts by type
        $byType = DB::table('scholarship_applications')
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        // Get counts by category
        $byCategory = DB::table('scholarship_applications')
            ->join('scholarship_subcategories', 'scholarship_applications.subcategory_id', '=', 'scholarship_subcategories.id')
            ->join('scholarship_categories', 'scholarship_subcategories.category_id', '=', 'scholarship_categories.id')
            ->select('scholarship_categories.name', DB::raw('count(*) as count'))
            ->groupBy('scholarship_categories.name')
            ->pluck('count', 'name')
            ->toArray();

        // Today's submissions
        $submittedToday = DB::table('scholarship_applications')
            ->whereDate('submitted_at', $today)
            ->count();

        // Today's approvals
        $approvedToday = DB::table('scholarship_applications')
            ->where('status', 'approved')
            ->whereDate('updated_at', $today)
            ->count();

        // Today's rejections
        $rejectedToday = DB::table('scholarship_applications')
            ->where('status', 'rejected')
            ->whereDate('updated_at', $today)
            ->count();

        // Average processing days
        $avgProcessingDays = DB::table('scholarship_applications')
            ->whereNotNull('submitted_at')
            ->whereNotNull('updated_at')
            ->whereIn('status', ['approved', 'rejected'])
            ->selectRaw('AVG(DATEDIFF(updated_at, submitted_at)) as avg_days')
            ->value('avg_days') ?? 0;

        // Total requested and approved amounts
        $totalRequested = DB::table('scholarship_applications')
            ->sum('requested_amount') ?? 0;

        $totalApproved = DB::table('scholarship_applications')
            ->where('status', 'approved')
            ->sum('approved_amount') ?? 0;

        return [
            'snapshot_date' => $snapshotDate,
            'applications' => [
                'total' => DB::table('scholarship_applications')->count(),
                'by_status' => [
                    'draft' => $byStatus['draft'] ?? 0,
                    'submitted' => $byStatus['submitted'] ?? 0,
                    'reviewed' => $byStatus['reviewed'] ?? 0,
                    'approved' => $byStatus['approved'] ?? 0,
                    'rejected' => $byStatus['rejected'] ?? 0,
                    'processing' => $byStatus['processing'] ?? 0,
                    'released' => $byStatus['released'] ?? 0,
                    'on_hold' => $byStatus['on_hold'] ?? 0,
                    'cancelled' => $byStatus['cancelled'] ?? 0,
                ],
                'by_type' => [
                    'new' => $byType['new'] ?? 0,
                    'renewal' => $byType['renewal'] ?? 0,
                ],
                'by_category' => [
                    'merit' => $byCategory['Merit-Based'] ?? $byCategory['Merit'] ?? 0,
                    'need_based' => $byCategory['Need-Based'] ?? $byCategory['Financial Need'] ?? 0,
                    'special' => $byCategory['Special'] ?? $byCategory['Special Program'] ?? 0,
                ],
                'avg_processing_days' => round($avgProcessingDays, 1),
                'submitted_today' => $submittedToday,
                'approved_today' => $approvedToday,
                'rejected_today' => $rejectedToday,
                'total_requested_amount' => $totalRequested,
                'total_approved_amount' => $totalApproved,
            ]
        ];
    }

    /**
     * Aggregate financial metrics
     */
    private function aggregateFinancialMetrics($snapshotDate)
    {
        $schoolYear = $this->getCurrentSchoolYear();

        // Get total budget from aid_service database using aid connection credentials
        // This uses DB_AID_USERNAME and DB_AID_PASSWORD from .env
        $totalBudget = DB::connection('aid')
            ->table('budget_allocations')
            ->where('school_year', $schoolYear)
            ->sum('total_budget') ?? 0;

        // Fallback: If no budgets found for current year, sum all budgets
        if ($totalBudget == 0) {
            $totalBudget = DB::connection('aid')
                ->table('budget_allocations')
                ->sum('total_budget') ?? 0;
        }

        $allocatedBudget = DB::table('scholarship_applications')
            ->where('status', 'approved')
            ->sum('approved_amount') ?? 0;

        // Get disbursement data from aid_service.aid_disbursements table
        // This is where actual payment records are stored
        $disbursedBudget = DB::connection('aid')
            ->table('aid_disbursements')
            ->sum('amount') ?? 0;

        $disbursementsToday = DB::connection('aid')
            ->table('aid_disbursements')
            ->whereDate('created_at', Carbon::parse($snapshotDate))
            ->count();

        $disbursedAmountToday = DB::connection('aid')
            ->table('aid_disbursements')
            ->whereDate('created_at', Carbon::parse($snapshotDate))
            ->sum('amount') ?? 0;

        // Get disbursements by payment method from aid_disbursements
        $methodCounts = DB::connection('aid')
            ->table('aid_disbursements')
            ->select('disbursement_method', DB::raw('SUM(amount) as total'))
            ->groupBy('disbursement_method')
            ->pluck('total', 'disbursement_method')
            ->toArray();

        $byMethod = [
            'gcash' => $methodCounts['gcash'] ?? $methodCounts['digital_wallet'] ?? 0,
            'paymaya' => $methodCounts['paymaya'] ?? 0,
            'bank' => $methodCounts['bank'] ?? $methodCounts['bank_transfer'] ?? 0,
            'cash' => $methodCounts['cash'] ?? 0,
        ];

        return [
            'snapshot_date' => $snapshotDate,
            'school_year' => $schoolYear,
            'budget' => [
                'total' => $totalBudget,
                'allocated' => $allocatedBudget,
                'disbursed' => $disbursedBudget,
            ],
            'disbursements' => [
                'count' => $disbursementsToday,
                'total_amount' => $disbursedAmountToday,
                'by_method' => $byMethod,
            ]
        ];
    }

    /**
     * Aggregate demographics
     */
    private function aggregateDemographics($snapshotDate)
    {
        $today = Carbon::parse($snapshotDate);

        // Total students
        $totalStudents = DB::table('students')->count();

        // Currently enrolled (students with active applications)
        $currentlyEnrolled = DB::table('students')
            ->join('scholarship_applications', 'students.id', '=', 'scholarship_applications.student_id')
            ->whereIn('scholarship_applications.status', ['approved', 'processing', 'released'])
            ->distinct('students.id')
            ->count('students.id');

        // New registrations today
        $newToday = DB::table('students')
            ->whereDate('created_at', $today)
            ->count();

        // Gender distribution
        $genderCounts = DB::table('students')
            ->select('sex', DB::raw('count(*) as count'))
            ->groupBy('sex')
            ->pluck('count', 'sex')
            ->toArray();

        // Partner schools
        $partnerSchools = DB::table('schools')->where('is_partner_school', true)->count();

        return [
            'snapshot_date' => $snapshotDate,
            'students' => [
                'total' => $totalStudents,
                'currently_enrolled' => $currentlyEnrolled,
                'graduating' => 0, // Add logic if you track graduating students
                'new_today' => $newToday,
                'gender' => [
                    'male' => $genderCounts['Male'] ?? 0,
                    'female' => $genderCounts['Female'] ?? 0,
                ],
                'special_categories' => [
                    'pwd' => 0, // These columns don't exist yet
                    'solo_parent' => 0,
                    'indigenous' => 0,
                    'fourps_beneficiary' => 0,
                ],
                'partner_schools' => $partnerSchools,
            ]
        ];
    }

    /**
     * Aggregate interview statistics
     */
    private function aggregateInterviewStats($snapshotDate)
    {
        // Get interview counts by status
        $scheduled = DB::table('interview_schedules')->where('status', 'scheduled')->count();
        $completed = DB::table('interview_schedules')->where('status', 'completed')->count();
        $cancelled = DB::table('interview_schedules')->where('status', 'cancelled')->count();
        $noShow = DB::table('interview_schedules')->where('status', 'no_show')->count();
        $rescheduled = DB::table('interview_schedules')->where('status', 'rescheduled')->count();

        return [
            'snapshot_date' => $snapshotDate,
            'interviews' => [
                'scheduled' => $scheduled,
                'completed' => $completed,
                'cancelled' => $cancelled,
                'no_show' => $noShow,
                'rescheduled' => $rescheduled,
            ],
            'results' => [
                'passed' => 0, // Result column doesn't exist yet
                'failed' => 0,
                'needs_followup' => 0,
            ],
            'by_type' => [
                'in_person' => 0, // Type column doesn't exist yet
                'online' => 0,
                'phone' => 0,
            ]
        ];
    }

    /**
     * Aggregate SSC review data
     */
    private function aggregateSscReviews($snapshotDate)
    {
        // This is a placeholder - adjust based on your SSC review workflow
        return [
            'snapshot_date' => $snapshotDate,
            'reviews' => [
                'document_verification' => [
                    'pending' => 0,
                    'completed' => 0,
                ],
                'financial_review' => [
                    'pending' => 0,
                    'completed' => 0,
                ],
                'academic_review' => [
                    'pending' => 0,
                    'completed' => 0,
                ],
                'final_approval' => [
                    'pending' => 0,
                    'completed' => 0,
                ],
            ],
            'outcomes' => [
                'approved' => 0,
                'rejected' => 0,
                'needs_revision' => 0,
            ],
            'avg_review_hours' => 0,
            'completed_today' => 0,
        ];
    }

    /**
     * Send data to monitoring service
     */
    private function sendToMonitoring($url, $data)
    {
        $response = Http::timeout(30)->post($url, $data);

        if (!$response->successful()) {
            throw new \Exception("Failed to send data to {$url}: " . $response->body());
        }
    }

    /**
     * Get current school year
     */
    private function getCurrentSchoolYear()
    {
        $now = Carbon::now();
        $year = $now->year;
        $month = $now->month;

        // School year typically starts in June/July
        if ($month >= 6) {
            return "{$year}-" . ($year + 1);
        } else {
            return ($year - 1) . "-{$year}";
        }
    }
}
