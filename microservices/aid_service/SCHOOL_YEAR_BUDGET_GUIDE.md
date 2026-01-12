# School Year Budget System Guide

## Overview

The School Aid Distribution system now supports **school year-based budgets**. This allows you to allocate and track budgets separately for each academic year (e.g., 2024-2025, 2025-2026).

## Features

### 1. **School Year-Based Budget Allocation**
- Each budget allocation is tied to a specific school year
- Format: `YYYY-YYYY` (e.g., `2024-2025`)
- Multiple budgets can exist for different school years
- Only one active budget per budget type per school year

### 2. **School Year Selector in UI**
- Dropdown selector in the Overview dashboard
- Shows current school year and 2 previous years
- Automatically filters budget data by selected school year
- Updates all metrics when school year changes

### 3. **Automatic School Year Detection**
- When disbursing grants, system automatically detects school year from:
  - Student's current academic record
  - Falls back to current school year if not found
- Budget decrements are applied to the correct school year's budget

## Database Schema

### Budget Allocations Table

```sql
budget_allocations
├── id
├── budget_type (enum: financial_support, scholarship_benefits)
├── school_year (string, format: YYYY-YYYY)
├── total_budget (decimal)
├── allocated_budget (decimal)
├── disbursed_budget (decimal)
├── description (text)
├── is_active (boolean)
└── timestamps
```

**Unique Constraint**: `(budget_type, school_year)` - ensures one budget per type per year

## Setup Instructions

### 1. Run Migrations

```bash
cd microservices/aid_service
php artisan migrate
```

This will:
- Add `school_year` and `is_active` columns
- Update existing records to current school year
- Add composite unique constraint

### 2. Create Budget for Current School Year

```sql
INSERT INTO budget_allocations 
(budget_type, school_year, total_budget, allocated_budget, disbursed_budget, description, is_active, created_at, updated_at)
VALUES 
('scholarship_benefits', '2024-2025', 1000000.00, 0, 0, 'Scholarship budget for SY 2024-2025', true, NOW(), NOW());
```

### 3. Create Budgets for Other School Years

```sql
-- Previous year
INSERT INTO budget_allocations 
(budget_type, school_year, total_budget, allocated_budget, disbursed_budget, description, is_active, created_at, updated_at)
VALUES 
('scholarship_benefits', '2023-2024', 800000.00, 0, 0, 'Scholarship budget for SY 2023-2024', true, NOW(), NOW());

-- Next year
INSERT INTO budget_allocations 
(budget_type, school_year, total_budget, allocated_budget, disbursed_budget, description, is_active, created_at, updated_at)
VALUES 
('scholarship_benefits', '2025-2026', 1200000.00, 0, 0, 'Scholarship budget for SY 2025-2026', true, NOW(), NOW());
```

## API Usage

### Get Metrics for Specific School Year

```http
GET /api/school-aid/metrics?school_year=2024-2025
```

**Response includes:**
- Budget data filtered by school year
- All metrics for that school year
- `school_year` field in response

### Default Behavior
- If no `school_year` parameter is provided, uses current school year
- Current school year format: `YYYY-YYYY` (e.g., `2024-2025`)

## Frontend Usage

### School Year Selector

The Overview dashboard includes a school year dropdown that:
- Shows current year and 2 previous years by default
- Automatically refreshes data when changed
- Filters all budget metrics by selected school year

### Example Usage

```javascript
// Get metrics for specific school year
const metrics = await schoolAidService.getMetrics({ 
  school_year: '2024-2025' 
});
```

## Budget Workflow

1. **Budget Creation**: Create budget allocation for a school year
2. **Grant Processing**: When grants are processed, system detects school year
3. **Budget Decrement**: When grants are disbursed, appropriate school year's budget is decremented
4. **Viewing**: Select school year in UI to view that year's budget status

## Benefits

✅ **Year-over-Year Tracking**: Track budgets separately for each academic year  
✅ **Historical Data**: View budgets and disbursements for previous years  
✅ **Future Planning**: Set budgets for upcoming school years  
✅ **Accurate Reporting**: Generate reports filtered by school year  
✅ **Flexible Management**: Manage multiple budgets simultaneously  

## Migration Notes

- Existing budgets will be assigned to current school year automatically
- No data loss during migration
- System works with or without school year data (falls back gracefully)

## Future Enhancements

- Budget allocation UI for creating/editing school year budgets
- Budget transfer between school years
- Budget forecasting based on previous years
- Term-based budgets (if needed in future)
