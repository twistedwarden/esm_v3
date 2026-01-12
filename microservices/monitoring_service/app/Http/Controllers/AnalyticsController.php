<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AnalyticsDailyEnrollment;
use App\Models\AnalyticsStudentPerformance;
use App\Models\AnalyticsSystemMetric;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get high-level dashboard metrics
     */
    public function getDashboardMetrics()
    {
        // Get the latest snapshot date
        $latestDate = AnalyticsDailyEnrollment::max('snapshot_date');

        if (!$latestDate) {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_students' => 0,
                    'active_students' => 0,
                    'at_risk_count' => 0,
                    'average_gpa' => 0
                ]
            ]);
        }

        // Aggregate current enrollment stats
        $enrollmentStats = AnalyticsDailyEnrollment::where('snapshot_date', $latestDate)
            ->selectRaw('SUM(total_students) as total, SUM(active_students) as active')
            ->first();

        // Get At-Risk Students count (from latest term data)
        // Assuming latest term is the most frequent one recently
        $latestTerm = AnalyticsStudentPerformance::select('academic_term')
            ->orderBy('created_at', 'desc')
            ->limit(1)
            ->value('academic_term');

        $atRiskCount = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->whereIn('risk_level', ['medium', 'high'])
            ->count();

        $avgGpa = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->avg('gpa');

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => (int) $enrollmentStats->total,
                'active_students' => (int) $enrollmentStats->active,
                'at_risk_count' => $atRiskCount,
                'average_gpa' => round($avgGpa, 2),
                'snapshot_date' => $latestDate
            ]
        ]);
    }

    /**
     * Get enrollment trends over the last 6 months
     */
    public function getEnrollmentTrends()
    {
        $sixMonthsAgo = Carbon::now()->subMonths(6);

        $trends = AnalyticsDailyEnrollment::where('snapshot_date', '>=', $sixMonthsAgo)
            ->select('snapshot_date')
            ->selectRaw('SUM(active_students) as active_count')
            ->groupBy('snapshot_date')
            ->orderBy('snapshot_date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->snapshot_date->format('Y-m-d'),
                    'count' => $item->active_count
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $trends
        ]);
    }

    /**
     * Get GPA distribution and Risk distribution
     */
    public function getPerformanceDistribution()
    {
        $latestTerm = AnalyticsStudentPerformance::select('academic_term')
            ->orderBy('created_at', 'desc')
            ->limit(1)
            ->value('academic_term');

        $riskDistribution = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->select('risk_level', DB::raw('count(*) as count'))
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level');

        // GPA Ranges
        $gpaRanges = AnalyticsStudentPerformance::where('academic_term', $latestTerm)
            ->selectRaw("
                CASE 
                    WHEN gpa >= 3.5 THEN '3.5-4.0'
                    WHEN gpa >= 3.0 THEN '3.0-3.49'
                    WHEN gpa >= 2.0 THEN '2.0-2.99'
                    ELSE 'Below 2.0'
                END as gpa_range,
                count(*) as count
            ")
            ->groupBy('gpa_range')
            ->pluck('count', 'gpa_range');

        return response()->json([
            'success' => true,
            'data' => [
                'term' => $latestTerm,
                'risk_distribution' => $riskDistribution,
                'gpa_distribution' => $gpaRanges
            ]
        ]);
    }
}
