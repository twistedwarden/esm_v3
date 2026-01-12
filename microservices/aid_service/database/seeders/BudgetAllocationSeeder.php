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
        // Check if budget allocations already exist
        $existing = BudgetAllocation::where('budget_type', 'scholarship_benefits')->first();
        
        if (!$existing) {
            // Create scholarship benefits budget allocation with temporary data
            BudgetAllocation::create([
                'budget_type' => 'scholarship_benefits',
                'total_budget' => 1000000.00, // Temporary: ₱1,000,000
                'allocated_budget' => 0,
                'disbursed_budget' => 0,
                'description' => 'Temporary budget for merit, special, and renewal scholarship programs',
            ]);
        } else {
            // Update existing record with temporary budget if total_budget is 0
            if ($existing->total_budget == 0) {
                $existing->update([
                    'total_budget' => 1000000.00, // Temporary: ₱1,000,000
                    'description' => 'Temporary budget for merit, special, and renewal scholarship programs',
                ]);
            }
        }
    }
}
