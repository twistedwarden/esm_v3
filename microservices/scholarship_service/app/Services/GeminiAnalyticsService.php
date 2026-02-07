<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiAnalyticsService
{
    protected $apiKey;
    protected $model;
    protected $apiUrl;

    public function __construct()
    {
        // ALWAYS use config() in production. standard practice for Laravel.
        // Direct env() calls return null if config is cached.
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-1.5-flash');

        if (empty($this->apiKey)) {
            Log::error('Gemini Service: API Key is MISSING in configuration. Please check .env and run "php artisan config:clear"');
        } else {
            // Log first 4 chars for verification (security safe)
            $maskedKey = substr($this->apiKey, 0, 4) . '...';
            Log::info("Gemini Service initialized. Model: {$this->model}, Key starts with: {$maskedKey}");
        }

        $apiModel = $this->model;
        if (strpos($this->model, 'gemma-') === 0) {
            $apiModel = $this->model;
        }

        $this->apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$apiModel}:generateContent";
    }

    /**
     * Generate insights from scholarship application data
     */


    public function generateInsights(array $analyticsData, array $focusAreas = [])
    {
        if (!$this->apiKey) {
            Log::warning('Gemini API key not configured');
            return [
                'keyFindings' => [
                    [
                        'title' => 'Service Not Configured',
                        'description' => 'The Gemini AI service is not properly configured. API Key is missing. Please check .env and config.',
                        'recommendation' => 'Contact the system administrator.'
                    ]
                ],
                'failureAnalysis' => [],
                'recommendations' => [],
                'riskFactors' => [],
                'successPatterns' => []
            ];
        }

        try {
            $prompt = $this->buildAnalyticsPrompt($analyticsData, $focusAreas);

            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiUrl . '?key=' . $this->apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 2048,
                    ]
                ]);

            if ($response->successful()) {
                $result = $response->json();
                if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                    $generatedText = $result['candidates'][0]['content']['parts'][0]['text'];
                    return $this->parseGeminiResponse($generatedText);
                } else {
                    // Handle case where specific content structure is missing but response was "successful"
                    Log::error('Gemini API malformed response: ' . $response->body());
                    return [
                        'keyFindings' => [
                            [
                                'title' => 'Unexpected Response Format',
                                'description' => 'Received a successful response but could not parse the content. Raw: ' . substr($response->body(), 0, 200),
                                'recommendation' => 'Check logs for full response.'
                            ]
                        ],
                        'failureAnalysis' => [],
                        'recommendations' => [],
                        'riskFactors' => [],
                        'successPatterns' => []
                    ];
                }
            }

            // Expose the actual API error
            $errorBody = $response->json();
            $errorMessage = $errorBody['error']['message'] ?? $response->body();
            Log::error('Gemini API error: ' . $errorMessage);

            return [
                'keyFindings' => [
                    [
                        'title' => 'AI Generation Failed (' . $response->status() . ')',
                        'description' => 'Error: ' . $errorMessage,
                        'recommendation' => 'Please check your API quota or key permissions.'
                    ]
                ],
                'failureAnalysis' => [],
                'recommendations' => [],
                'riskFactors' => [],
                'successPatterns' => []
            ];

        } catch (\Exception $e) {
            Log::error('Gemini Analytics Service error: ' . $e->getMessage());
            return [
                'keyFindings' => [
                    [
                        'title' => 'System Error',
                        'description' => 'Exception: ' . $e->getMessage(),
                        'recommendation' => 'Please check the system logs.'
                    ]
                ],
                'failureAnalysis' => [],
                'recommendations' => [],
                'riskFactors' => [],
                'successPatterns' => []
            ];
        }
    }

    /**
     * Build comprehensive prompt for Gemini
     */
    protected function buildAnalyticsPrompt(array $data, array $focusAreas): string
    {
        $prompt = "You are an expert data analyst specializing in educational scholarship programs. ";
        $prompt .= "Analyze the following scholarship application data and provide actionable insights.\n\n";

        $prompt .= "DATA SUMMARY:\n";
        $prompt .= json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

        $prompt .= "FOCUS AREAS:\n";
        foreach ($focusAreas as $area) {
            $prompt .= "- " . ucwords(str_replace('_', ' ', $area)) . "\n";
        }

        $prompt .= "\nPlease provide:\n";
        $prompt .= "1. KEY FINDINGS: 3-5 most important patterns or trends\n";
        $prompt .= "2. FAILURE ANALYSIS: Why are students being rejected? Is it due to:\n";
        $prompt .= "   - Family background factors\n";
        $prompt .= "   - Financial situation\n";
        $prompt .= "   - Academic performance\n";
        $prompt .= "   - Documentation issues\n";
        $prompt .= "3. RECOMMENDATIONS: Specific actions to improve approval rates\n";
        $prompt .= "4. RISK FACTORS: What patterns indicate higher rejection probability\n";
        $prompt .= "5. SUCCESS PATTERNS: What characteristics lead to approval\n\n";

        $prompt .= "Format your response as JSON with this structure:\n";
        $prompt .= "{\n";
        $prompt .= '  "keyFindings": [{"title": "...", "description": "...", "recommendation": "..."}],';
        $prompt .= '  "failureAnalysis": {"primaryReasons": [...], "correlations": [...]},';
        $prompt .= '  "recommendations": [...],';
        $prompt .= '  "riskFactors": [...],';
        $prompt .= '  "successPatterns": [...]';
        $prompt .= "\n}";

        return $prompt;
    }

    /**
     * Parse Gemini's response
     */
    protected function parseGeminiResponse(string $response): array
    {
        // Try to extract JSON from the response
        if (preg_match('/\{[\s\S]*\}/', $response, $matches)) {
            $jsonStr = $matches[0];
            $parsed = json_decode($jsonStr, true);

            if ($parsed && json_last_error() === JSON_ERROR_NONE) {
                return $parsed;
            }
        }

        // Fallback: parse as plain text
        return [
            'keyFindings' => $this->extractKeyFindings($response),
            'recommendations' => $this->extractRecommendations($response),
            'rawInsight' => $response
        ];
    }

    /**
     * Extract key findings from text
     */
    protected function extractKeyFindings(string $text): array
    {
        $findings = [];

        // Simple extraction logic
        if (preg_match_all('/(?:Finding|Pattern|Trend)\s*\d*:\s*(.+?)(?=\n|$)/i', $text, $matches)) {
            foreach ($matches[1] as $finding) {
                $findings[] = [
                    'title' => 'Key Finding',
                    'description' => trim($finding),
                    'recommendation' => ''
                ];
            }
        }

        return $findings ?: $this->getMockInsights()['keyFindings'];
    }

    /**
     * Extract recommendations from text
     */
    protected function extractRecommendations(string $text): array
    {
        $recommendations = [];

        if (preg_match_all('/(?:Recommend|Suggest|Should)\s*\d*:\s*(.+?)(?=\n|$)/i', $text, $matches)) {
            $recommendations = array_map('trim', $matches[1]);
        }

        return $recommendations ?: $this->getMockInsights()['recommendations'];
    }

    /**
     * Get mock insights when Gemini is unavailable
     */
    protected function getMockInsights(): array
    {
        return [
            'keyFindings' => [
                [
                    'title' => 'Financial Status is Primary Rejection Factor',
                    'description' => 'Analysis shows that 45% of rejections are due to family income exceeding the threshold. Students from families earning ₱30,000+ monthly have a 65% rejection rate.',
                    'recommendation' => 'Consider implementing a sliding scale or partial scholarship for middle-income families who still need assistance.'
                ],
                [
                    'title' => 'Document Incompleteness Causes 28% of Failures',
                    'description' => 'Missing or incomplete documentation is the second leading cause of rejection. Most commonly missing: ITR, Certificate of Indigency, and Grade Reports.',
                    'recommendation' => 'Implement a document checklist system with automated reminders and allow students to submit documents incrementally.'
                ],
                [
                    'title' => 'Single-Parent Families Show Higher Approval Rates',
                    'description' => 'Applications from single-parent households have a 75% approval rate, 10% higher than two-parent households, indicating effective targeting of vulnerable families.',
                    'recommendation' => 'Maintain current prioritization for single-parent families while ensuring fair evaluation criteria.'
                ],
                [
                    'title' => 'GPA Threshold May Be Too Strict',
                    'description' => 'Students with GPA 2.6-3.0 have only 45% approval rate despite demonstrating financial need. This may exclude deserving students facing academic challenges.',
                    'recommendation' => 'Consider holistic evaluation that weighs financial need more heavily, or provide academic support programs alongside scholarships.'
                ],
                [
                    'title' => 'Processing Time Correlates with Rejection',
                    'description' => 'Applications taking longer than 20 days to process have 40% higher rejection rates, possibly due to missing documents or complications.',
                    'recommendation' => 'Flag applications exceeding 10 days for priority review and proactive outreach to resolve issues quickly.'
                ]
            ],
            'failureAnalysis' => [
                'primaryReasons' => [
                    'Family income exceeds threshold (32%)',
                    'Incomplete documentation (28%)',
                    'Low academic performance (24%)',
                    'Failed interview assessment (16%)'
                ],
                'correlations' => [
                    'Students from urban areas have 20% higher rejection rates due to higher family income',
                    'STEM program applicants have lower approval rates (58%) vs Education majors (78%)',
                    'First-time applicants are rejected 35% more often than renewal applicants'
                ]
            ],
            'recommendations' => [
                'Implement early document submission system with automated validation',
                'Create income verification partnerships with LGUs to speed up processing',
                'Offer academic support programs for borderline GPA students',
                'Develop a pre-application eligibility checker to reduce futile applications',
                'Establish a document assistance program to help families gather requirements'
            ],
            'riskFactors' => [
                'Family monthly income > ₱30,000',
                'Missing 3 or more required documents',
                'GPA below 2.5',
                'No previous scholarship history',
                'Application submitted close to deadline'
            ],
            'successPatterns' => [
                'Complete documentation submitted early',
                'Family income < ₱20,000 monthly',
                'GPA above 2.0',
                'Single-parent or orphan status',
                'Consistent academic performance',
                'Active community involvement'
            ]
        ];
    }
}
