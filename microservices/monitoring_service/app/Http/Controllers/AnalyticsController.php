<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AnalyticsDailyEnrollment;
use App\Models\AnalyticsStudentPerformance;
use App\Models\AnalyticsSystemMetric;
use App\Models\AnalyticsApplicationDaily;
use App\Models\AnalyticsFinancialDaily;
use App\Models\AnalyticsSscDaily;
use App\Models\AnalyticsInterviewDaily;
use App\Models\AnalyticsDemographicsDaily;
use App\Models\AnalyticsAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * AnalyticsController
 * 
 * Provides comprehensive analytics endpoints for the GSM monitoring dashboard.
 * All endpoints return standardized JSON responses with success status and data.
 * 
 * @package App\Http\Controllers
 */
class AnalyticsController extends Controller
{
    /**
     * Get executive dashboard with all key KPIs
     * 
     * Returns high-level metrics across all modules:
     * - Applications pipeline
     * - Financial/Budget status
     * - SSC review queue
     * - Interview statistics
     * - Demographics summary
     * - Active alerts
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardMetrics()
    {
        $cacheKey = 'dashboard_metrics_' . now()->format('Y-m-d-H');
        
        $data = Cache::remember($cacheKey, 300, function () {
            $today = Carbon::today();
            $weekAgo = Carbon::today()->subDays(7);
            $monthAgo = Carbon::today()->subMonth();

            // Get latest snapshots
            $latestApplication = AnalyticsApplicationDaily::orderBy('snapshot_date', 'desc')->first();
            $latestFinancial = AnalyticsFinancialDaily::orderBy('snapshot_date', 'desc')->first();
            $latestSsc = AnalyticsSscDaily::orderBy('snapshot_date', 'desc')->first();
            $latestInterview = AnalyticsInterviewDaily::orderBy('snapshot_date', 'desc')->first();
            $latestDemographics = AnalyticsDemographicsDaily::orderBy('snapshot_date', 'desc')->first();

            // Get comparison data (week ago)
            $weekAgoApplication = AnalyticsApplicationDaily::where('snapshot_date', $weekAgo->toDateString())->first();

            // Calculate trends
            $applicationTrend = $this->calculateTrend(
                $latestApplication->total_applications ?? 0,
                $weekAgoApplication->total_applications ?? 0
            );

            return [
                // Application Pipeline KPIs
                'applications' => [
                    'total' => $latestApplication->total_applications ?? 0,
                    'pending_review' => ($latestApplication->submitted_count ?? 0) + ($latestApplication->reviewed_count ?? 0),
                    'approved' => $latestApplication->approved_count ?? 0,
                    'rejected' => $latestApplication->rejected_count ?? 0,
                    'processing' => $latestApplication->processing_count ?? 0,
                    'released' => $latestApplication->released_count ?? 0,
                    'new_today' => $latestApplication->applications_submitted_today ?? 0,
                    'approved_today' => $latestApplication->applications_approved_today ?? 0,
                    'approval_rate' => $latestApplication->approval_rate ?? 0,
                    'avg_processing_days' => $latestApplication->avg_processing_days ?? 0,
                    'by_type' => [
                        'new' => $latestApplication->new_applications ?? 0,
                        'renewal' => $latestApplication->renewal_applications ?? 0,
                    ],
                    'by_category' => [
                        'merit' => $latestApplication->merit_count ?? 0,
                        'need_based' => $latestApplication->need_based_count ?? 0,
                        'special' => $latestApplication->special_count ?? 0,
                    ],
                    'trend' => $applicationTrend,
                ],

                // Financial KPIs
                'financial' => [
                    'school_year' => $latestFinancial->school_year ?? date('Y') . '-' . (date('Y') + 1),
                    'total_budget' => (float) ($latestFinancial->total_budget ?? 0),
                    'allocated_budget' => (float) ($latestFinancial->allocated_budget ?? 0),
                    'disbursed_budget' => (float) ($latestFinancial->disbursed_budget ?? 0),
                    'remaining_budget' => (float) ($latestFinancial->remaining_budget ?? 0),
                    'utilization_rate' => $latestFinancial->utilization_rate ?? 0,
                    'allocation_rate' => $latestFinancial->allocation_rate ?? 0,
                    'disbursements_today' => $latestFinancial->disbursements_count ?? 0,
                    'disbursed_amount_today' => (float) ($latestFinancial->disbursements_amount ?? 0),
                    'avg_disbursement' => (float) ($latestFinancial->avg_disbursement_amount ?? 0),
                    'by_method' => [
                        'gcash' => (float) ($latestFinancial->gcash_amount ?? 0),
                        'paymaya' => (float) ($latestFinancial->paymaya_amount ?? 0),
                        'bank' => (float) ($latestFinancial->bank_amount ?? 0),
                        'cash' => (float) ($latestFinancial->cash_amount ?? 0),
                    ],
                ],

                // SSC Review KPIs
                'ssc_reviews' => [
                    'total_pending' => $latestSsc->total_pending ?? 0,
                    'total_completed' => $latestSsc->total_completed ?? 0,
                    'completed_today' => $latestSsc->reviews_completed_today ?? 0,
                    'avg_review_hours' => (float) ($latestSsc->avg_review_time_hours ?? 0),
                    'bottleneck_stage' => $latestSsc->bottleneck_stage ?? 'none',
                    'by_stage' => [
                        'document_verification' => [
                            'pending' => $latestSsc->doc_verification_pending ?? 0,
                            'completed' => $latestSsc->doc_verification_completed ?? 0,
                        ],
                        'financial_review' => [
                            'pending' => $latestSsc->financial_review_pending ?? 0,
                            'completed' => $latestSsc->financial_review_completed ?? 0,
                        ],
                        'academic_review' => [
                            'pending' => $latestSsc->academic_review_pending ?? 0,
                            'completed' => $latestSsc->academic_review_completed ?? 0,
                        ],
                        'final_approval' => [
                            'pending' => $latestSsc->final_approval_pending ?? 0,
                            'completed' => $latestSsc->final_approval_completed ?? 0,
                        ],
                    ],
                    'outcomes' => [
                        'approved' => $latestSsc->total_approved ?? 0,
                        'rejected' => $latestSsc->total_rejected ?? 0,
                        'needs_revision' => $latestSsc->total_needs_revision ?? 0,
                    ],
                ],

                // Interview KPIs
                'interviews' => [
                    'scheduled' => $latestInterview->scheduled_count ?? 0,
                    'completed' => $latestInterview->completed_count ?? 0,
                    'cancelled' => $latestInterview->cancelled_count ?? 0,
                    'no_show' => $latestInterview->no_show_count ?? 0,
                    'pass_rate' => $latestInterview->pass_rate ?? 0,
                    'no_show_rate' => $latestInterview->no_show_rate ?? 0,
                    'completion_rate' => $latestInterview->completion_rate ?? 0,
                    'results' => [
                        'passed' => $latestInterview->passed_count ?? 0,
                        'failed' => $latestInterview->failed_count ?? 0,
                        'needs_followup' => $latestInterview->needs_followup_count ?? 0,
                    ],
                    'by_type' => [
                        'in_person' => $latestInterview->in_person_count ?? 0,
                        'online' => $latestInterview->online_count ?? 0,
                        'phone' => $latestInterview->phone_count ?? 0,
                    ],
                ],

                // Demographics KPIs
                'demographics' => [
                    'total_students' => $latestDemographics->total_students ?? 0,
                    'currently_enrolled' => $latestDemographics->currently_enrolled ?? 0,
                    'graduating' => $latestDemographics->graduating_students ?? 0,
                    'new_today' => $latestDemographics->new_registrations_today ?? 0,
                    'gender' => [
                        'male' => $latestDemographics->male_count ?? 0,
                        'female' => $latestDemographics->female_count ?? 0,
                    ],
                    'special_categories' => [
                        'pwd' => $latestDemographics->pwd_count ?? 0,
                        'pwd_percentage' => $latestDemographics->pwd_percentage ?? 0,
                        'solo_parent' => $latestDemographics->solo_parent_count ?? 0,
                        'indigenous' => $latestDemographics->indigenous_count ?? 0,
                        'fourps_beneficiary' => $latestDemographics->fourps_beneficiary_count ?? 0,
                        'fourps_percentage' => $latestDemographics->fourps_percentage ?? 0,
                    ],
                    'partner_schools' => $latestDemographics->partner_schools_count ?? 0,
                ],

                // Active Alerts
                'alerts' => $this->getActiveAlerts(),

                // Metadata
                'snapshot_date' => $latestApplication->snapshot_date ?? now()->toDateString(),
                'generated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get application pipeline trends
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getApplicationTrends(Request $request)
    {
        $days = min((int) $request->get('days', 30), 90);
        $startDate = Carbon::today()->subDays($days);

        $trends = AnalyticsApplicationDaily::where('snapshot_date', '>=', $startDate)
            ->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'total' => $item->total_applications,
                    'submitted' => $item->applications_submitted_today,
                    'approved' => $item->applications_approved_today,
                    'rejected' => $item->applications_rejected_today,
                    'approval_rate' => $item->approval_rate,
                    'by_status' => [
                        'draft' => $item->draft_count,
                        'submitted' => $item->submitted_count,
                        'reviewed' => $item->reviewed_count,
                        'approved' => $item->approved_count,
                        'rejected' => $item->rejected_count,
                        'processing' => $item->processing_count,
                        'released' => $item->released_count,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'trends' => $trends,
                'period_days' => $days,
            ]
        ]);
    }

    /**
     * Get financial/budget trends
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFinancialTrends(Request $request)
    {
        $days = min((int) $request->get('days', 30), 90);
        $schoolYear = $request->get('school_year');
        $startDate = Carbon::today()->subDays($days);

        $query = AnalyticsFinancialDaily::where('snapshot_date', '>=', $startDate);
        
        if ($schoolYear) {
            $query->where('school_year', $schoolYear);
        }

        $trends = $query->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'school_year' => $item->school_year,
                    'total_budget' => (float) $item->total_budget,
                    'disbursed_budget' => (float) $item->disbursed_budget,
                    'remaining_budget' => (float) $item->remaining_budget,
                    'utilization_rate' => $item->utilization_rate,
                    'disbursements_count' => $item->disbursements_count,
                    'disbursements_amount' => (float) $item->disbursements_amount,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'trends' => $trends,
                'period_days' => $days,
            ]
        ]);
    }

    /**
     * Get SSC review queue status and trends
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSscReviewTrends(Request $request)
    {
        $days = min((int) $request->get('days', 14), 30);
        $startDate = Carbon::today()->subDays($days);

        $trends = AnalyticsSscDaily::where('snapshot_date', '>=', $startDate)
            ->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'total_pending' => $item->total_pending,
                    'total_completed' => $item->total_completed,
                    'completed_today' => $item->reviews_completed_today,
                    'avg_review_hours' => (float) $item->avg_review_time_hours,
                    'bottleneck_stage' => $item->bottleneck_stage,
                    'by_stage' => [
                        'document_verification' => $item->doc_verification_pending,
                        'financial_review' => $item->financial_review_pending,
                        'academic_review' => $item->academic_review_pending,
                        'final_approval' => $item->final_approval_pending,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'trends' => $trends,
                'period_days' => $days,
            ]
        ]);
    }

    /**
     * Get interview statistics and trends
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInterviewTrends(Request $request)
    {
        $days = min((int) $request->get('days', 30), 90);
        $startDate = Carbon::today()->subDays($days);

        $trends = AnalyticsInterviewDaily::where('snapshot_date', '>=', $startDate)
            ->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'scheduled' => $item->scheduled_count,
                    'completed' => $item->completed_count,
                    'no_show' => $item->no_show_count,
                    'pass_rate' => $item->pass_rate,
                    'no_show_rate' => $item->no_show_rate,
                    'results' => [
                        'passed' => $item->passed_count,
                        'failed' => $item->failed_count,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'trends' => $trends,
                'period_days' => $days,
            ]
        ]);
    }

    /**
     * Get demographics trends
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDemographicsTrends(Request $request)
    {
        $days = min((int) $request->get('days', 30), 90);
        $startDate = Carbon::today()->subDays($days);

        $trends = AnalyticsDemographicsDaily::where('snapshot_date', '>=', $startDate)
            ->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'total_students' => $item->total_students,
                    'currently_enrolled' => $item->currently_enrolled,
                    'new_registrations' => $item->new_registrations_today,
                    'pwd_count' => $item->pwd_count,
                    'fourps_count' => $item->fourps_beneficiary_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'trends' => $trends,
                'period_days' => $days,
            ]
        ]);
    }

    /**
     * Get alerts list
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAlerts(Request $request)
    {
        $status = $request->get('status', 'active'); // active, acknowledged, resolved, all
        $severity = $request->get('severity'); // low, medium, high, critical
        $limit = min((int) $request->get('limit', 50), 100);

        $query = AnalyticsAlert::query();

        if ($status === 'active') {
            $query->active()->unacknowledged();
        } elseif ($status === 'acknowledged') {
            $query->where('is_acknowledged', true)->whereNull('resolved_at');
        } elseif ($status === 'resolved') {
            $query->whereNotNull('resolved_at');
        }

        if ($severity) {
            $query->bySeverity($severity);
        }

        $alerts = $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'type' => $alert->alert_type,
                    'severity' => $alert->severity,
                    'title' => $alert->title,
                    'message' => $alert->message,
                    'context' => $alert->context,
                    'is_acknowledged' => $alert->is_acknowledged,
                    'created_at' => $alert->created_at->toIso8601String(),
                    'acknowledged_at' => $alert->acknowledged_at?->toIso8601String(),
                    'resolved_at' => $alert->resolved_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'alerts' => $alerts,
                'total_count' => $alerts->count(),
            ]
        ]);
    }

    /**
     * Acknowledge an alert
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function acknowledgeAlert(Request $request, int $id)
    {
        $alert = AnalyticsAlert::findOrFail($id);
        $userId = $request->input('auth_user.id', 0);
        
        $alert->acknowledge($userId);

        return response()->json([
            'success' => true,
            'message' => 'Alert acknowledged',
        ]);
    }

    /**
     * Get system health overview metrics
     */
    public function getSystemOverview(Request $request)
    {
        $limit = min((int) $request->get('limit', 10), 100);
        $hours = min((int) $request->get('hours', 24), 168);
        $startTime = Carbon::now()->subHours($hours);

        $metricTypes = AnalyticsSystemMetric::where('recorded_at', '>=', $startTime)
            ->select('metric_type')
            ->distinct()
            ->pluck('metric_type');

        $metricsData = [];
        $summaries = [];

        foreach ($metricTypes as $type) {
            $records = AnalyticsSystemMetric::where('metric_type', $type)
                ->where('recorded_at', '>=', $startTime)
                ->orderBy('recorded_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(fn($item) => [
                    'recorded_at' => $item->recorded_at->toIso8601String(),
                    'value' => $item->value,
                    'metadata' => $item->metadata
                ]);

            $metricsData[$type] = $records;

            $stats = AnalyticsSystemMetric::where('metric_type', $type)
                ->where('recorded_at', '>=', $startTime)
                ->selectRaw('AVG(value) as avg_value, MIN(value) as min_value, MAX(value) as max_value, COUNT(*) as count')
                ->first();

            $summaries[$type] = [
                'average' => round($stats->avg_value ?? 0, 2),
                'min' => round($stats->min_value ?? 0, 2),
                'max' => round($stats->max_value ?? 0, 2),
                'count' => $stats->count ?? 0
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'metric_types' => $metricTypes->toArray(),
                'time_window_hours' => $hours,
                'summaries' => $summaries,
                'history' => $metricsData
            ]
        ]);
    }

    /**
     * Get available filter options
     */
    public function getFilterOptions()
    {
        $schoolYears = AnalyticsFinancialDaily::select('school_year')
            ->distinct()
            ->whereNotNull('school_year')
            ->orderBy('school_year', 'desc')
            ->pluck('school_year');

        $dateRange = [
            'earliest' => AnalyticsApplicationDaily::min('snapshot_date'),
            'latest' => AnalyticsApplicationDaily::max('snapshot_date'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'school_years' => $schoolYears,
                'date_range' => $dateRange,
                'available_metrics' => [
                    'applications', 'financial', 'ssc_reviews', 
                    'interviews', 'demographics', 'system'
                ],
            ]
        ]);
    }

    // =========================================================================
    // Legacy endpoints for backward compatibility
    // =========================================================================

    /**
     * Get enrollment trends (legacy)
     */
    public function getEnrollmentTrends(Request $request)
    {
        $months = min((int) $request->get('months', 6), 24);
        $groupBy = $request->get('group_by');
        $startDate = Carbon::now()->subMonths($months);

        if ($groupBy && in_array($groupBy, ['program', 'year_level'])) {
            $rawData = AnalyticsDailyEnrollment::where('snapshot_date', '>=', $startDate)
                ->select('snapshot_date', $groupBy)
                ->selectRaw('SUM(active_students) as count')
                ->groupBy('snapshot_date', $groupBy)
                ->orderBy('snapshot_date')
                ->get();

            $groupedByDate = [];
            $allGroups = [];

            foreach ($rawData as $item) {
                $date = $item->snapshot_date->format('Y-m-d');
                $group = $item->{$groupBy};
                
                if (!isset($groupedByDate[$date])) {
                    $groupedByDate[$date] = [];
                }
                $groupedByDate[$date][$group] = (int) $item->count;
                $allGroups[$group] = true;
            }

            $trends = [];
            foreach ($groupedByDate as $date => $series) {
                foreach (array_keys($allGroups) as $group) {
                    if (!isset($series[$group])) {
                        $series[$group] = 0;
                    }
                }
                ksort($series);
                $trends[] = ['date' => $date, 'series' => $series];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'trends' => $trends,
                    'groups' => array_keys($allGroups),
                    'group_by' => $groupBy,
                    'period_months' => $months
                ]
            ]);
        }

        $trends = AnalyticsDailyEnrollment::where('snapshot_date', '>=', $startDate)
            ->select('snapshot_date')
            ->selectRaw('SUM(active_students) as active_count')
            ->groupBy('snapshot_date')
            ->orderBy('snapshot_date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->snapshot_date->format('Y-m-d'),
                'count' => (int) $item->active_count
            ]);

        return response()->json([
            'success' => true,
            'data' => ['trends' => $trends, 'period_months' => $months]
        ]);
    }

    /**
     * Get performance distribution (legacy)
     */
    public function getPerformanceDistribution(Request $request)
    {
        $requestedTerm = $request->get('term');
        $latestTerm = $requestedTerm ?? AnalyticsStudentPerformance::max('academic_term');

        if (!$latestTerm) {
            return response()->json([
                'success' => true,
                'data' => [
                    'term' => null,
                    'total_students' => 0,
                    'risk_distribution' => [],
                    'gpa_distribution' => [],
                ]
            ]);
        }

        $totalStudents = AnalyticsStudentPerformance::where('academic_term', $latestTerm)->count();

        $riskRaw = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->select('risk_level', DB::raw('count(*) as count'))
            ->groupBy('risk_level')
            ->get();

        $riskDistribution = [];
        foreach ($riskRaw as $item) {
            $riskDistribution[$item->risk_level] = [
                'count' => $item->count,
                'percentage' => $totalStudents > 0 ? round(($item->count / $totalStudents) * 100, 1) : 0
            ];
        }

        foreach (['low', 'medium', 'high'] as $level) {
            if (!isset($riskDistribution[$level])) {
                $riskDistribution[$level] = ['count' => 0, 'percentage' => 0];
            }
        }

        $gpaRaw = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->selectRaw("
                CASE 
                    WHEN gpa >= 3.5 THEN '3.5-4.0 (Excellent)'
                    WHEN gpa >= 3.0 THEN '3.0-3.49 (Good)'
                    WHEN gpa >= 2.0 THEN '2.0-2.99 (Satisfactory)'
                    ELSE 'Below 2.0 (At Risk)'
                END as gpa_range, count(*) as count
            ")
            ->groupBy('gpa_range')
            ->get();

        $gpaDistribution = [];
        foreach ($gpaRaw as $item) {
            $gpaDistribution[$item->gpa_range] = [
                'count' => $item->count,
                'percentage' => $totalStudents > 0 ? round(($item->count / $totalStudents) * 100, 1) : 0
            ];
        }

        $averages = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->selectRaw('AVG(gpa) as avg_gpa, AVG(attendance_rate) as avg_attendance')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'term' => $latestTerm,
                'total_students' => $totalStudents,
                'risk_distribution' => $riskDistribution,
                'gpa_distribution' => $gpaDistribution,
                'average_gpa' => round($averages->avg_gpa ?? 0, 2),
                'average_attendance' => round($averages->avg_attendance ?? 0, 1),
            ]
        ]);
    }

    /**
     * Get academic performance data with real student data from scholarship service
     */
    public function getAcademicPerformance(Request $request)
    {
        try {
            $scholarshipServiceUrl = config('services.scholarship.url', 'http://localhost:8001');
            $token = $request->bearerToken();
            
            // Fetch students from scholarship service
            $client = new \GuzzleHttp\Client(['timeout' => 30]);
            
            // First, get all students (with pagination if needed)
            $allStudents = [];
            $page = 1;
            $perPage = 100;
            
            do {
                $response = $client->get("{$scholarshipServiceUrl}/api/students", [
                    'headers' => [
                        'Authorization' => $token ? "Bearer {$token}" : '',
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'per_page' => $perPage,
                        'page' => $page,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!isset($data['success']) || !$data['success']) {
                    break;
                }

                $students = $data['data']['data'] ?? [];
                $allStudents = array_merge($allStudents, $students);
                
                $hasMore = isset($data['data']['next_page_url']) && $data['data']['next_page_url'] !== null;
                $page++;
                
                // Limit to prevent infinite loops
                if ($page > 50) break;
                
            } while ($hasMore && !empty($students));
            
            if (empty($allStudents)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Fetch academic records for each student
            $transformedStudents = [];
            foreach ($allStudents as $student) {
                try {
                    // Fetch academic records for this student
                    $academicResponse = $client->get("{$scholarshipServiceUrl}/api/students/{$student['id']}/academic-records", [
                        'headers' => [
                            'Authorization' => $token ? "Bearer {$token}" : '',
                            'Accept' => 'application/json',
                        ],
                    ]);
                    
                    $academicData = json_decode($academicResponse->getBody()->getContents(), true);
                    $academicRecords = $academicData['data'] ?? [];
                    
                    // Get current academic record
                    $currentRecord = collect($academicRecords)->firstWhere('is_current', true) 
                        ?? collect($academicRecords)->sortByDesc('school_year')->first();
                    
                    // Calculate GPA from academic records
                    $gpa = null;
                    if ($currentRecord) {
                        $gpa = $currentRecord['gpa'] ?? $currentRecord['general_weighted_average'] ?? null;
                    }
                    
                    // If no GPA from current record, calculate average from all records
                    if ($gpa === null && !empty($academicRecords)) {
                        $gpas = array_filter(array_map(function($record) {
                            return $record['gpa'] ?? $record['general_weighted_average'] ?? null;
                        }, $academicRecords));
                        
                        if (!empty($gpas)) {
                            $gpa = array_sum($gpas) / count($gpas);
                        }
                    }

                    // Create grades array from academic records for compatibility
                    $grades = [];
                    if ($gpa !== null) {
                        $grades[] = ['grade' => $gpa];
                    }
                    
                    // Also add individual grades from records
                    foreach ($academicRecords as $record) {
                        $recordGpa = $record['gpa'] ?? $record['general_weighted_average'] ?? null;
                        if ($recordGpa !== null) {
                            $grades[] = [
                                'grade' => $recordGpa,
                                'term' => $record['school_term'] ?? '',
                                'year' => $record['school_year'] ?? '',
                            ];
                        }
                    }

                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $currentRecord['program'] ?? $student['program'] ?? 'Unknown',
                        'year_level' => $currentRecord['year_level'] ?? $student['year_level'] ?? 'Unknown',
                        'gpa' => $gpa,
                        'grades' => $grades,
                        'status' => ($student['is_currently_enrolled'] ?? false) ? 'active' : 'inactive',
                        'academic_records' => $academicRecords,
                    ];
                } catch (\Exception $e) {
                    // If we can't fetch academic records for a student, still include them with basic info
                    \Log::warning("Failed to fetch academic records for student {$student['id']}: " . $e->getMessage());
                    
                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $student['program'] ?? 'Unknown',
                        'year_level' => $student['year_level'] ?? 'Unknown',
                        'gpa' => null,
                        'grades' => [],
                        'status' => ($student['is_currently_enrolled'] ?? false) ? 'active' : 'inactive',
                        'academic_records' => [],
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $transformedStudents
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching academic performance data: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load student data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get student progress data with real student data from scholarship service
     */
    public function getStudentProgress(Request $request)
    {
        try {
            $scholarshipServiceUrl = config('services.scholarship.url', 'http://localhost:8001');
            $token = $request->bearerToken();
            
            // Fetch students from scholarship service
            $client = new \GuzzleHttp\Client(['timeout' => 30]);
            
            // Get all students (with pagination if needed)
            $allStudents = [];
            $page = 1;
            $perPage = 100;
            
            do {
                $response = $client->get("{$scholarshipServiceUrl}/api/students", [
                    'headers' => [
                        'Authorization' => $token ? "Bearer {$token}" : '',
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'per_page' => $perPage,
                        'page' => $page,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!isset($data['success']) || !$data['success']) {
                    break;
                }

                $students = $data['data']['data'] ?? [];
                $allStudents = array_merge($allStudents, $students);
                
                $hasMore = isset($data['data']['next_page_url']) && $data['data']['next_page_url'] !== null;
                $page++;
                
                // Limit to prevent infinite loops
                if ($page > 50) break;
                
            } while ($hasMore && !empty($students));
            
            if (empty($allStudents)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Transform the data to match frontend expectations
            $transformedStudents = [];
            foreach ($allStudents as $student) {
                try {
                    // Fetch academic records for progress info
                    $academicResponse = $client->get("{$scholarshipServiceUrl}/api/students/{$student['id']}/academic-records", [
                        'headers' => [
                            'Authorization' => $token ? "Bearer {$token}" : '',
                            'Accept' => 'application/json',
                        ],
                    ]);
                    
                    $academicData = json_decode($academicResponse->getBody()->getContents(), true);
                    $academicRecords = $academicData['data'] ?? [];
                    
                    // Get current academic record
                    $currentRecord = collect($academicRecords)->firstWhere('is_current', true) 
                        ?? collect($academicRecords)->sortByDesc('school_year')->first();
                    
                    // Calculate GPA from academic records
                    $gpa = null;
                    if ($currentRecord) {
                        $gpa = $currentRecord['gpa'] ?? $currentRecord['general_weighted_average'] ?? null;
                    }
                    
                    // If no GPA from current record, calculate average from all records
                    if ($gpa === null && !empty($academicRecords)) {
                        $gpas = array_filter(array_map(function($record) {
                            return $record['gpa'] ?? $record['general_weighted_average'] ?? null;
                        }, $academicRecords));
                        
                        if (!empty($gpas)) {
                            $gpa = array_sum($gpas) / count($gpas);
                        }
                    }

                    // Create grades array from academic records for compatibility
                    $grades = [];
                    foreach ($academicRecords as $record) {
                        $recordGpa = $record['gpa'] ?? $record['general_weighted_average'] ?? null;
                        if ($recordGpa !== null) {
                            $grades[] = [
                                'grade' => $recordGpa,
                                'term' => $record['school_term'] ?? '',
                                'year' => $record['school_year'] ?? '',
                                'created_at' => $record['created_at'] ?? $record['updated_at'] ?? now()->toIso8601String(),
                                'course_code' => $record['program'] ?? '',
                            ];
                        }
                    }
                    
                    // Build student name
                    $name = trim(($student['first_name'] ?? '') . ' ' . ($student['middle_name'] ?? '') . ' ' . ($student['last_name'] ?? ''));
                    if (isset($student['extension_name']) && $student['extension_name']) {
                        $name .= ' ' . $student['extension_name'];
                    }
                    $name = trim($name) ?: 'Unknown';
                    
                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'student_id' => $student['id'] ?? null,
                        'name' => $name,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $currentRecord['program'] ?? $student['program'] ?? 'Unknown',
                        'year_level' => $currentRecord['year_level'] ?? $student['year_level'] ?? 'Unknown',
                        'gpa' => $gpa,
                        'grades' => $grades,
                        'academic_records' => $academicRecords,
                    ];
                } catch (\Exception $e) {
                    // If we can't fetch academic records, still include basic student info
                    \Log::warning("Failed to fetch academic records for student {$student['id']}: " . $e->getMessage());
                    
                    $name = trim(($student['first_name'] ?? '') . ' ' . ($student['middle_name'] ?? '') . ' ' . ($student['last_name'] ?? ''));
                    if (isset($student['extension_name']) && $student['extension_name']) {
                        $name .= ' ' . $student['extension_name'];
                    }
                    $name = trim($name) ?: 'Unknown';
                    
                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'student_id' => $student['id'] ?? null,
                        'name' => $name,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $student['program'] ?? 'Unknown',
                        'year_level' => $student['year_level'] ?? 'Unknown',
                        'gpa' => null,
                        'grades' => [],
                        'academic_records' => [],
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $transformedStudents
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching student progress data: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load student progress data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get analytics chart data with real student data from scholarship service
     */
    public function getAnalyticsCharts(Request $request)
    {
        try {
            $scholarshipServiceUrl = config('services.scholarship.url', 'http://localhost:8001');
            $token = $request->bearerToken();
            
            // Fetch students from scholarship service
            $client = new \GuzzleHttp\Client(['timeout' => 30]);
            
            // Get all students (with pagination if needed)
            $allStudents = [];
            $page = 1;
            $perPage = 100;
            
            do {
                $response = $client->get("{$scholarshipServiceUrl}/api/students", [
                    'headers' => [
                        'Authorization' => $token ? "Bearer {$token}" : '',
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'per_page' => $perPage,
                        'page' => $page,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!isset($data['success']) || !$data['success']) {
                    break;
                }

                $students = $data['data']['data'] ?? [];
                $allStudents = array_merge($allStudents, $students);
                
                $hasMore = isset($data['data']['next_page_url']) && $data['data']['next_page_url'] !== null;
                $page++;
                
                // Limit to prevent infinite loops
                if ($page > 50) break;
                
            } while ($hasMore && !empty($students));
            
            if (empty($allStudents)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'monthlyEnrollment' => [],
                        'programDistribution' => [],
                        'gpaDistribution' => [],
                        'yearLevelDistribution' => [],
                        'genderDistribution' => []
                    ]
                ]);
            }
            
            // Initialize distribution arrays
            $programDistribution = [];
            $yearLevelDistribution = [];
            $gpaDistribution = [
                'A (90-100)' => 0,
                'B (80-89)' => 0,
                'C (70-79)' => 0,
                'D (60-69)' => 0,
                'F (Below 60)' => 0
            ];
            $monthlyEnrollment = [];
            $genderDistribution = ['Male' => 0, 'Female' => 0, 'Other' => 0];
            
            // Process each student
            foreach ($allStudents as $student) {
                try {
                    // Fetch academic records for this student
                    $academicResponse = $client->get("{$scholarshipServiceUrl}/api/students/{$student['id']}/academic-records", [
                        'headers' => [
                            'Authorization' => $token ? "Bearer {$token}" : '',
                            'Accept' => 'application/json',
                        ],
                    ]);
                    
                    $academicData = json_decode($academicResponse->getBody()->getContents(), true);
                    $academicRecords = $academicData['data'] ?? [];
                    
                    // Get current academic record
                    $currentRecord = collect($academicRecords)->firstWhere('is_current', true) 
                        ?? collect($academicRecords)->sortByDesc('school_year')->first();
                    
                    // Program distribution
                    $program = $currentRecord['program'] ?? $student['program'] ?? 'Unknown';
                    if (!isset($programDistribution[$program])) {
                        $programDistribution[$program] = 0;
                    }
                    $programDistribution[$program]++;
                    
                    // Year level distribution
                    $yearLevel = $currentRecord['year_level'] ?? $student['year_level'] ?? 'Unknown';
                    if (!isset($yearLevelDistribution[$yearLevel])) {
                        $yearLevelDistribution[$yearLevel] = 0;
                    }
                    $yearLevelDistribution[$yearLevel]++;
                    
                    // Gender distribution
                    $gender = $student['sex'] ?? 'Other';
                    if (in_array($gender, ['Male', 'Female'])) {
                        $genderDistribution[$gender]++;
                    } else {
                        $genderDistribution['Other']++;
                    }
                    
                    // GPA calculation
                    $gpa = null;
                    if ($currentRecord) {
                        $gpa = $currentRecord['gpa'] ?? $currentRecord['general_weighted_average'] ?? null;
                    }
                    
                    // If no GPA from current record, calculate average from all records
                    if ($gpa === null && !empty($academicRecords)) {
                        $gpas = array_filter(array_map(function($record) {
                            return $record['gpa'] ?? $record['general_weighted_average'] ?? null;
                        }, $academicRecords));
                        
                        if (!empty($gpas)) {
                            $gpa = array_sum($gpas) / count($gpas);
                        }
                    }
                    
                    // Convert GPA (0-4 scale) to percentage for distribution
                    if ($gpa !== null && $gpa > 0) {
                        $percentage = ($gpa / 4.0) * 100;
                        if ($percentage >= 90) $gpaDistribution['A (90-100)']++;
                        elseif ($percentage >= 80) $gpaDistribution['B (80-89)']++;
                        elseif ($percentage >= 70) $gpaDistribution['C (70-79)']++;
                        elseif ($percentage >= 60) $gpaDistribution['D (60-69)']++;
                        else $gpaDistribution['F (Below 60)']++;
                    }
                    
                    // Monthly enrollment
                    $enrollmentDate = null;
                    if ($currentRecord && isset($currentRecord['enrollment_date'])) {
                        $enrollmentDate = $currentRecord['enrollment_date'];
                    } elseif (isset($student['created_at'])) {
                        $enrollmentDate = $student['created_at'];
                    }
                    
                    if ($enrollmentDate) {
                        try {
                            $date = new \Carbon\Carbon($enrollmentDate);
                            $monthKey = $date->format('Y-m');
                            
                            if (!isset($monthlyEnrollment[$monthKey])) {
                                $monthlyEnrollment[$monthKey] = 0;
                            }
                            $monthlyEnrollment[$monthKey]++;
                        } catch (\Exception $e) {
                            // Skip invalid dates
                        }
                    }
                    
                } catch (\Exception $e) {
                    // If we can't fetch academic records, still count basic info
                    \Log::warning("Failed to fetch academic records for student {$student['id']}: " . $e->getMessage());
                    
                    $program = $student['program'] ?? 'Unknown';
                    if (!isset($programDistribution[$program])) {
                        $programDistribution[$program] = 0;
                    }
                    $programDistribution[$program]++;
                    
                    $yearLevel = $student['year_level'] ?? 'Unknown';
                    if (!isset($yearLevelDistribution[$yearLevel])) {
                        $yearLevelDistribution[$yearLevel] = 0;
                    }
                    $yearLevelDistribution[$yearLevel]++;
                    
                    $gender = $student['sex'] ?? 'Other';
                    if (in_array($gender, ['Male', 'Female'])) {
                        $genderDistribution[$gender]++;
                    } else {
                        $genderDistribution['Other']++;
                    }
                    
                    if (isset($student['created_at'])) {
                        try {
                            $date = new \Carbon\Carbon($student['created_at']);
                            $monthKey = $date->format('Y-m');
                            
                            if (!isset($monthlyEnrollment[$monthKey])) {
                                $monthlyEnrollment[$monthKey] = 0;
                            }
                            $monthlyEnrollment[$monthKey]++;
                        } catch (\Exception $e) {
                            // Skip invalid dates
                        }
                    }
                }
            }
            
            // Transform to chart format
            $totalStudents = count($allStudents);
            
            $chartData = [
                'monthlyEnrollment' => collect($monthlyEnrollment)
                    ->map(function($count, $month) {
                        return [
                            'month' => $month,
                            'students' => $count
                        ];
                    })
                    ->sortBy('month')
                    ->values()
                    ->slice(-12) // Last 12 months
                    ->toArray(),
                'programDistribution' => collect($programDistribution)
                    ->map(function($count, $name) use ($totalStudents) {
                        return [
                            'name' => $name,
                            'value' => $count,
                            'percentage' => $totalStudents > 0 ? round(($count / $totalStudents) * 100, 1) : 0
                        ];
                    })
                    ->values()
                    ->toArray(),
                'gpaDistribution' => collect($gpaDistribution)
                    ->map(function($count, $name) use ($totalStudents) {
                        return [
                            'name' => $name,
                            'value' => $count,
                            'percentage' => $totalStudents > 0 ? round(($count / $totalStudents) * 100, 1) : 0
                        ];
                    })
                    ->values()
                    ->toArray(),
                'yearLevelDistribution' => collect($yearLevelDistribution)
                    ->map(function($count, $name) use ($totalStudents) {
                        return [
                            'name' => $name,
                            'value' => $count,
                            'percentage' => $totalStudents > 0 ? round(($count / $totalStudents) * 100, 1) : 0
                        ];
                    })
                    ->values()
                    ->toArray(),
                'genderDistribution' => collect($genderDistribution)
                    ->filter(function($count) {
                        return $count > 0;
                    })
                    ->map(function($count, $name) use ($totalStudents) {
                        return [
                            'name' => $name,
                            'value' => $count,
                            'percentage' => $totalStudents > 0 ? round(($count / $totalStudents) * 100, 1) : 0
                        ];
                    })
                    ->values()
                    ->toArray(),
            ];
            
            return response()->json([
                'success' => true,
                'data' => $chartData
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching analytics charts data: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics data: ' . $e->getMessage(),
                'data' => [
                    'monthlyEnrollment' => [],
                    'programDistribution' => [],
                    'gpaDistribution' => [],
                    'yearLevelDistribution' => [],
                    'genderDistribution' => []
                ]
            ], 500);
        }
    }

    /**
     * Get enrollment statistics data with real student data from scholarship service
     */
    public function getEnrollmentStatistics(Request $request)
    {
        try {
            $scholarshipServiceUrl = config('services.scholarship.url', 'http://localhost:8001');
            $token = $request->bearerToken();
            
            // Fetch students from scholarship service
            $client = new \GuzzleHttp\Client(['timeout' => 30]);
            
            // Get all students (with pagination if needed)
            $allStudents = [];
            $page = 1;
            $perPage = 100;
            
            do {
                $response = $client->get("{$scholarshipServiceUrl}/api/students", [
                    'headers' => [
                        'Authorization' => $token ? "Bearer {$token}" : '',
                        'Accept' => 'application/json',
                    ],
                    'query' => [
                        'per_page' => $perPage,
                        'page' => $page,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!isset($data['success']) || !$data['success']) {
                    break;
                }

                $students = $data['data']['data'] ?? [];
                $allStudents = array_merge($allStudents, $students);
                
                $hasMore = isset($data['data']['next_page_url']) && $data['data']['next_page_url'] !== null;
                $page++;
                
                // Limit to prevent infinite loops
                if ($page > 50) break;
                
            } while ($hasMore && !empty($students));
            
            if (empty($allStudents)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Transform the data to match frontend expectations
            $transformedStudents = [];
            foreach ($allStudents as $student) {
                try {
                    // Fetch academic records for enrollment info
                    $academicResponse = $client->get("{$scholarshipServiceUrl}/api/students/{$student['id']}/academic-records", [
                        'headers' => [
                            'Authorization' => $token ? "Bearer {$token}" : '',
                            'Accept' => 'application/json',
                        ],
                    ]);
                    
                    $academicData = json_decode($academicResponse->getBody()->getContents(), true);
                    $academicRecords = $academicData['data'] ?? [];
                    
                    // Get current academic record for program and year level
                    $currentRecord = collect($academicRecords)->firstWhere('is_current', true) 
                        ?? collect($academicRecords)->sortByDesc('school_year')->first();
                    
                    // Determine status
                    $status = 'inactive';
                    if ($student['is_currently_enrolled'] ?? false) {
                        $status = 'active';
                    } elseif ($student['is_graduating'] ?? false) {
                        $status = 'graduated';
                    }
                    
                    // Get enrollment date from academic record or student created_at
                    $enrollmentDate = null;
                    if ($currentRecord && isset($currentRecord['enrollment_date'])) {
                        $enrollmentDate = $currentRecord['enrollment_date'];
                    } elseif (isset($student['created_at'])) {
                        $enrollmentDate = $student['created_at'];
                    }
                    
                    // Build student name
                    $name = trim(($student['first_name'] ?? '') . ' ' . ($student['middle_name'] ?? '') . ' ' . ($student['last_name'] ?? ''));
                    if (isset($student['extension_name']) && $student['extension_name']) {
                        $name .= ' ' . $student['extension_name'];
                    }
                    $name = trim($name) ?: 'Unknown';
                    
                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'student_id' => $student['id'] ?? null,
                        'name' => $name,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $currentRecord['program'] ?? $student['program'] ?? 'Unknown',
                        'year_level' => $currentRecord['year_level'] ?? $student['year_level'] ?? 'Unknown',
                        'status' => $status,
                        'enrollmentDate' => $enrollmentDate,
                        'created_at' => $student['created_at'] ?? $enrollmentDate,
                        'is_currently_enrolled' => $student['is_currently_enrolled'] ?? false,
                        'is_graduating' => $student['is_graduating'] ?? false,
                    ];
                } catch (\Exception $e) {
                    // If we can't fetch academic records, still include basic student info
                    \Log::warning("Failed to fetch academic records for student {$student['id']}: " . $e->getMessage());
                    
                    $name = trim(($student['first_name'] ?? '') . ' ' . ($student['middle_name'] ?? '') . ' ' . ($student['last_name'] ?? ''));
                    if (isset($student['extension_name']) && $student['extension_name']) {
                        $name .= ' ' . $student['extension_name'];
                    }
                    $name = trim($name) ?: 'Unknown';
                    
                    $status = 'inactive';
                    if ($student['is_currently_enrolled'] ?? false) {
                        $status = 'active';
                    } elseif ($student['is_graduating'] ?? false) {
                        $status = 'graduated';
                    }
                    
                    $transformedStudents[] = [
                        'id' => $student['id'] ?? null,
                        'student_id' => $student['id'] ?? null,
                        'name' => $name,
                        'first_name' => $student['first_name'] ?? '',
                        'last_name' => $student['last_name'] ?? '',
                        'student_id_number' => $student['student_id_number'] ?? '',
                        'program' => $student['program'] ?? 'Unknown',
                        'year_level' => $student['year_level'] ?? 'Unknown',
                        'status' => $status,
                        'enrollmentDate' => $student['created_at'] ?? null,
                        'created_at' => $student['created_at'] ?? null,
                        'is_currently_enrolled' => $student['is_currently_enrolled'] ?? false,
                        'is_graduating' => $student['is_graduating'] ?? false,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $transformedStudents
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching enrollment statistics data: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load enrollment data: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Calculate trend percentage
     */
    private function calculateTrend($current, $previous): array
    {
        $delta = $current - $previous;
        $deltaPercent = $previous > 0 ? round(($delta / $previous) * 100, 1) : 0;
        
        return [
            'delta' => $delta,
            'delta_percent' => $deltaPercent,
            'direction' => $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'stable'),
        ];
    }

    /**
     * Get active alerts summary for dashboard
     */
    private function getActiveAlerts(): array
    {
        $alerts = AnalyticsAlert::active()
            ->unacknowledged()
            ->orderBy('severity', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $counts = AnalyticsAlert::active()
            ->unacknowledged()
            ->select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity')
            ->toArray();

        return [
            'total' => array_sum($counts),
            'by_severity' => [
                'critical' => $counts['critical'] ?? 0,
                'high' => $counts['high'] ?? 0,
                'medium' => $counts['medium'] ?? 0,
                'low' => $counts['low'] ?? 0,
            ],
            'recent' => $alerts->map(fn($a) => [
                'id' => $a->id,
                'severity' => $a->severity,
                'title' => $a->title,
                'created_at' => $a->created_at->toIso8601String(),
            ])->toArray(),
        ];
    }
}
