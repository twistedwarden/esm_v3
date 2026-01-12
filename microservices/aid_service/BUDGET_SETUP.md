# Budget Allocation Setup Guide

## Overview

The School Aid Distribution system uses a budget allocation table to track scholarship budgets. Currently, the system uses **temporary budget data** for testing purposes until integration with the main budget system is complete.

## Database Table

The `budget_allocations` table stores budget information:
- `budget_type`: Type of budget (currently only `scholarship_benefits` is used)
- `total_budget`: Total allocated budget amount
- `allocated_budget`: Budget allocated to approved applications
- `disbursed_budget`: Budget already disbursed to students
- `description`: Description of the budget

## Temporary Budget Data

### Initial Setup

The migration automatically creates a temporary budget of **₱1,000,000** for scholarship benefits when you run:

```bash
php artisan migrate
```

### Seeding Budget Data

To seed or update the temporary budget, run:

```bash
php artisan db:seed --class=BudgetAllocationSeeder
```

This will:
- Create a budget allocation if it doesn't exist
- Set total budget to ₱1,000,000 if it's currently 0
- Update the description

### Manual Budget Update

You can also manually update the budget in the database:

```sql
UPDATE budget_allocations 
SET total_budget = 1000000.00 
WHERE budget_type = 'scholarship_benefits';
```

## How It Works

1. **Initial Budget**: Set in `budget_allocations` table (currently ₱1,000,000 temporary)
2. **When Grant is Processed**: 
   - Application status changes to `grants_processing`
   - Budget remains the same (no deduction yet)
3. **When Grant is Disbursed**:
   - Application status changes to `grants_disbursed`
   - `disbursed_budget` is incremented by the grant amount
   - Overview dashboard automatically refreshes to show updated budget

## Budget Calculation

The system calculates budgets as follows:
- **Total Budget**: From `budget_allocations.total_budget` (or calculated from applications if not set)
- **Disbursed**: From `budget_allocations.disbursed_budget` (or calculated from disbursements)
- **Remaining**: Total Budget - Disbursed

## Future Integration

When the main budget system is integrated:
1. Budget data will come from the external system
2. The `budget_allocations` table will be updated via API/webhook
3. No manual updates will be needed

## Testing

To test the budget system:
1. Ensure budget allocation exists with a total budget > 0
2. Process a grant (status: `grants_processing`)
3. Disburse the grant (status: `grants_disbursed`)
4. Check the Overview dashboard - budget should reflect the disbursed amount
