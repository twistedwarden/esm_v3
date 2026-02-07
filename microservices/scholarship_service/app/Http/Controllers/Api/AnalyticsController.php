<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\Document;
use App\Services\GeminiAnalyticsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiAnalyticsService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Get comprehensive analytics data
     */
    public function getComprehensiveAnalytics(Request $request): JsonResponse
    {
        try {
            $timeRange = $request->input('timeRange', 'all');
            $category = $request->input('category', 'all');

            Log::info("Fetching analytics - TimeRange: {$timeRange}, Category: {$category}");

            $query = ScholarshipApplication::query();

            // Apply time filter
            $query = $this->applyTimeFilter($query, $timeRange);

            // Get all applications for analysis
            $applications = $query->with(['student', 'documents'])->get();

            Log::info("Found {$applications->count()} applications for analysis");

            $analytics = [
                'failureReasons' => $this->analyzeFailureReasons($applications),
                'financialDistribution' => $this->analyzeFinancialDistribution($applications),
                'familyBackgroundImpact' => $this->analyzeFamilyBackground($applications),
                'gpaVsApproval' => $this->analyzeGPAImpact($applications),
                'monthlyTrends' => $this->analyzeMonthlyTrends($timeRange),
                'documentCompleteness' => $this->analyzeDocumentCompleteness($applications),
                'programDistribution' => $this->analyzeProgramDistribution($applications),
                'geographicDistribution' => $this->analyzeGeographicDistribution($applications),
                'processingTimeAnalysis' => $this->analyzeProcessingTime($applications),
                'renewalVsNew' => $this->analyzeRenewalPatterns($applications),
                'summary' => [
                    'totalApplications' => $applications->count(),
                    'approvalRate' => $this->calculateApprovalRate($applications),
                    'avgProcessingTime' => $this->calculateAvgProcessingTime($applications),
                    'totalAidDistributed' => $this->calculateTotalAid($applications)
                ]
            ];

            Log::info("Analytics generated successfully", [
                'totalApplications' => $analytics['summary']['totalApplications'],
                'approvalRate' => $analytics['summary']['approvalRate']
            ]);

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);

        } catch (\Exception $e) {
            Log::error('Analytics error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Gemini AI insights
     */
    public function generateGeminiInsights(Request $request): JsonResponse
    {
        try {
            $analyticsData = $request->input('analyticsData', []);
            $focusAreas = $request->input('focusAreas', [
                'failure_reasons',
                'financial_patterns',
                'family_background',
                'academic_performance'
            ]);

            Log::info('Generating Gemini insights', [
                'dataSize' => count($analyticsData),
                'focusAreas' => $focusAreas
            ]);

            $insights = $this->geminiService->generateInsights($analyticsData, $focusAreas);

            Log::info('Gemini insights generated', [
                'keyFindingsCount' => count($insights['keyFindings'] ?? [])
            ]);

            return response()->json([
                'success' => true,
                'data' => $insights
            ]);

        } catch (\Exception $e) {
            Log::error('Gemini insights error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate insights: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Analyze failure reasons
     */
    protected function analyzeFailureReasons($applications): array
    {
        $rejected = $applications->where('status', 'rejected');

        $reasons = [
            'Incomplete Documents' => 0,
            'Low GPA' => 0,
            'Family Income Too High' => 0,
            'Failed Interview' => 0,
            'Missing Requirements' => 0,
            'Other' => 0
        ];

        foreach ($rejected as $app) {
            $reason = $app->rejection_reason ?? 'Other';

            // Categorize rejection reasons
            if (stripos($reason, 'document') !== false || stripos($reason, 'incomplete') !== false) {
                $reasons['Incomplete Documents']++;
            } elseif (stripos($reason, 'gpa') !== false || stripos($reason, 'grade') !== false) {
                $reasons['Low GPA']++;
            } elseif (stripos($reason, 'income') !== false || stripos($reason, 'financial') !== false) {
                $reasons['Family Income Too High']++;
            } elseif (stripos($reason, 'interview') !== false) {
                $reasons['Failed Interview']++;
            } elseif (stripos($reason, 'requirement') !== false) {
                $reasons['Missing Requirements']++;
            } else {
                $reasons['Other']++;
            }
        }

        $total = array_sum($reasons);
        $result = [];

        foreach ($reasons as $reason => $count) {
            if ($count > 0) {
                $result[] = [
                    'reason' => $reason,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0
                ];
            }
        }

        // Sort by count descending
        usort($result, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $result;
    }

    /**
     * Analyze financial distribution
     */
    protected function analyzeFinancialDistribution($applications): array
    {
        $ranges = [
            '< ₱10,000' => ['min' => 0, 'max' => 10000],
            '₱10,000 - ₱20,000' => ['min' => 10000, 'max' => 20000],
            '₱20,000 - ₱30,000' => ['min' => 20000, 'max' => 30000],
            '₱30,000 - ₱50,000' => ['min' => 30000, 'max' => 50000],
            '> ₱50,000' => ['min' => 50000, 'max' => PHP_INT_MAX]
        ];

        $result = [];

        foreach ($ranges as $label => $range) {
            $inRange = $applications->filter(function ($app) use ($range) {
                $income = $app->family_monthly_income ?? 0;
                return $income >= $range['min'] && $income < $range['max'];
            });

            $approved = $inRange->where('status', 'approved')->count();
            $rejected = $inRange->whereIn('status', ['rejected', 'for_compliance'])->count();

            $result[] = [
                'range' => $label,
                'approved' => $approved,
                'rejected' => $rejected,
                'total' => $approved + $rejected
            ];
        }

        return $result;
    }

    /**
     * Analyze family background impact
     */
    protected function analyzeFamilyBackground($applications): array
    {
        $backgrounds = [
            'Single Parent' => 0,
            'Both Parents' => 0,
            'Guardian' => 0,
            'Orphan' => 0
        ];

        $approved = [
            'Single Parent' => 0,
            'Both Parents' => 0,
            'Guardian' => 0,
            'Orphan' => 0
        ];

        foreach ($applications as $app) {
            $status = $app->family_status ?? 'Both Parents';

            if (isset($backgrounds[$status])) {
                $backgrounds[$status]++;
                if ($app->status === 'approved') {
                    $approved[$status]++;
                }
            }
        }

        $result = [];
        foreach ($backgrounds as $factor => $total) {
            if ($total > 0) {
                $result[] = [
                    'factor' => $factor,
                    'impact' => round(($approved[$factor] / $total) * 100, 1),
                    'applications' => $total
                ];
            }
        }

        return $result;
    }

    /**
     * Analyze GPA impact
     */
    protected function analyzeGPAImpact($applications): array
    {
        $ranges = [
            '1.0-1.5' => ['min' => 1.0, 'max' => 1.5],
            '1.6-2.0' => ['min' => 1.6, 'max' => 2.0],
            '2.1-2.5' => ['min' => 2.1, 'max' => 2.5],
            '2.6-3.0' => ['min' => 2.6, 'max' => 3.0],
            '3.1-4.0' => ['min' => 3.1, 'max' => 4.0]
        ];

        $result = [];

        foreach ($ranges as $label => $range) {
            $inRange = $applications->filter(function ($app) use ($range) {
                $gpa = $app->gpa ?? 0;
                return $gpa >= $range['min'] && $gpa <= $range['max'];
            });

            $approved = $inRange->where('status', 'approved')->count();
            $rejected = $inRange->whereIn('status', ['rejected', 'for_compliance'])->count();

            $result[] = [
                'gpa' => $label,
                'approved' => $approved,
                'rejected' => $rejected
            ];
        }

        return $result;
    }

    /**
     * Analyze monthly trends
     */
    protected function analyzeMonthlyTrends($timeRange): array
    {
        $months = 6; // Last 6 months
        $result = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $applications = ScholarshipApplication::whereBetween('created_at', [$startOfMonth, $endOfMonth])->get();

            $result[] = [
                'month' => $date->format('M'),
                'applications' => $applications->count(),
                'approved' => $applications->where('status', 'approved')->count(),
                'rejected' => $applications->whereIn('status', ['rejected', 'for_compliance'])->count()
            ];
        }

        return $result;
    }

    /**
     * Analyze document completeness
     */
    protected function analyzeDocumentCompleteness($applications): array
    {
        $complete = 0;
        $missing1to2 = 0;
        $missing3plus = 0;

        foreach ($applications as $app) {
            $requiredDocs = 8; // Assuming 8 required documents
            $submittedDocs = $app->documents()->count();
            $missing = $requiredDocs - $submittedDocs;

            if ($missing === 0) {
                $complete++;
            } elseif ($missing <= 2) {
                $missing1to2++;
            } else {
                $missing3plus++;
            }
        }

        return [
            ['category' => 'Complete', 'value' => $complete],
            ['category' => 'Missing 1-2', 'value' => $missing1to2],
            ['category' => 'Missing 3+', 'value' => $missing3plus]
        ];
    }

    /**
     * Analyze program distribution
     */
    protected function analyzeProgramDistribution($applications): array
    {
        return $applications->groupBy('program')
            ->map(function ($group, $program) {
                return [
                    'program' => $program ?: 'Not Specified',
                    'count' => $group->count(),
                    'approved' => $group->where('status', 'approved')->count()
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Analyze geographic distribution
     */
    protected function analyzeGeographicDistribution($applications): array
    {
        return $applications->groupBy('barangay')
            ->map(function ($group, $barangay) {
                return [
                    'location' => $barangay ?: 'Not Specified',
                    'count' => $group->count(),
                    'approvalRate' => $group->count() > 0
                        ? round(($group->where('status', 'approved')->count() / $group->count()) * 100, 1)
                        : 0
                ];
            })
            ->values()
            ->take(10) // Top 10 locations
            ->toArray();
    }

    /**
     * Analyze processing time
     */
    protected function analyzeProcessingTime($applications): array
    {
        // Use filter for Collections instead of query builder methods
        $processed = $applications->filter(function ($app) {
            return !is_null($app->approved_at) || !is_null($app->rejected_at);
        });

        $timeBuckets = [
            '0-7 days' => 0,
            '8-14 days' => 0,
            '15-21 days' => 0,
            '22-30 days' => 0,
            '30+ days' => 0
        ];

        foreach ($processed as $app) {
            // Skip if submitted_at is null
            if (!$app->submitted_at) {
                continue;
            }

            $start = Carbon::parse($app->submitted_at);
            $end = Carbon::parse($app->approved_at ?? $app->rejected_at);
            $days = $start->diffInDays($end);

            if ($days <= 7)
                $timeBuckets['0-7 days']++;
            elseif ($days <= 14)
                $timeBuckets['8-14 days']++;
            elseif ($days <= 21)
                $timeBuckets['15-21 days']++;
            elseif ($days <= 30)
                $timeBuckets['22-30 days']++;
            else
                $timeBuckets['30+ days']++;
        }

        return array_map(function ($bucket, $count) {
            return ['range' => $bucket, 'count' => $count];
        }, array_keys($timeBuckets), $timeBuckets);
    }

    /**
     * Analyze renewal patterns
     */
    protected function analyzeRenewalPatterns($applications): array
    {
        $new = $applications->where('is_renewal', false);
        $renewal = $applications->where('is_renewal', true);

        return [
            'new' => [
                'total' => $new->count(),
                'approved' => $new->where('status', 'approved')->count(),
                'approvalRate' => $new->count() > 0
                    ? round(($new->where('status', 'approved')->count() / $new->count()) * 100, 1)
                    : 0
            ],
            'renewal' => [
                'total' => $renewal->count(),
                'approved' => $renewal->where('status', 'approved')->count(),
                'approvalRate' => $renewal->count() > 0
                    ? round(($renewal->where('status', 'approved')->count() / $renewal->count()) * 100, 1)
                    : 0
            ]
        ];
    }

    /**
     * Helper methods
     */
    protected function applyTimeFilter($query, $timeRange)
    {
        switch ($timeRange) {
            case 'month':
                return $query->where('created_at', '>=', Carbon::now()->subMonth());
            case 'quarter':
                return $query->where('created_at', '>=', Carbon::now()->subMonths(3));
            case 'year':
                return $query->where('created_at', '>=', Carbon::now()->subYear());
            default:
                return $query;
        }
    }

    protected function calculateApprovalRate($applications)
    {
        $total = $applications->count();
        if ($total === 0)
            return 0;

        $approved = $applications->where('status', 'approved')->count();
        return round(($approved / $total) * 100, 1);
    }

    protected function calculateAvgProcessingTime($applications)
    {
        $processed = $applications->filter(function ($app) {
            return $app->submitted_at && ($app->approved_at || $app->rejected_at);
        });

        if ($processed->isEmpty())
            return 0;

        $totalDays = $processed->sum(function ($app) {
            $start = Carbon::parse($app->submitted_at);
            $end = Carbon::parse($app->approved_at ?? $app->rejected_at);
            return $start->diffInDays($end);
        });

        return round($totalDays / $processed->count(), 1);
    }

    protected function calculateTotalAid($applications)
    {
        return $applications->where('status', 'approved')
            ->sum('scholarship_amount') ?? 0;
    }
}
