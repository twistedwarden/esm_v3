# Monitoring Service - Business KPIs & Metrics Reference

This document defines the core business KPIs tracked by the monitoring service, their data sources from actual database tables across microservices, aggregation logic, and intended dashboard usage.

## Overview

The monitoring service centralizes education analytics across the GSM platform by aggregating data from:
- **Scholarship Service**: Students, applications, SSC reviews, interviews, documents
- **Aid Service**: Disbursements, budget allocations, payment transactions
- **Auth Service**: Users, sessions, login activity

---

## Database Tables Reference

### Scholarship Service Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `students` | Student profiles | `id`, `citizen_id`, `is_currently_enrolled`, `is_graduating`, `is_pwd`, `sex`, `civil_status`, `created_at` |
| `scholarship_applications` | Applications | `id`, `status`, `type`, `category_id`, `subcategory_id`, `school_id`, `requested_amount`, `approved_amount`, `submitted_at`, `approved_at` |
| `scholarship_categories` | Scholarship types | `id`, `name`, `type` (merit, need_based, special, renewal) |
| `ssc_reviews` | SSC review workflow | `id`, `application_id`, `review_stage`, `status`, `reviewer_id`, `reviewed_at` |
| `interview_schedules` | Interviews | `id`, `application_id`, `status`, `interview_result`, `interview_date`, `completed_at` |
| `financial_information` | Student finances | `student_id`, `monthly_income`, `is_4ps_beneficiary`, `home_ownership_status` |
| `schools` | Partner schools | `id`, `name`, `is_partner`, `created_at` |
| `documents` | Uploaded documents | `id`, `application_id`, `status`, `created_at` |
| `audit_logs` | Activity tracking | `id`, `action`, `user_id`, `created_at` |

### Aid Service Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `budget_allocations` | Budget tracking | `id`, `budget_type`, `total_budget`, `allocated_budget`, `disbursed_budget`, `school_year` |
| `aid_disbursements` | Payments made | `id`, `application_id`, `amount`, `method`, `reference_number`, `disbursed_at` |
| `payment_transactions` | Payment records | `id`, `disbursement_id`, `status`, `amount`, `created_at` |

### Auth Service Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts | `id`, `role`, `status`, `email_verified_at`, `created_at`, `last_login_at` |
| `sessions` | Active sessions | `id`, `user_id`, `last_activity` |
| `otp_verifications` | OTP tracking | `id`, `verified_at`, `created_at` |

---

## Core Business KPIs

### 1. Application Pipeline KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Total Applications** | `scholarship_applications` | `COUNT(*)` | Overview |
| **Applications by Status** | `scholarship_applications` | `COUNT(*) GROUP BY status` | Pipeline |
| **New Applications (Today)** | `scholarship_applications` | `COUNT(*) WHERE DATE(submitted_at) = TODAY` | Overview |
| **New Applications (This Week)** | `scholarship_applications` | `COUNT(*) WHERE submitted_at >= WEEK_START` | Trends |
| **New vs Renewal Rate** | `scholarship_applications` | `COUNT(*) GROUP BY type` | Analytics |
| **Approval Rate** | `scholarship_applications` | `(approved / (approved + rejected)) * 100` | KPI Card |
| **Average Processing Time** | `scholarship_applications` | `AVG(approved_at - submitted_at)` | Performance |
| **Pending Review Count** | `scholarship_applications` | `COUNT(*) WHERE status IN ('submitted', 'reviewed')` | Alerts |

**Application Status Flow:**
```
draft → submitted → reviewed → approved → processing → released
                  ↘ rejected
                  ↘ on_hold
                  ↘ cancelled
```

### 2. SSC Review Pipeline KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Pending Reviews by Stage** | `ssc_reviews` | `COUNT(*) WHERE status = 'pending' GROUP BY review_stage` | SSC Dashboard |
| **Completed Reviews (Today)** | `ssc_reviews` | `COUNT(*) WHERE DATE(reviewed_at) = TODAY` | Overview |
| **Average Review Time per Stage** | `ssc_reviews` | `AVG(reviewed_at - created_at) GROUP BY review_stage` | Performance |
| **Reviews Needing Revision** | `ssc_reviews` | `COUNT(*) WHERE status = 'needs_revision'` | Alerts |
| **Reviewer Workload** | `ssc_reviews` | `COUNT(*) GROUP BY reviewer_id` | Staff Analytics |

**Review Stages:**
1. `document_verification` - Verify submitted documents
2. `financial_review` - Assess financial need
3. `academic_review` - Evaluate academic standing
4. `final_approval` - Final SSC decision

### 3. Interview KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Scheduled Interviews (This Week)** | `interview_schedules` | `COUNT(*) WHERE interview_date BETWEEN WEEK_START AND WEEK_END` | Overview |
| **Completed Interviews** | `interview_schedules` | `COUNT(*) WHERE status = 'completed'` | Progress |
| **No-Show Rate** | `interview_schedules` | `(no_show / scheduled) * 100` | Alerts |
| **Pass Rate** | `interview_schedules` | `(passed / completed) * 100` | KPI Card |
| **Interviews by Type** | `interview_schedules` | `COUNT(*) GROUP BY interview_type` | Analytics |
| **Average Interviews per Day** | `interview_schedules` | `COUNT(*) / DISTINCT_DAYS` | Capacity |

### 4. Financial & Budget KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Total Budget** | `budget_allocations` | `SUM(total_budget)` | Overview |
| **Allocated Budget** | `budget_allocations` | `SUM(allocated_budget)` | Budget |
| **Disbursed Budget** | `budget_allocations` | `SUM(disbursed_budget)` | Budget |
| **Remaining Budget** | `budget_allocations` | `total_budget - disbursed_budget` | KPI Card |
| **Budget Utilization Rate** | `budget_allocations` | `(disbursed / total) * 100` | KPI Card |
| **Total Disbursed Amount** | `aid_disbursements` | `SUM(amount)` | Financial |
| **Disbursements This Month** | `aid_disbursements` | `COUNT(*) WHERE MONTH(disbursed_at) = CURRENT_MONTH` | Trends |
| **Average Disbursement Amount** | `aid_disbursements` | `AVG(amount)` | Analytics |
| **Disbursement by Method** | `aid_disbursements` | `SUM(amount) GROUP BY method` | Breakdown |

### 5. Student Demographics KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Total Registered Students** | `students` | `COUNT(*)` | Overview |
| **Currently Enrolled** | `students` | `COUNT(*) WHERE is_currently_enrolled = true` | KPI Card |
| **Graduating Students** | `students` | `COUNT(*) WHERE is_graduating = true` | Alerts |
| **PWD Students** | `students` | `COUNT(*) WHERE is_pwd = true` | Demographics |
| **Gender Distribution** | `students` | `COUNT(*) GROUP BY sex` | Demographics |
| **New Registrations (This Month)** | `students` | `COUNT(*) WHERE MONTH(created_at) = CURRENT_MONTH` | Trends |
| **4Ps Beneficiaries** | `financial_information` | `COUNT(*) WHERE is_4ps_beneficiary = true` | Demographics |
| **Income Distribution** | `financial_information` | `COUNT(*) GROUP BY family_monthly_income_range` | Analytics |

### 6. Partner School KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Total Partner Schools** | `schools` | `COUNT(*) WHERE is_partner = true` | Overview |
| **Applications per School** | `scholarship_applications` | `COUNT(*) GROUP BY school_id` | School Analytics |
| **Disbursements per School** | `aid_disbursements` | `SUM(amount) GROUP BY school_id` | Financial |
| **Top Schools by Applications** | `scholarship_applications` | `TOP 10 schools by application count` | Leaderboard |

### 7. System & User Activity KPIs

| KPI | Source Table | Calculation | Dashboard Section |
|-----|--------------|-------------|-------------------|
| **Total Users** | `users` | `COUNT(*)` | System |
| **Active Users (Today)** | `sessions` | `COUNT(DISTINCT user_id) WHERE last_activity >= TODAY` | Overview |
| **Users by Role** | `users` | `COUNT(*) GROUP BY role` | User Analytics |
| **New Registrations (This Week)** | `users` | `COUNT(*) WHERE created_at >= WEEK_START` | Trends |
| **Login Success Rate** | `otp_verifications` | `(verified / total) * 100` | Security |
| **Audit Actions (Today)** | `audit_logs` | `COUNT(*) WHERE DATE(created_at) = TODAY` | Activity |

---

## Aggregated Analytics Tables

The monitoring service maintains its own analytics tables for historical trends:

### `analytics_application_daily` (NEW)

```sql
CREATE TABLE analytics_application_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_date DATE NOT NULL,
    
    -- Application counts by status
    total_applications INT DEFAULT 0,
    draft_count INT DEFAULT 0,
    submitted_count INT DEFAULT 0,
    reviewed_count INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    rejected_count INT DEFAULT 0,
    processing_count INT DEFAULT 0,
    released_count INT DEFAULT 0,
    
    -- Application types
    new_applications INT DEFAULT 0,
    renewal_applications INT DEFAULT 0,
    
    -- Category breakdown
    merit_count INT DEFAULT 0,
    need_based_count INT DEFAULT 0,
    special_count INT DEFAULT 0,
    
    -- Processing metrics
    avg_processing_days DECIMAL(5,2) DEFAULT 0,
    applications_submitted_today INT DEFAULT 0,
    applications_approved_today INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_snapshot_date (snapshot_date)
);
```

### `analytics_financial_daily` (NEW)

```sql
CREATE TABLE analytics_financial_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_date DATE NOT NULL,
    school_year VARCHAR(20),
    
    -- Budget tracking
    total_budget DECIMAL(15,2) DEFAULT 0,
    allocated_budget DECIMAL(15,2) DEFAULT 0,
    disbursed_budget DECIMAL(15,2) DEFAULT 0,
    remaining_budget DECIMAL(15,2) DEFAULT 0,
    
    -- Disbursement metrics
    disbursements_count INT DEFAULT 0,
    disbursements_amount DECIMAL(15,2) DEFAULT 0,
    avg_disbursement_amount DECIMAL(12,2) DEFAULT 0,
    
    -- By payment method
    gcash_amount DECIMAL(15,2) DEFAULT 0,
    paymaya_amount DECIMAL(15,2) DEFAULT 0,
    bank_amount DECIMAL(15,2) DEFAULT 0,
    cash_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_snapshot_date (snapshot_date)
);
```

### `analytics_ssc_daily` (NEW)

```sql
CREATE TABLE analytics_ssc_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_date DATE NOT NULL,
    
    -- Review counts by stage
    doc_verification_pending INT DEFAULT 0,
    doc_verification_completed INT DEFAULT 0,
    financial_review_pending INT DEFAULT 0,
    financial_review_completed INT DEFAULT 0,
    academic_review_pending INT DEFAULT 0,
    academic_review_completed INT DEFAULT 0,
    final_approval_pending INT DEFAULT 0,
    final_approval_completed INT DEFAULT 0,
    
    -- Review outcomes
    total_approved INT DEFAULT 0,
    total_rejected INT DEFAULT 0,
    total_needs_revision INT DEFAULT 0,
    
    -- Performance
    avg_review_time_hours DECIMAL(8,2) DEFAULT 0,
    reviews_completed_today INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_snapshot_date (snapshot_date)
);
```

### `analytics_interview_daily` (NEW)

```sql
CREATE TABLE analytics_interview_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_date DATE NOT NULL,
    
    -- Schedule counts
    scheduled_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    cancelled_count INT DEFAULT 0,
    no_show_count INT DEFAULT 0,
    rescheduled_count INT DEFAULT 0,
    
    -- Results
    passed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    needs_followup_count INT DEFAULT 0,
    
    -- By type
    in_person_count INT DEFAULT 0,
    online_count INT DEFAULT 0,
    phone_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_snapshot_date (snapshot_date)
);
```

---

## Dashboard Sections

### 1. Executive Overview Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| Total Applications Card | Total, Today's new, WoW change | Real-time |
| Approval Rate Card | Approval %, Trend | Daily |
| Budget Status Card | Remaining budget, Utilization % | Real-time |
| At-Risk Alerts | Pending reviews > 7 days, Low budget | Real-time |

### 2. Application Pipeline Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| Pipeline Funnel | Applications by status (visual) | Real-time |
| Processing Time Chart | Avg days by stage (line chart) | Daily |
| Application Trends | Submitted vs Approved over 30 days | Daily |
| Category Breakdown | Pie chart by scholarship type | Daily |

### 3. Financial Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| Budget Gauge | Total vs Disbursed (gauge chart) | Real-time |
| Monthly Disbursements | Bar chart by month | Daily |
| Payment Methods | Pie chart by method | Daily |
| School Distribution | Top 10 schools by disbursement | Weekly |

### 4. SSC Review Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| Review Queue | Pending by stage (stacked bar) | Real-time |
| Reviewer Performance | Reviews/day by reviewer | Daily |
| Bottleneck Alerts | Stages with high pending count | Real-time |
| Completion Trend | Reviews completed over 14 days | Daily |

### 5. Interview Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| This Week's Schedule | Calendar view of interviews | Real-time |
| Pass/Fail Rate | Donut chart | Weekly |
| No-Show Trend | Line chart over 30 days | Daily |
| Interviewer Load | Bar chart by interviewer | Daily |

### 6. Demographics Dashboard

| Widget | KPIs Displayed | Refresh |
|--------|----------------|---------|
| Gender Distribution | Pie chart | Daily |
| PWD Students | Count and % | Daily |
| 4Ps Beneficiaries | Count and % | Daily |
| Income Brackets | Bar chart by range | Weekly |
| School Distribution | Map or table | Weekly |

---

## Data Ingestion Contracts

### Application Snapshot Payload

```json
POST /api/internal/analytics/application-snapshot
{
    "snapshot_date": "2026-01-14",
    "applications": {
        "total": 1250,
        "by_status": {
            "draft": 45,
            "submitted": 120,
            "reviewed": 85,
            "approved": 650,
            "rejected": 180,
            "processing": 95,
            "released": 75
        },
        "by_type": {
            "new": 800,
            "renewal": 450
        },
        "by_category": {
            "merit": 400,
            "need_based": 550,
            "special": 200,
            "renewal": 100
        },
        "submitted_today": 25,
        "approved_today": 18,
        "avg_processing_days": 12.5
    }
}
```

### Financial Snapshot Payload

```json
POST /api/internal/analytics/financial-snapshot
{
    "snapshot_date": "2026-01-14",
    "school_year": "2025-2026",
    "budget": {
        "total": 10000000.00,
        "allocated": 7500000.00,
        "disbursed": 5250000.00
    },
    "disbursements": {
        "count": 42,
        "total_amount": 525000.00,
        "by_method": {
            "gcash": 315000.00,
            "paymaya": 105000.00,
            "bank": 78750.00,
            "cash": 26250.00
        }
    }
}
```

### SSC Review Snapshot Payload

```json
POST /api/internal/analytics/ssc-snapshot
{
    "snapshot_date": "2026-01-14",
    "reviews": {
        "document_verification": { "pending": 25, "completed": 180 },
        "financial_review": { "pending": 18, "completed": 165 },
        "academic_review": { "pending": 12, "completed": 155 },
        "final_approval": { "pending": 8, "completed": 142 }
    },
    "outcomes": {
        "approved": 120,
        "rejected": 15,
        "needs_revision": 7
    },
    "completed_today": 28,
    "avg_review_hours": 48.5
}
```

### Interview Snapshot Payload

```json
POST /api/internal/analytics/interview-snapshot
{
    "snapshot_date": "2026-01-14",
    "interviews": {
        "scheduled": 45,
        "completed": 38,
        "cancelled": 3,
        "no_show": 4,
        "by_type": {
            "in_person": 25,
            "online": 18,
            "phone": 2
        }
    },
    "results": {
        "passed": 32,
        "failed": 4,
        "needs_followup": 2
    }
}
```

---

## AI Insights Context

When generating AI insights, the following metrics are provided:

```json
{
    "period": { "from": "2026-01-01", "to": "2026-01-14" },
    "applications": {
        "total": 1250,
        "pending_review": 205,
        "approval_rate": 78.3,
        "avg_processing_days": 12.5,
        "weekly_change": 8.2
    },
    "financial": {
        "budget_remaining": 4750000.00,
        "utilization_rate": 52.5,
        "avg_disbursement": 12500.00,
        "disbursements_this_month": 420
    },
    "ssc": {
        "total_pending_reviews": 63,
        "bottleneck_stage": "document_verification",
        "avg_review_hours": 48.5
    },
    "interviews": {
        "pass_rate": 84.2,
        "no_show_rate": 8.9,
        "scheduled_this_week": 45
    },
    "demographics": {
        "total_students": 3200,
        "pwd_percentage": 4.5,
        "4ps_percentage": 22.8
    }
}
```

---

## Alert Thresholds

| Alert | Condition | Severity |
|-------|-----------|----------|
| Budget Critical | Remaining < 10% | High |
| Budget Low | Remaining < 25% | Medium |
| Review Backlog | Pending > 50 in any stage | High |
| Slow Processing | Avg processing > 30 days | Medium |
| High No-Show Rate | No-show > 15% | Medium |
| Low Approval Rate | Approval < 50% | Medium |
| Document Quarantine | Quarantined files > 10 | High |

---

## Notes

- All timestamps are stored in UTC
- Financial amounts are in Philippine Peso (₱)
- Snapshots are taken daily at 00:00 UTC
- Historical data is retained for 2 years
- Real-time metrics are cached for 5 minutes
