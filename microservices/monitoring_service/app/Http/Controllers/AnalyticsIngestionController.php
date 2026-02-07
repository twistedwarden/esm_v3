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
use App\Events\MetricsUpdated;
use App\Events\AlertCreated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

/**
 * AnalyticsIngestionController
 * 
 * Handles data ingestion from other microservices.
 * 
 * @package App\Http\Controllers
 */
class AnalyticsIngestionController extends Controller
{
    /**
     * Ingest application pipeline snapshot
     */
    public function ingestApplicationSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'applications' => 'required|array',
            'applications.total' => 'required|integer|min:0',
            'applications.by_status' => 'array',
            'applications.by_type' => 'array',
            'applications.by_category' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $apps = $request->input('applications');
        $byStatus = $apps['by_status'] ?? [];
        $byType = $apps['by_type'] ?? [];
        $byCategory = $apps['by_category'] ?? [];

        try {
            // Calculate approval rate
            $approvalRate = ($apps['total'] ?? 0) > 0
                ? round((($byStatus['approved'] ?? 0) / $apps['total']) * 100, 2)
                : 0;

            $data = [
                'snapshot_date' => $snapshotDate,
                'total_applications' => $apps['total'] ?? 0,
                'draft_count' => $byStatus['draft'] ?? 0,
                'submitted_count' => $byStatus['submitted'] ?? 0,
                'reviewed_count' => $byStatus['reviewed'] ?? 0,
                'approved_count' => $byStatus['approved'] ?? 0,
                'rejected_count' => $byStatus['rejected'] ?? 0,
                'processing_count' => $byStatus['processing'] ?? 0,
                'released_count' => $byStatus['released'] ?? 0,
                'on_hold_count' => $byStatus['on_hold'] ?? 0,
                'cancelled_count' => $byStatus['cancelled'] ?? 0,
                'new_applications' => $byType['new'] ?? 0,
                'renewal_applications' => $byType['renewal'] ?? 0,
                'merit_count' => $byCategory['merit'] ?? 0,
                'need_based_count' => $byCategory['need_based'] ?? 0,
                'special_count' => $byCategory['special'] ?? 0,
                'avg_processing_days' => $apps['avg_processing_days'] ?? 0,
                'applications_submitted_today' => $apps['submitted_today'] ?? 0,
                'applications_approved_today' => $apps['approved_today'] ?? 0,
                'applications_rejected_today' => $apps['rejected_today'] ?? 0,
                'total_requested_amount' => $apps['total_requested_amount'] ?? 0,
                'total_approved_amount' => $apps['total_approved_amount'] ?? 0,
                'approval_rate' => $approvalRate,
            ];

            AnalyticsApplicationDaily::updateOrCreate(
                ['snapshot_date' => $snapshotDate],
                $data
            );

            Log::info('Application snapshot ingested', ['snapshot_date' => $snapshotDate]);

            // Broadcast real-time update
            broadcast(new MetricsUpdated('application', [
                'total_applications' => $data['total_applications'],
                'pending_review' => $data['submitted_count'] + $data['reviewed_count'],
                'approved_count' => $data['approved_count'],
                'rejected_count' => $data['rejected_count'],
                'approval_rate' => $data['total_applications'] > 0
                    ? round(($data['approved_count'] / $data['total_applications']) * 100, 2)
                    : 0,
                'by_status' => $byStatus,
                'by_type' => $byType,
                'snapshot_date' => $snapshotDate,
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Application snapshot ingested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest application snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest financial/budget snapshot
     */
    public function ingestFinancialSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'school_year' => 'nullable|string|max:20',
            'budget' => 'required|array',
            'budget.total' => 'required|numeric|min:0',
            'disbursements' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $schoolYear = $request->input('school_year');
        $budget = $request->input('budget');
        $disbursements = $request->input('disbursements', []);
        $byMethod = $disbursements['by_method'] ?? [];

        try {
            $data = [
                'snapshot_date' => $snapshotDate,
                'school_year' => $schoolYear,
                'total_budget' => $budget['total'] ?? 0,
                'allocated_budget' => $budget['allocated'] ?? 0,
                'disbursed_budget' => $budget['disbursed'] ?? 0,
                'remaining_budget' => ($budget['total'] ?? 0) - ($budget['disbursed'] ?? 0),
                'disbursements_count' => $disbursements['count'] ?? 0,
                'disbursements_amount' => $disbursements['total_amount'] ?? 0,
                'avg_disbursement_amount' => ($disbursements['count'] ?? 0) > 0
                    ? ($disbursements['total_amount'] ?? 0) / $disbursements['count']
                    : 0,
                'gcash_amount' => $byMethod['gcash'] ?? 0,
                'paymaya_amount' => $byMethod['paymaya'] ?? 0,
                'bank_amount' => $byMethod['bank'] ?? 0,
                'cash_amount' => $byMethod['cash'] ?? 0,
                'other_amount' => $byMethod['other'] ?? 0,
            ];

            AnalyticsFinancialDaily::updateOrCreate(
                ['snapshot_date' => $snapshotDate, 'school_year' => $schoolYear],
                $data
            );

            Log::info('Financial snapshot ingested', ['snapshot_date' => $snapshotDate]);

            // Broadcast real-time update
            broadcast(new MetricsUpdated('financial', [
                'total_budget' => $data['total_budget'],
                'disbursed_budget' => $data['disbursed_budget'],
                'remaining_budget' => $data['remaining_budget'],
                'utilization_rate' => $data['total_budget'] > 0
                    ? round(($data['disbursed_budget'] / $data['total_budget']) * 100, 2)
                    : 0,
                'disbursements_count' => $data['disbursements_count'],
                'snapshot_date' => $snapshotDate,
            ]));

            // Check for budget alerts
            if ($data['total_budget'] > 0) {
                $remainingPercent = ($data['remaining_budget'] / $data['total_budget']) * 100;
                if ($remainingPercent < 10) {
                    broadcast(new AlertCreated(
                        'budget_critical',
                        'high',
                        'Critical Budget Alert',
                        'Remaining budget is below 10%',
                        ['remaining_percent' => round($remainingPercent, 2)]
                    ));
                } elseif ($remainingPercent < 25) {
                    broadcast(new AlertCreated(
                        'budget_low',
                        'medium',
                        'Low Budget Warning',
                        'Remaining budget is below 25%',
                        ['remaining_percent' => round($remainingPercent, 2)]
                    ));
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Financial snapshot ingested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest financial snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest SSC review snapshot
     */
    public function ingestSscSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'reviews' => 'required|array',
            'outcomes' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $reviews = $request->input('reviews');
        $outcomes = $request->input('outcomes', []);

        try {
            $data = [
                'snapshot_date' => $snapshotDate,
                'doc_verification_pending' => $reviews['document_verification']['pending'] ?? 0,
                'doc_verification_completed' => $reviews['document_verification']['completed'] ?? 0,
                'financial_review_pending' => $reviews['financial_review']['pending'] ?? 0,
                'financial_review_completed' => $reviews['financial_review']['completed'] ?? 0,
                'academic_review_pending' => $reviews['academic_review']['pending'] ?? 0,
                'academic_review_completed' => $reviews['academic_review']['completed'] ?? 0,
                'final_approval_pending' => $reviews['final_approval']['pending'] ?? 0,
                'final_approval_completed' => $reviews['final_approval']['completed'] ?? 0,
                'total_approved' => $outcomes['approved'] ?? 0,
                'total_rejected' => $outcomes['rejected'] ?? 0,
                'total_needs_revision' => $outcomes['needs_revision'] ?? 0,
                'avg_review_time_hours' => $request->input('avg_review_hours', 0),
                'reviews_completed_today' => $request->input('completed_today', 0),
            ];

            AnalyticsSscDaily::updateOrCreate(
                ['snapshot_date' => $snapshotDate],
                $data
            );

            Log::info('SSC snapshot ingested', ['snapshot_date' => $snapshotDate]);

            // Broadcast real-time update
            $totalPending = $data['doc_verification_pending'] + $data['financial_review_pending']
                + $data['academic_review_pending'] + $data['final_approval_pending'];

            broadcast(new MetricsUpdated('ssc_reviews', [
                'total_pending' => $totalPending,
                'by_stage' => [
                    'document_verification' => [
                        'pending' => $data['doc_verification_pending'],
                        'completed' => $data['doc_verification_completed'],
                    ],
                    'financial_review' => [
                        'pending' => $data['financial_review_pending'],
                        'completed' => $data['financial_review_completed'],
                    ],
                    'academic_review' => [
                        'pending' => $data['academic_review_pending'],
                        'completed' => $data['academic_review_completed'],
                    ],
                    'final_approval' => [
                        'pending' => $data['final_approval_pending'],
                        'completed' => $data['final_approval_completed'],
                    ],
                ],
                'avg_review_hours' => $data['avg_review_time_hours'],
                'snapshot_date' => $snapshotDate,
            ]));

            // Check for review backlog alert
            if ($totalPending > 50) {
                broadcast(new AlertCreated(
                    'review_backlog',
                    'high',
                    'Review Backlog Alert',
                    "Total pending reviews ({$totalPending}) exceeds threshold",
                    ['total_pending' => $totalPending]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'SSC snapshot ingested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest SSC snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest interview snapshot
     */
    public function ingestInterviewSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'interviews' => 'required|array',
            'results' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $interviews = $request->input('interviews');
        $results = $request->input('results', []);
        $byType = $interviews['by_type'] ?? [];

        try {
            $data = [
                'snapshot_date' => $snapshotDate,
                'scheduled_count' => $interviews['scheduled'] ?? 0,
                'completed_count' => $interviews['completed'] ?? 0,
                'cancelled_count' => $interviews['cancelled'] ?? 0,
                'no_show_count' => $interviews['no_show'] ?? 0,
                'rescheduled_count' => $interviews['rescheduled'] ?? 0,
                'passed_count' => $results['passed'] ?? 0,
                'failed_count' => $results['failed'] ?? 0,
                'needs_followup_count' => $results['needs_followup'] ?? 0,
                'in_person_count' => $byType['in_person'] ?? 0,
                'online_count' => $byType['online'] ?? 0,
                'phone_count' => $byType['phone'] ?? 0,
            ];

            AnalyticsInterviewDaily::updateOrCreate(
                ['snapshot_date' => $snapshotDate],
                $data
            );

            Log::info('Interview snapshot ingested', ['snapshot_date' => $snapshotDate]);

            // Broadcast real-time update
            $passRate = $data['completed_count'] > 0
                ? round(($data['passed_count'] / $data['completed_count']) * 100, 2)
                : 0;
            $noShowRate = $data['scheduled_count'] > 0
                ? round(($data['no_show_count'] / $data['scheduled_count']) * 100, 2)
                : 0;

            broadcast(new MetricsUpdated('interviews', [
                'scheduled' => $data['scheduled_count'],
                'completed' => $data['completed_count'],
                'pass_rate' => $passRate,
                'no_show_rate' => $noShowRate,
                'by_type' => $byType,
                'snapshot_date' => $snapshotDate,
            ]));

            // Check for high no-show rate
            if ($noShowRate > 15) {
                broadcast(new AlertCreated(
                    'high_no_show',
                    'medium',
                    'High Interview No-Show Rate',
                    "No-show rate ({$noShowRate}%) exceeds 15%",
                    ['no_show_rate' => $noShowRate]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Interview snapshot ingested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest interview snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest demographics snapshot
     */
    public function ingestDemographicsSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'students' => 'required|array',
            'students.total' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $students = $request->input('students');
        $gender = $students['gender'] ?? [];
        $special = $students['special_categories'] ?? [];

        try {
            $data = [
                'snapshot_date' => $snapshotDate,
                'total_students' => $students['total'] ?? 0,
                'currently_enrolled' => $students['currently_enrolled'] ?? 0,
                'graduating_students' => $students['graduating'] ?? 0,
                'new_registrations_today' => $students['new_today'] ?? 0,
                'male_count' => $gender['male'] ?? 0,
                'female_count' => $gender['female'] ?? 0,
                'pwd_count' => $special['pwd'] ?? 0,
                'solo_parent_count' => $special['solo_parent'] ?? 0,
                'indigenous_count' => $special['indigenous'] ?? 0,
                'fourps_beneficiary_count' => $special['fourps_beneficiary'] ?? 0,
                'informal_settler_count' => $special['informal_settler'] ?? 0,
                'partner_schools_count' => $students['partner_schools'] ?? 0,
                'caloocan_school_applicants' => $students['caloocan_school_applicants'] ?? 0,
            ];

            AnalyticsDemographicsDaily::updateOrCreate(
                ['snapshot_date' => $snapshotDate],
                $data
            );

            Log::info('Demographics snapshot ingested', ['snapshot_date' => $snapshotDate]);

            // Broadcast real-time update
            broadcast(new MetricsUpdated('demographics', [
                'total_students' => $data['total_students'],
                'currently_enrolled' => $data['currently_enrolled'],
                'graduating_students' => $data['graduating_students'],
                'gender_distribution' => [
                    'male' => $data['male_count'],
                    'female' => $data['female_count'],
                ],
                'special_categories' => [
                    'pwd' => $data['pwd_count'],
                    'fourps' => $data['fourps_beneficiary_count'],
                ],
                'snapshot_date' => $snapshotDate,
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Demographics snapshot ingested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest demographics snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // Legacy Endpoints
    // =========================================================================

    /**
     * Ingest enrollment snapshot data (legacy)
     */
    public function ingestEnrollmentSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'snapshot_date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.program' => 'required|string|max:100',
            'records.*.year_level' => 'required|string|max:50',
            'records.*.total_students' => 'required|integer|min:0',
            'records.*.active_students' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $snapshotDate = $request->input('snapshot_date');
        $records = $request->input('records');
        $inserted = 0;
        $updated = 0;

        try {
            foreach ($records as $record) {
                $existing = AnalyticsDailyEnrollment::where('snapshot_date', $snapshotDate)
                    ->where('program', $record['program'])
                    ->where('year_level', $record['year_level'])
                    ->first();

                if ($existing) {
                    $existing->update([
                        'total_students' => $record['total_students'],
                        'active_students' => $record['active_students'],
                        'dropped_students' => $record['dropped_students'] ?? 0,
                        'graduated_students' => $record['graduated_students'] ?? 0,
                    ]);
                    $updated++;
                } else {
                    AnalyticsDailyEnrollment::create([
                        'snapshot_date' => $snapshotDate,
                        'program' => $record['program'],
                        'year_level' => $record['year_level'],
                        'total_students' => $record['total_students'],
                        'active_students' => $record['active_students'],
                        'dropped_students' => $record['dropped_students'] ?? 0,
                        'graduated_students' => $record['graduated_students'] ?? 0,
                    ]);
                    $inserted++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Enrollment snapshot ingested successfully',
                'data' => ['records_inserted' => $inserted, 'records_updated' => $updated]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest enrollment snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest student performance snapshot (legacy)
     */
    public function ingestPerformanceSnapshot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'academic_term' => 'required|string|max:20',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $academicTerm = $request->input('academic_term');
        $records = $request->input('records');
        $inserted = 0;
        $updated = 0;

        try {
            foreach ($records as $record) {
                $riskLevel = $record['risk_level'] ?? $this->calculateRiskLevel(
                    $record['gpa'] ?? null,
                    $record['attendance_rate'] ?? null
                );

                $existing = AnalyticsStudentPerformance::where('academic_term', $academicTerm)
                    ->where('student_id', $record['student_id'])
                    ->first();

                $data = [
                    'gpa' => $record['gpa'] ?? null,
                    'attendance_rate' => $record['attendance_rate'] ?? null,
                    'failed_subjects_count' => $record['failed_subjects_count'] ?? 0,
                    'risk_level' => $riskLevel,
                ];

                if ($existing) {
                    $existing->update($data);
                    $updated++;
                } else {
                    AnalyticsStudentPerformance::create(array_merge($data, [
                        'student_id' => $record['student_id'],
                        'academic_term' => $academicTerm,
                    ]));
                    $inserted++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Performance snapshot ingested successfully',
                'data' => ['records_inserted' => $inserted, 'records_updated' => $updated]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest performance snapshot', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ingest system metrics
     */
    public function ingestSystemMetrics(Request $request)
    {
        if ($request->has('metrics')) {
            return $this->ingestBatchMetrics($request);
        }

        $validator = Validator::make($request->all(), [
            'recorded_at' => 'required|date',
            'metric_type' => 'required|string|max:100',
            'value' => 'required|numeric',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $metric = AnalyticsSystemMetric::create([
                'recorded_at' => Carbon::parse($request->input('recorded_at')),
                'metric_type' => $request->input('metric_type'),
                'value' => $request->input('value'),
                'metadata' => $request->input('metadata'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'System metric recorded successfully',
                'data' => ['id' => $metric->id]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to ingest system metric', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to ingest metric',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function ingestBatchMetrics(Request $request)
    {
        $metrics = $request->input('metrics');
        $inserted = 0;

        foreach ($metrics as $metric) {
            try {
                AnalyticsSystemMetric::create([
                    'recorded_at' => Carbon::parse($metric['recorded_at']),
                    'metric_type' => $metric['metric_type'],
                    'value' => $metric['value'],
                    'metadata' => $metric['metadata'] ?? null,
                ]);
                $inserted++;
            } catch (\Exception $e) {
                Log::warning('Failed to insert metric', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Batch metrics ingested',
            'data' => ['metrics_inserted' => $inserted]
        ]);
    }

    private function calculateRiskLevel(?float $gpa, ?float $attendance): string
    {
        if ($gpa === null && $attendance === null)
            return 'low';
        if (($gpa !== null && $gpa < 2.0) || ($attendance !== null && $attendance < 75))
            return 'high';
        if (($gpa !== null && $gpa < 2.5) || ($attendance !== null && $attendance < 80))
            return 'medium';
        return 'low';
    }
}
