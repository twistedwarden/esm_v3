<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\BudgetAllocation;

class BudgetAllocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get current school year
        $currentYear = date('Y');
        $nextYear = $currentYear + 1;
        $currentSchoolYear = "{$currentYear}-{$nextYear}";
        
        // Previous school year
        $prevSchoolYear = ($currentYear - 1) . "-{$currentYear}";
        
        // Next school year (for planning)
        $nextSchoolYear = ($currentYear + 1) . "-" . ($currentYear + 2);

        // Seed Scholarship Benefits Budget (Current School Year)
        $scholarshipBudget = BudgetAllocation::firstOrNew([
            'budget_type' => 'scholarship_benefits',
            'school_year' => $currentSchoolYear,
        ]);

        if (!$scholarshipBudget->exists || $scholarshipBudget->total_budget == 0) {
            $scholarshipBudget->fill([
                'total_budget' => 1000000.00, // ₱1,000,000
                'allocated_budget' => 0,
                'disbursed_budget' => 0,
                'description' => 'Budget for merit, special, and renewal scholarship programs',
                'is_active' => true,
                'created_by' => 1, // System admin or first user
                'updated_by' => 1,
            ]);
            $scholarshipBudget->save();
        }

        // Seed Financial Support Budget (Current School Year) - for future use
        $financialSupportBudget = BudgetAllocation::firstOrNew([
            'budget_type' => 'financial_support',
            'school_year' => $currentSchoolYear,
        ]);

        if (!$financialSupportBudget->exists || $financialSupportBudget->total_budget == 0) {
            $financialSupportBudget->fill([
                'total_budget' => 500000.00, // ₱500,000
                'allocated_budget' => 0,
                'disbursed_budget' => 0,
                'description' => 'Budget for need-based financial support programs',
                'is_active' => true,
                'created_by' => 1,
                'updated_by' => 1,
            ]);
            $financialSupportBudget->save();
        }

        // Seed Previous School Year (if needed for historical data)
        $prevScholarshipBudget = BudgetAllocation::firstOrNew([
            'budget_type' => 'scholarship_benefits',
            'school_year' => $prevSchoolYear,
        ]);

        if (!$prevScholarshipBudget->exists) {
            $prevScholarshipBudget->fill([
                'total_budget' => 950000.00,
                'allocated_budget' => 0,
                'disbursed_budget' => 0,
                'description' => 'Previous school year budget (archived)',
                'is_active' => false, // Mark as inactive for previous year
                'created_by' => 1,
                'updated_by' => 1,
            ]);
            $prevScholarshipBudget->save();
        }

        $this->command->info('Budget allocations seeded successfully!');
        $this->command->info("Current School Year: {$currentSchoolYear}");
        $this->command->info("Scholarship Benefits Budget: ₱1,000,000.00");
        $this->command->info("Financial Support Budget: ₱500,000.00");
    }
}
