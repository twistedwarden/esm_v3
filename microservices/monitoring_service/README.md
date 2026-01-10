# Monitoring Service

Collects and analyzes data from other services for reporting and compliance.

## Responsibilities

- Aggregates academic, demographic, and financial trends
- Generates education monitoring reports
- Exposes dashboards to authorized users

## Tech Stack

- Laravel 12
- MySQL
- HTTP API integration with other microservices

## Environment Variables

Create a `.env` file with the following:

```env
APP_NAME="Monitoring Service"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8003

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=monitoring_service
DB_USERNAME=root
DB_PASSWORD=

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
SCHOLARSHIP_SERVICE_URL=http://localhost:8001
AID_SERVICE_URL=http://localhost:8002
```

## Setup

1. Install dependencies:
```bash
composer install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Generate application key:
```bash
php artisan key:generate
```

4. Run migrations:
```bash
php artisan migrate
```

5. Start the server:
```bash
php artisan serve --host=127.0.0.1 --port=8003
```

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Dashboards
- `GET /api/dashboard/executive` - Executive dashboard data
- `GET /api/dashboard/operational` - Operational dashboard data
- `GET /api/dashboard/financial` - Financial dashboard data
- `GET /api/dashboard/academic` - Academic dashboard data
- `GET /api/dashboard/system-health` - System health status

### Metrics
- `GET /api/metrics` - Get all metrics
- `POST /api/metrics/collect` - Collect and store metrics
- `GET /api/metrics/{metric_name}` - Get specific metric

### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/{id}/download` - Download report

## Architecture

The monitoring service collects data from:
- **Auth Service** (Port 8000) - User statistics
- **Scholarship Service** (Port 8001) - Application and student data
- **Aid Service** (Port 8002) - Financial and disbursement data

Data is cached for performance and stored in the database for historical tracking.
