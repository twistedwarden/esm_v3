<?php

namespace App\Services;

use App\Models\AnalyticsApplicationDaily;
use App\Models\AnalyticsFinancialDaily;
use App\Models\AnalyticsSscDaily;
use App\Models\AnalyticsInterviewDaily;
use App\Models\AnalyticsDemographicsDaily;
use App\Models\AnalyticsSystemMetric;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * AIInsightsService
 * 
 * Generates natural-language insights from analytics data using AI.
 * Supports multiple AI providers with template fallback.
 * 
 * @package App\Services
 */
class AIInsightsService
{
    private string $provider;
    private ?string $apiKey;
    private ?string $apiUrl;
    private string $model;
    private int $cacheTtl;

    public function __construct()
    {
        $this->provider = config('ai.provider', 'template');
        $this->apiKey = config('ai.api_key');
        $this->apiUrl = config('ai.api_url');
        $this->model = config('ai.model', 'gpt-4');
        $this->cacheTtl = config('ai.cache_ttl', 900);
    }

    /**
     * Generate insights based on filters
     * 
     * @param array $filters Filter options
     * @param bool $forceRefresh Clear cache and regenerate
     */
    public function generateInsights(array $filters = [], bool $forceRefresh = false): array
    {
        $startTime = microtime(true);
        $cacheKey = 'ai_insights_' . md5(json_encode($filters));

        // Clear cache if force refresh requested
        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        if (!$forceRefresh && Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);
            $cached['from_cache'] = true;
            return $cached;
        }

        try {
            $metricsSummary = $this->gatherMetricsSummary($filters);

            if ($this->provider === 'template' || empty($this->apiKey)) {
                $insights = $this->generateTemplateInsights($metricsSummary);
            } else {
                $insights = $this->generateAIInsights($metricsSummary);
            }

            $latency = (microtime(true) - $startTime) * 1000;
            $this->recordInsightMetric('ai_insights_latency', $latency, [
                'provider' => $this->provider,
                'from_cache' => false
            ]);
            $this->recordInsightMetric('ai_insights_success', 1, [
                'provider' => $this->provider
            ]);

            $result = [
                'success' => true,
                'provider' => $this->provider === 'template' ? 'template' : $this->provider,
                'generated_at' => now()->toIso8601String(),
                'filters_applied' => $filters,
                'insights' => $insights,
                'supporting_metrics' => $metricsSummary,
                'from_cache' => false,
                'latency_ms' => round($latency, 2)
            ];

            Cache::put($cacheKey, $result, $this->cacheTtl);

            return $result;

        } catch (\Exception $e) {
            Log::error('AI Insights generation failed', [
                'error' => $e->getMessage(),
                'provider' => $this->provider
            ]);

            $this->recordInsightMetric('ai_insights_success', 0, [
                'provider' => $this->provider,
                'error' => $e->getMessage()
            ]);

            $metricsSummary = $this->gatherMetricsSummary($filters);
            $insights = $this->generateTemplateInsights($metricsSummary);

            return [
                'success' => true,
                'provider' => 'template_fallback',
                'generated_at' => now()->toIso8601String(),
                'filters_applied' => $filters,
                'insights' => $insights,
                'supporting_metrics' => $metricsSummary,
                'from_cache' => false,
                'fallback_reason' => $e->getMessage()
            ];
        }
    }

    /**
     * Gather metrics from all analytics tables
     */
    private function gatherMetricsSummary(array $filters): array
    {
        // Get latest snapshots
        $latestApp = AnalyticsApplicationDaily::orderBy('snapshot_date', 'desc')->first();
        $latestFinancial = AnalyticsFinancialDaily::orderBy('snapshot_date', 'desc')->first();
        $latestSsc = AnalyticsSscDaily::orderBy('snapshot_date', 'desc')->first();
        $latestInterview = AnalyticsInterviewDaily::orderBy('snapshot_date', 'desc')->first();
        $latestDemographics = AnalyticsDemographicsDaily::orderBy('snapshot_date', 'desc')->first();

        // Get week ago for trends
        $weekAgo = Carbon::today()->subDays(7)->toDateString();
        $weekAgoApp = AnalyticsApplicationDaily::where('snapshot_date', $weekAgo)->first();

        // Calculate trends
        $applicationTrend = 0;
        if ($weekAgoApp && $weekAgoApp->total_applications > 0) {
            $applicationTrend = round(
                (($latestApp->total_applications ?? 0) - $weekAgoApp->total_applications)
                / $weekAgoApp->total_applications * 100,
                1
            );
        }

        return [
            'period' => [
                'snapshot_date' => $latestApp->snapshot_date ?? now()->toDateString(),
                'comparison_date' => $weekAgo,
            ],
            'applications' => [
                'total' => $latestApp->total_applications ?? 0,
                'pending_review' => ($latestApp->submitted_count ?? 0) + ($latestApp->reviewed_count ?? 0),
                'approved' => $latestApp->approved_count ?? 0,
                'rejected' => $latestApp->rejected_count ?? 0,
                'processing' => $latestApp->processing_count ?? 0,
                'released' => $latestApp->released_count ?? 0,
                'new_today' => $latestApp->applications_submitted_today ?? 0,
                'approved_today' => $latestApp->applications_approved_today ?? 0,
                'approval_rate' => $latestApp->approval_rate ?? 0,
                'avg_processing_days' => (float) ($latestApp->avg_processing_days ?? 0),
                'weekly_change_percent' => $applicationTrend,
                'by_type' => [
                    'new' => $latestApp->new_applications ?? 0,
                    'renewal' => $latestApp->renewal_applications ?? 0,
                ],
                'by_category' => [
                    'merit' => $latestApp->merit_count ?? 0,
                    'need_based' => $latestApp->need_based_count ?? 0,
                    'special' => $latestApp->special_count ?? 0,
                ],
            ],
            'financial' => [
                'total_budget' => (float) ($latestFinancial->total_budget ?? 0),
                'disbursed_budget' => (float) ($latestFinancial->disbursed_budget ?? 0),
                'remaining_budget' => (float) ($latestFinancial->remaining_budget ?? 0),
                'utilization_rate' => $latestFinancial->utilization_rate ?? 0,
                'disbursements_today' => $latestFinancial->disbursements_count ?? 0,
                'avg_disbursement' => (float) ($latestFinancial->avg_disbursement_amount ?? 0),
            ],
            'ssc_reviews' => [
                'total_pending' => $latestSsc->total_pending ?? 0,
                'completed_today' => $latestSsc->reviews_completed_today ?? 0,
                'avg_review_hours' => (float) ($latestSsc->avg_review_time_hours ?? 0),
                'bottleneck_stage' => $latestSsc->bottleneck_stage ?? 'none',
                'outcomes' => [
                    'approved' => $latestSsc->total_approved ?? 0,
                    'rejected' => $latestSsc->total_rejected ?? 0,
                    'needs_revision' => $latestSsc->total_needs_revision ?? 0,
                ],
            ],
            'interviews' => [
                'scheduled' => $latestInterview->scheduled_count ?? 0,
                'completed' => $latestInterview->completed_count ?? 0,
                'no_show' => $latestInterview->no_show_count ?? 0,
                'pass_rate' => $latestInterview->pass_rate ?? 0,
                'no_show_rate' => $latestInterview->no_show_rate ?? 0,
            ],
            'demographics' => [
                'total_students' => $latestDemographics->total_students ?? 0,
                'currently_enrolled' => $latestDemographics->currently_enrolled ?? 0,
                'new_today' => $latestDemographics->new_registrations_today ?? 0,
                'pwd_count' => $latestDemographics->pwd_count ?? 0,
                'pwd_percentage' => $latestDemographics->pwd_percentage ?? 0,
                'fourps_count' => $latestDemographics->fourps_beneficiary_count ?? 0,
                'fourps_percentage' => $latestDemographics->fourps_percentage ?? 0,
                'partner_schools' => $latestDemographics->partner_schools_count ?? 0,
            ],
        ];
    }

    /**
     * Generate template-based insights
     */
    private function generateTemplateInsights(array $metrics): array
    {
        $highlights = [];
        $recommendations = [];

        $apps = $metrics['applications'];
        $financial = $metrics['financial'];
        $ssc = $metrics['ssc_reviews'];
        $interviews = $metrics['interviews'];
        $demographics = $metrics['demographics'];

        // Application Pipeline Highlights
        if ($apps['total'] > 0) {
            $highlights[] = sprintf(
                "Currently managing %s scholarship applications with %s pending review.",
                number_format($apps['total']),
                number_format($apps['pending_review'])
            );

            if ($apps['weekly_change_percent'] != 0) {
                $direction = $apps['weekly_change_percent'] > 0 ? 'increased' : 'decreased';
                $highlights[] = sprintf(
                    "Application volume has %s by %.1f%% compared to last week.",
                    $direction,
                    abs($apps['weekly_change_percent'])
                );
            }

            $highlights[] = sprintf(
                "Approval rate stands at %.1f%% with average processing time of %.1f days.",
                $apps['approval_rate'],
                $apps['avg_processing_days']
            );
        }

        // Financial Highlights
        if ($financial['total_budget'] > 0) {
            $highlights[] = sprintf(
                "Budget utilization at %.1f%% with ₱%s remaining from ₱%s total budget.",
                $financial['utilization_rate'],
                number_format($financial['remaining_budget'], 2),
                number_format($financial['total_budget'], 2)
            );
        }

        // SSC Review Highlights
        if ($ssc['total_pending'] > 0) {
            $highlights[] = sprintf(
                "%d applications pending SSC review. Bottleneck at %s stage.",
                $ssc['total_pending'],
                str_replace('_', ' ', $ssc['bottleneck_stage'])
            );
        }

        // Interview Highlights
        if ($interviews['scheduled'] > 0) {
            $highlights[] = sprintf(
                "%d interviews scheduled with %.1f%% pass rate and %.1f%% no-show rate.",
                $interviews['scheduled'],
                $interviews['pass_rate'],
                $interviews['no_show_rate']
            );
        }

        // Demographics Highlights
        if ($demographics['total_students'] > 0) {
            $highlights[] = sprintf(
                "Serving %s students across %d partner schools. %.1f%% are 4Ps beneficiaries.",
                number_format($demographics['total_students']),
                $demographics['partner_schools'],
                $demographics['fourps_percentage']
            );
        }

        // Generate Recommendations
        if ($apps['pending_review'] > 100) {
            $recommendations[] = [
                'priority' => 'high',
                'area' => 'application_processing',
                'action' => sprintf(
                    "Review backlog of %d applications needs attention. Consider allocating additional reviewers.",
                    $apps['pending_review']
                )
            ];
        }

        if ($apps['avg_processing_days'] > 14) {
            $recommendations[] = [
                'priority' => 'medium',
                'area' => 'processing_efficiency',
                'action' => sprintf(
                    "Average processing time (%.1f days) exceeds target. Review workflow for bottlenecks.",
                    $apps['avg_processing_days']
                )
            ];
        }

        if ($financial['utilization_rate'] > 75) {
            $recommendations[] = [
                'priority' => 'high',
                'area' => 'budget_management',
                'action' => sprintf(
                    "Budget utilization at %.1f%%. Plan for next fiscal period or request additional allocation.",
                    $financial['utilization_rate']
                )
            ];
        } elseif ($financial['utilization_rate'] < 25 && $financial['total_budget'] > 0) {
            $recommendations[] = [
                'priority' => 'medium',
                'area' => 'budget_management',
                'action' => "Budget utilization is low. Consider accelerating disbursements or outreach programs."
            ];
        }

        if ($ssc['total_pending'] > 50) {
            $recommendations[] = [
                'priority' => 'high',
                'area' => 'ssc_review',
                'action' => sprintf(
                    "SSC review queue has %d pending applications. Schedule additional review sessions.",
                    $ssc['total_pending']
                )
            ];
        }

        if ($interviews['no_show_rate'] > 10) {
            $recommendations[] = [
                'priority' => 'medium',
                'area' => 'interview_management',
                'action' => sprintf(
                    "Interview no-show rate (%.1f%%) is high. Implement reminder system or review scheduling.",
                    $interviews['no_show_rate']
                )
            ];
        }

        if (empty($recommendations)) {
            $recommendations[] = [
                'priority' => 'low',
                'area' => 'general',
                'action' => "All metrics are within normal ranges. Continue regular monitoring."
            ];
        }

        // Generate Summary
        $summary = $this->generateSummary($metrics);

        return [
            'highlights' => $highlights,
            'summary' => $summary,
            'recommendations' => $recommendations,
        ];
    }

    /**
     * Generate summary paragraph
     */
    private function generateSummary(array $metrics): string
    {
        $apps = $metrics['applications'];
        $financial = $metrics['financial'];
        $demographics = $metrics['demographics'];

        $parts = [];

        $parts[] = sprintf(
            "As of %s, the scholarship management system is processing %s applications with a %.1f%% approval rate.",
            Carbon::parse($metrics['period']['snapshot_date'])->format('F j, Y'),
            number_format($apps['total']),
            $apps['approval_rate']
        );

        if ($apps['weekly_change_percent'] != 0) {
            $trend = $apps['weekly_change_percent'] > 0 ? 'growth' : 'decline';
            $parts[] = sprintf(
                "Weekly application %s of %.1f%% indicates %s demand.",
                $trend,
                abs($apps['weekly_change_percent']),
                $apps['weekly_change_percent'] > 5 ? 'strong' : ($apps['weekly_change_percent'] > 0 ? 'steady' : 'reduced')
            );
        }

        $parts[] = sprintf(
            "The program serves %s students with ₱%s in available budget (%.1f%% utilized).",
            number_format($demographics['total_students']),
            number_format($financial['remaining_budget'], 2),
            $financial['utilization_rate']
        );

        $pendingTotal = $apps['pending_review'] + ($metrics['ssc_reviews']['total_pending'] ?? 0);
        if ($pendingTotal > 0) {
            $parts[] = sprintf(
                "%d applications are currently in the review pipeline requiring attention.",
                $pendingTotal
            );
        }

        return implode(' ', $parts);
    }

    /**
     * Generate AI-powered insights
     */
    private function generateAIInsights(array $metrics): array
    {
        $prompt = $this->buildPrompt($metrics);

        switch ($this->provider) {
            case 'openai':
                return $this->callOpenAI($prompt);
            case 'anthropic':
                return $this->callAnthropic($prompt);
            case 'gemini':
                return $this->callGemini($prompt);
            case 'groq':
                return $this->callGroq($prompt);
            case 'custom':
                return $this->callCustomAPI($prompt);
            default:
                return $this->generateTemplateInsights($metrics);
        }
    }

    /**
     * Build AI prompt from metrics
     */
    private function buildPrompt(array $metrics): string
    {
        $apps = $metrics['applications'];
        $financial = $metrics['financial'];
        $ssc = $metrics['ssc_reviews'];
        $interviews = $metrics['interviews'];
        $demographics = $metrics['demographics'];

        return <<<PROMPT
You are an education analytics assistant for a government scholarship management system (GSM). Analyze these metrics and provide insights for administrators.

## Current Metrics (as of {$metrics['period']['snapshot_date']})

### Application Pipeline:
- Total Applications: {$apps['total']}
- Pending Review: {$apps['pending_review']}
- Approved: {$apps['approved']} | Rejected: {$apps['rejected']}
- Approval Rate: {$apps['approval_rate']}%
- Avg Processing: {$apps['avg_processing_days']} days
- Weekly Change: {$apps['weekly_change_percent']}%
- New Today: {$apps['new_today']} | Approved Today: {$apps['approved_today']}

### Financial/Budget:
- Total Budget: ₱{$financial['total_budget']}
- Disbursed: ₱{$financial['disbursed_budget']}
- Remaining: ₱{$financial['remaining_budget']}
- Utilization: {$financial['utilization_rate']}%

### SSC Reviews:
- Pending: {$ssc['total_pending']}
- Completed Today: {$ssc['completed_today']}
- Avg Review Time: {$ssc['avg_review_hours']} hours
- Bottleneck: {$ssc['bottleneck_stage']}

### Interviews:
- Scheduled: {$interviews['scheduled']}
- Completed: {$interviews['completed']}
- Pass Rate: {$interviews['pass_rate']}%
- No-Show Rate: {$interviews['no_show_rate']}%

### Demographics:
- Total Students: {$demographics['total_students']}
- Currently Enrolled: {$demographics['currently_enrolled']}
- PWD: {$demographics['pwd_count']} ({$demographics['pwd_percentage']}%)
- 4Ps Beneficiaries: {$demographics['fourps_count']} ({$demographics['fourps_percentage']}%)
- Partner Schools: {$demographics['partner_schools']}

## Instructions:
Provide JSON with:
{
  "highlights": ["5-7 key insights as bullet points"],
  "summary": "2-3 sentence executive summary",
  "recommendations": [
    {"priority": "high|medium|low", "area": "category", "action": "specific action"}
  ]
}

Focus on: trends, risks, efficiency, budget health, and actionable improvements.
PROMPT;
    }

    private function callOpenAI(string $prompt): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post($this->apiUrl ?? 'https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are an education analytics assistant. Respond only with valid JSON.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 1500,
                ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API error: ' . $response->body());
        }

        $content = $response->json('choices.0.message.content');
        return $this->parseJsonResponse($content);
    }

    private function callAnthropic(string $prompt): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'Content-Type' => 'application/json',
            'anthropic-version' => '2023-06-01',
        ])->timeout(30)->post($this->apiUrl ?? 'https://api.anthropic.com/v1/messages', [
                    'model' => $this->model,
                    'max_tokens' => 1500,
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                ]);

        if (!$response->successful()) {
            throw new \Exception('Anthropic API error: ' . $response->body());
        }

        $content = $response->json('content.0.text');
        return $this->parseJsonResponse($content);
    }

    /**
     * Call Google Gemini API (FREE TIER: 15 requests/minute)
     * Get API key at: https://aistudio.google.com/app/apikey
     */
    private function callGemini(string $prompt): array
    {
        $model = $this->model ?: 'gemini-1.5-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(30)->post($url, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => "You are an education analytics assistant. Respond ONLY with valid JSON, no markdown or explanation.\n\n" . $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => 2048,
                    ],
                ]);

        if (!$response->successful()) {
            $error = $response->json('error.message') ?? $response->body();
            throw new \Exception('Gemini API error: ' . $error);
        }

        $content = $response->json('candidates.0.content.parts.0.text');

        if (!$content) {
            throw new \Exception('Empty response from Gemini API');
        }

        return $this->parseJsonResponse($content);
    }

    /**
     * Call Groq API (FREE TIER: generous limits)
     * Get API key at: https://console.groq.com/keys
     */
    private function callGroq(string $prompt): array
    {
        $model = $this->model ?: 'llama-3.1-70b-versatile';

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are an education analytics assistant. Respond ONLY with valid JSON.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 2048,
                ]);

        if (!$response->successful()) {
            throw new \Exception('Groq API error: ' . $response->body());
        }

        $content = $response->json('choices.0.message.content');
        return $this->parseJsonResponse($content);
    }

    private function callCustomAPI(string $prompt): array
    {
        if (!$this->apiUrl) {
            throw new \Exception('Custom API URL not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($this->apiUrl, [
                    'prompt' => $prompt,
                    'model' => $this->model,
                    'max_tokens' => 1500,
                ]);

        if (!$response->successful()) {
            throw new \Exception('Custom API error: ' . $response->body());
        }

        $content = $response->json('response') ?? $response->json('content') ?? $response->body();
        return is_string($content) ? $this->parseJsonResponse($content) : $content;
    }

    private function parseJsonResponse(string $content): array
    {
        $parsed = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $parsed;
        }

        // Try extracting from markdown code blocks
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $content, $matches)) {
            $parsed = json_decode($matches[1], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $parsed;
            }
        }

        throw new \Exception('Failed to parse AI response as JSON');
    }

    private function recordInsightMetric(string $type, float $value, array $metadata = []): void
    {
        try {
            AnalyticsSystemMetric::create([
                'recorded_at' => now(),
                'metric_type' => $type,
                'value' => $value,
                'metadata' => $metadata
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to record insight metric', ['type' => $type, 'error' => $e->getMessage()]);
        }
    }

    public function getStatus(): array
    {
        return [
            'provider' => $this->provider,
            'configured' => !empty($this->apiKey) || $this->provider === 'template',
            'model' => $this->model,
            'cache_ttl_seconds' => $this->cacheTtl,
            'fallback_available' => true
        ];
    }
}
