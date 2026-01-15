# Monitoring Service

The central analytics and monitoring hub for the GSM (Government Scholarship Management) platform. Aggregates data from other microservices and provides education monitoring reports, dashboards, and AI-powered insights.

## Overview

The monitoring service:
- **Aggregates** academic, demographic, and financial trends from scholarship/aid services
- **Tracks** student enrollment, performance, and risk levels over time
- **Generates** education monitoring reports and compliance data
- **Provides** AI-powered natural-language insights for administrators
- **Exposes** dashboards and analytics APIs to the admin frontend

## Tech Stack

- **Backend**: Laravel 11 (PHP 8.2+)
- **Database**: MySQL 8.0+
- **AI Integration**: OpenAI, Anthropic, or custom LLM (configurable)

## Quick Start

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Configure database connection in .env
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=monitoring_service
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations
php artisan migrate

# Seed sample data (optional, for testing)
php artisan db:seed --class=AnalyticsSeeder

# Start the service
php artisan serve --port=8003
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Database name | `monitoring_service` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | |
| `AUTH_SERVICE_URL` | Auth service URL for token validation | `http://localhost:8000` |
| `INTERNAL_SERVICE_TOKEN` | Shared secret for service-to-service auth | |
| `AI_PROVIDER` | AI provider (`template`, `openai`, `anthropic`, `custom`) | `template` |
| `AI_API_KEY` | API key for AI provider | |
| `AI_MODEL` | AI model to use | `gpt-4` |
| `AI_CACHE_TTL` | Cache TTL for AI insights (seconds) | `900` |

## API Endpoints

### Public Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/analytics/dashboard` | High-level KPIs with trends |
| GET | `/api/analytics/enrollment-trends` | Enrollment over time |
| GET | `/api/analytics/performance-distribution` | GPA and risk distributions |
| GET | `/api/analytics/system-overview` | System health metrics |
| GET | `/api/analytics/filter-options` | Available filter values |
| GET | `/api/analytics/ai/insights` | AI-generated insights |
| GET | `/api/analytics/ai/status` | AI service status |

### Internal (Service-to-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/internal/analytics/enrollment-snapshot` | Ingest enrollment data |
| POST | `/api/internal/analytics/performance-snapshot` | Ingest performance data |
| POST | `/api/internal/analytics/system-metrics` | Ingest system metrics |

## Data Model

### Core Tables

- **`analytics_daily_enrollment`**: Daily snapshots of enrollment by program/year
- **`analytics_student_performance`**: Per-student GPA, attendance, risk level by term
- **`analytics_system_metrics`**: System health metrics (response time, errors, etc.)

See [METRICS.md](METRICS.md) for detailed KPI definitions and data contracts.

## AI Insights

The service includes an AI-powered insights engine that generates natural-language summaries and recommendations from the analytics data.

### Features

- **Highlights**: Key bullet-point insights (trends, anomalies, risks)
- **Summary**: Paragraph summary of current state
- **Recommendations**: Prioritized actionable suggestions

### Configuration

See [AI_MONITORING_SETUP.md](AI_MONITORING_SETUP.md) for detailed AI setup instructions.

### Quick AI Setup

```bash
# Use template-based insights (no API key needed)
AI_PROVIDER=template

# Or use OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-your-key-here
AI_MODEL=gpt-4
```

## Security

### Authentication

- **User endpoints**: Validate Bearer tokens against auth service
- **Internal endpoints**: Use shared service tokens
- In development, authentication is optional (configurable)

### Role-Based Access

- `admin`: Full access to all analytics
- `staff`: Access to dashboards and reports
- `monitoring`: Read-only access to metrics

### Production Security Checklist

1. Set `APP_DEBUG=false`
2. Configure `INTERNAL_SERVICE_TOKEN` with a strong secret
3. Enable middleware in `routes/api.php` (see comments)
4. Use HTTPS for all communications
5. Set appropriate CORS origins in `config/cors.php`

## Data Ingestion

Other microservices push data to monitoring via internal APIs:

### Enrollment Snapshot (daily)

```json
POST /api/internal/analytics/enrollment-snapshot
{
  "snapshot_date": "2026-01-14",
  "records": [
    {
      "program": "BS CS",
      "year_level": "1st",
      "total_students": 120,
      "active_students": 115,
      "dropped_students": 3,
      "graduated_students": 0
    }
  ]
}
```

### Performance Snapshot (per term)

```json
POST /api/internal/analytics/performance-snapshot
{
  "academic_term": "2025-2",
  "records": [
    {
      "student_id": 1001,
      "gpa": 3.45,
      "attendance_rate": 92.5,
      "failed_subjects_count": 0,
      "risk_level": "low"
    }
  ]
}
```

### System Metrics (real-time)

```json
POST /api/internal/analytics/system-metrics
{
  "recorded_at": "2026-01-14T10:30:00Z",
  "metric_type": "response_time",
  "value": 245.5,
  "metadata": {
    "service": "scholarship_service",
    "endpoint": "/api/applications"
  }
}
```

## Frontend Integration

The monitoring service integrates with the GSM admin panel through:

- **Education Monitoring module**: Displays charts, KPIs, and reports
- **AI Insights Panel**: Shows AI-generated summaries in the dashboard

### API Service

```typescript
import monitoringService from '@/services/monitoringService';

// Get dashboard metrics
const metrics = await monitoringService.getDashboardMetrics();

// Get AI insights
const insights = await monitoringService.getAIInsights({
  date_from: '2026-01-01',
  program: 'BS CS'
});
```

## Development

### Running Tests

```bash
php artisan test
```

### Seeding Test Data

```bash
# Seed all analytics tables with sample data
php artisan db:seed --class=AnalyticsSeeder
```

### Debugging AI

```bash
# Check AI configuration
php artisan tinker
>>> app(App\Services\AIInsightsService::class)->getStatus()

# Test insight generation
>>> app(App\Services\AIInsightsService::class)->generateInsights([])
```

## Monitoring the Monitor

The service records its own health metrics:

- `ai_insights_latency`: Time to generate AI insights
- `ai_insights_success`: Success/failure counts
- `response_time`: API response times
- `error_rate`: Error percentages

Query these from the system overview endpoint or directly from the database.

## Support

For issues or questions:

1. Check the [METRICS.md](METRICS.md) for KPI definitions
2. Review [AI_MONITORING_SETUP.md](AI_MONITORING_SETUP.md) for AI configuration
3. Check Laravel logs: `storage/logs/laravel.log`
4. Verify database connectivity and migrations

---

**Version**: 1.0.0  
**Last Updated**: January 2026
