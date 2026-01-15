# AI Monitoring Setup Guide

This guide explains how to configure the AI-powered insights feature in the monitoring service.

## Overview

The monitoring service includes an AI analytics layer that generates natural-language insights from your education metrics. It supports multiple AI providers and gracefully falls back to template-based insights when AI is unavailable.

## Features

- **Natural Language Insights**: Converts metrics into human-readable summaries
- **Key Highlights**: Bullet-point style key findings
- **Recommendations**: Prioritized actionable suggestions for administrators
- **Multi-Provider Support**: OpenAI, Anthropic Claude, or custom LLM
- **Fallback Mode**: Template-based insights when AI is unavailable
- **Caching**: Reduces API costs by caching generated insights

## Quick Start

### Option 1: Template Mode (No API Key Required)

For development or when you don't need AI-powered insights:

```env
AI_PROVIDER=template
```

This generates structured insights using predefined templates based on your metrics.

### Option 2: OpenAI

```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-4
# Optional: Use a custom endpoint (e.g., Azure OpenAI)
# AI_API_URL=https://your-endpoint.openai.azure.com/openai/deployments/gpt-4/chat/completions
```

### Option 3: Anthropic Claude

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-your-anthropic-key-here
AI_MODEL=claude-3-sonnet-20240229
```

### Option 4: Custom/Self-Hosted LLM

```env
AI_PROVIDER=custom
AI_API_KEY=your-custom-api-key
AI_API_URL=http://your-llm-server/v1/completions
AI_MODEL=your-model-name
```

## Configuration Options

All settings go in your `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | Provider type: `template`, `openai`, `anthropic`, `custom` | `template` |
| `AI_API_KEY` | API key for the AI provider | |
| `AI_API_URL` | Custom API endpoint URL | Provider default |
| `AI_MODEL` | Model identifier | `gpt-4` |
| `AI_CACHE_TTL` | Cache duration in seconds | `900` (15 min) |
| `AI_RATE_LIMIT` | Max requests per minute (0 = unlimited) | `10` |
| `AI_TIMEOUT` | Request timeout in seconds | `30` |

## API Usage

### Get AI Insights

```http
GET /api/analytics/ai/insights
```

Query parameters:
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `program`: Filter by program name
- `term`: Filter by academic term

Response:
```json
{
  "success": true,
  "provider": "openai",
  "generated_at": "2026-01-14T10:30:00Z",
  "filters_applied": {
    "date_from": "2026-01-01"
  },
  "insights": {
    "highlights": [
      "Currently tracking 5,500 active students out of 5,800 total enrolled.",
      "Active enrollment has increased by 2.3% compared to last week.",
      "45 students (3.2%) are currently at risk, with 12 in high-risk status."
    ],
    "summary": "As of January 14, 2026, the education monitoring system is tracking 5,500 active students across all programs. Enrollment shows an upward trend with a 2.3% increase from the previous week. Academic performance for term 2025-2 reflects an average GPA of 3.12 with 87.5% average attendance.",
    "recommendations": [
      {
        "priority": "high",
        "area": "student_support",
        "action": "Review the 12 high-risk students and schedule academic counseling sessions."
      },
      {
        "priority": "medium",
        "area": "academic_programs",
        "action": "Consider implementing additional tutoring programs for students with GPA below 2.5."
      }
    ]
  },
  "supporting_metrics": {
    "enrollment": {
      "total_students": 5800,
      "active_students": 5500,
      "weekly_change_percent": 2.3
    },
    "performance": {
      "average_gpa": 3.12,
      "at_risk_percentage": 3.2
    }
  },
  "from_cache": false,
  "latency_ms": 1234.56
}
```

### Check AI Status

```http
GET /api/analytics/ai/status
```

Response:
```json
{
  "success": true,
  "status": {
    "provider": "openai",
    "configured": true,
    "model": "gpt-4",
    "cache_ttl_seconds": 900,
    "fallback_available": true
  }
}
```

## How It Works

### 1. Data Aggregation

When insights are requested, the service:
1. Queries `analytics_daily_enrollment` for enrollment stats
2. Queries `analytics_student_performance` for GPA/risk data
3. Aggregates into a compact summary

### 2. Prompt Construction

The aggregated metrics are formatted into a structured prompt:

```
You are an education analytics assistant...

## Current Metrics (as of 2026-01-14)

### Enrollment:
- Total Students: 5,800
- Active Students: 5,500
- Weekly Change: 2.3%

### Academic Performance (Term: 2025-2):
- Average GPA: 3.12
- High Risk Students: 12
...

## Instructions:
Provide a JSON response with highlights, summary, and recommendations...
```

### 3. AI Processing

The prompt is sent to the configured AI provider, which returns structured JSON with insights.

### 4. Caching

Results are cached for `AI_CACHE_TTL` seconds to reduce API costs and improve response time.

### 5. Fallback

If AI fails, the system generates template-based insights using predefined rules.

## Template Mode Details

When `AI_PROVIDER=template` or AI is unavailable, insights are generated using rules:

### Highlights

- Enrollment counts and trends
- At-risk student percentages
- GPA status assessment
- Top programs identification

### Summary

A paragraph combining enrollment state, trends, and performance metrics.

### Recommendations

Based on thresholds:
- High risk count > 10 → "Review high-risk students"
- GPA < 2.5 → "Implement tutoring programs"
- Enrollment drop > 5% → "Investigate retention"
- Attendance < 80% → "Review attendance policies"

## Cost Optimization

### Caching

Default cache TTL is 15 minutes. Adjust based on:
- Data freshness requirements
- API cost budget
- Request volume

```env
AI_CACHE_TTL=3600  # 1 hour for lower costs
AI_CACHE_TTL=300   # 5 minutes for fresher insights
```

### Rate Limiting

Prevent excessive API calls:

```env
AI_RATE_LIMIT=10   # Max 10 requests per minute per IP
AI_RATE_LIMIT=0    # Disable rate limiting
```

### Model Selection

Use efficient models for lower costs:

```env
# OpenAI
AI_MODEL=gpt-3.5-turbo  # Cheaper than gpt-4

# Anthropic
AI_MODEL=claude-3-haiku-20240307  # Cheaper than sonnet/opus
```

## Self-Monitoring

The AI service records its own metrics:

- `ai_insights_latency`: Time to generate insights (ms)
- `ai_insights_success`: 1 for success, 0 for failure

These are stored in `analytics_system_metrics` and visible in the system overview.

### Querying AI Metrics

```sql
SELECT 
    DATE(recorded_at) as date,
    AVG(value) as avg_latency,
    COUNT(*) as request_count
FROM analytics_system_metrics
WHERE metric_type = 'ai_insights_latency'
GROUP BY DATE(recorded_at)
ORDER BY date DESC;
```

## Troubleshooting

### AI Not Working

1. **Check configuration**:
   ```bash
   php artisan tinker
   >>> config('ai')
   ```

2. **Test API key**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $AI_API_KEY"
   ```

3. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log | grep -i "ai"
   ```

### Slow Response Times

- Increase cache TTL
- Use a faster model
- Check network connectivity to AI provider

### Rate Limited

- Reduce request frequency
- Increase cache TTL
- Check if multiple clients are requesting simultaneously

### Invalid JSON Response

The service attempts to parse JSON from markdown code blocks. If parsing fails, it falls back to template mode.

## Security Considerations

1. **API Keys**: Store in `.env`, never commit to git
2. **Data Privacy**: Only aggregated metrics are sent to AI, never individual student data
3. **Rate Limiting**: Enabled by default to prevent abuse
4. **Caching**: Reduces exposure of data to AI provider

## Provider-Specific Notes

### OpenAI

- Supports GPT-4, GPT-4-Turbo, GPT-3.5-Turbo
- Azure OpenAI supported via custom `AI_API_URL`
- Uses chat completions endpoint

### Anthropic

- Supports Claude 3 family (Opus, Sonnet, Haiku)
- Requires `anthropic-version` header (handled automatically)

### Custom

- Expects POST endpoint accepting JSON
- Response should contain `response` or `content` field with JSON string

## Frontend Integration

The GSM admin panel includes an AI Insights Panel component:

```tsx
import AIInsightsPanel from '@/admin/components/modules/educationMonitoring/AIInsightsPanel';

// In your dashboard component
<AIInsightsPanel />

// With compact mode (fewer sections)
<AIInsightsPanel compact />
```

Features:
- Expandable sections (highlights, summary, recommendations)
- Filter controls (date range, program, term)
- Cache indicator
- Refresh button
- Error handling with fallback display

---

**Need Help?**

- Check `storage/logs/laravel.log` for detailed error messages
- Use template mode for testing without API keys
- Review the prompt structure in `AIInsightsService.php`
