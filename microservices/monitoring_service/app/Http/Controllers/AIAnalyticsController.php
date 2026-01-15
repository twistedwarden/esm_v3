<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AIInsightsService;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;

/**
 * AIAnalyticsController
 * 
 * Provides AI-powered analytics insights for the GSM monitoring dashboard.
 * Uses AIInsightsService to generate natural-language summaries and recommendations.
 * 
 * @package App\Http\Controllers
 */
class AIAnalyticsController extends Controller
{
    private AIInsightsService $aiService;

    public function __construct(AIInsightsService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Get AI-generated insights based on analytics data
     * 
     * Generates natural-language insights including:
     * - highlights: Key bullet-point insights
     * - summary: Paragraph summary of metrics state
     * - recommendations: Actionable suggestions with priorities
     * - supporting_metrics: The underlying data used for analysis
     * 
     * Query Parameters:
     * - date_from: Start date for analysis (default: 30 days ago)
     * - date_to: End date for analysis (default: today)
     * - program: Filter by specific program
     * - term: Filter by academic term
     * 
     * Response:
     * {
     *   "success": true,
     *   "provider": "openai|anthropic|template",
     *   "generated_at": "2026-01-14T10:30:00Z",
     *   "filters_applied": { ... },
     *   "insights": {
     *     "highlights": [...],
     *     "summary": "...",
     *     "recommendations": [...]
     *   },
     *   "supporting_metrics": { ... },
     *   "from_cache": false,
     *   "latency_ms": 1234.56
     * }
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInsights(Request $request)
    {
        // Rate limiting
        $rateLimitKey = 'ai_insights_' . ($request->ip() ?? 'unknown');
        $maxAttempts = config('ai.rate_limit_per_minute', 10);

        if ($maxAttempts > 0 && RateLimiter::tooManyAttempts($rateLimitKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after_seconds' => $seconds
            ], 429);
        }

        if ($maxAttempts > 0) {
            RateLimiter::hit($rateLimitKey, 60);
        }

        // Validate request
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'program' => 'nullable|string|max:100',
            'term' => 'nullable|string|max:20',
            'refresh' => 'nullable|string|in:true,false,1,0',
        ]);

        // Build filters array
        $filters = array_filter([
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
            'program' => $validated['program'] ?? null,
            'term' => $validated['term'] ?? null,
        ]);

        // Force refresh if requested (clears cache)
        $forceRefresh = filter_var($request->get('refresh', false), FILTER_VALIDATE_BOOLEAN);

        try {
            $result = $this->aiService->generateInsights($filters, $forceRefresh);

            Log::info('AI insights generated', [
                'filters' => $filters,
                'provider' => $result['provider'] ?? 'unknown',
                'from_cache' => $result['from_cache'] ?? false
            ]);

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('AI insights generation failed', [
                'error' => $e->getMessage(),
                'filters' => $filters
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate insights',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get AI service status
     * 
     * Returns information about the configured AI provider and its status.
     * Useful for frontend to determine if AI features are available.
     * 
     * Response:
     * {
     *   "success": true,
     *   "status": {
     *     "provider": "openai",
     *     "configured": true,
     *     "model": "gpt-4",
     *     "cache_ttl_seconds": 900,
     *     "fallback_available": true
     *   }
     * }
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatus()
    {
        return response()->json([
            'success' => true,
            'status' => $this->aiService->getStatus()
        ]);
    }
}
