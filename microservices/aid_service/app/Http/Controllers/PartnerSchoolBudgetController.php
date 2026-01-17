<?php

namespace App\Http\Controllers;

use App\Models\PartnerSchoolBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PartnerSchoolBudgetController extends Controller
{
    /**
     * Get all partner school budgets
     */
    public function index(Request $request)
    {
        $query = PartnerSchoolBudget::query();

        // Filter by academic year if provided
        if ($request->has('academic_year')) {
            $query->forYear($request->academic_year);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $budgets = $query->orderBy('allocation_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $budgets
        ]);
    }

    /**
     * Create new budget allocation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'source_budget_id' => 'nullable|exists:budget_allocations,id',
            'school_id' => 'required|integer',
            'school_name' => 'required|string|max:255',
            'academic_year' => 'required|string|max:50',
            'allocated_amount' => 'required|numeric|min:0',
            'allocation_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:allocation_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if budget already exists for this school and year
        $existing = PartnerSchoolBudget::where('school_id', $request->school_id)
            ->where('academic_year', $request->academic_year)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Budget already exists for this school and academic year'
            ], 409);
        }

        // If source_budget_id is provided, check main budget availability
        if ($request->source_budget_id) {
            $mainBudget = \App\Models\BudgetAllocation::find($request->source_budget_id);

            if (!$mainBudget) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source budget not found'
                ], 404);
            }

            if ($mainBudget->available_budget < $request->allocated_amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient funds in main budget',
                    'data' => [
                        'available' => $mainBudget->available_budget,
                        'requested' => $request->allocated_amount,
                        'shortfall' => $request->allocated_amount - $mainBudget->available_budget
                    ]
                ], 400);
            }
        }

        // Create budget with transaction
        $budget = \DB::transaction(function () use ($request) {
            $budget = PartnerSchoolBudget::create([
                'source_budget_id' => $request->source_budget_id,
                'school_id' => $request->school_id,
                'school_name' => $request->school_name,
                'academic_year' => $request->academic_year,
                'allocated_amount' => $request->allocated_amount,
                'allocation_date' => $request->allocation_date,
                'expiry_date' => $request->expiry_date,
                'notes' => $request->notes,
                'allocated_by_user_id' => $request->user()->id ?? null,
            ]);

            // If linked to main budget, increase its allocated_budget
            if ($request->source_budget_id) {
                $mainBudget = \App\Models\BudgetAllocation::find($request->source_budget_id);
                $mainBudget->allocated_budget += $request->allocated_amount;
                $mainBudget->save();
            }

            return $budget;
        });

        return response()->json([
            'success' => true,
            'message' => 'Budget allocated successfully',
            'data' => $budget
        ], 201);
    }

    /**
     * Get budget details
     */
    public function show($id)
    {
        $budget = PartnerSchoolBudget::find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $budget
        ]);
    }

    /**
     * Update budget allocation
     */
    public function update(Request $request, $id)
    {
        $budget = PartnerSchoolBudget::find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'allocated_amount' => 'sometimes|numeric|min:0',
            'expiry_date' => 'sometimes|nullable|date',
            'status' => 'sometimes|in:active,expired,depleted',
            'notes' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle allocation adjustment
        if ($request->has('allocated_amount')) {
            $budget->adjustAllocation(
                $request->allocated_amount,
                $request->adjustment_notes ?? 'Amount adjusted'
            );
        }

        // Update other fields
        $budget->fill($request->only(['expiry_date', 'status', 'notes']));
        $budget->save();

        return response()->json([
            'success' => true,
            'message' => 'Budget updated successfully',
            'data' => $budget
        ]);
    }

    /**
     * Check budget availability for a school
     */
    public function checkBudget(Request $request, $schoolId)
    {
        $budget = PartnerSchoolBudget::getCurrentBudget($schoolId);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'No active budget found for this school',
                'has_budget' => false
            ], 404);
        }

        $requiredAmount = $request->input('amount', 0);
        $hasSufficientFunds = $budget->hasFunds($requiredAmount);

        return response()->json([
            'success' => true,
            'has_budget' => true,
            'data' => [
                'budget_id' => $budget->id,
                'allocated_amount' => $budget->allocated_amount,
                'disbursed_amount' => $budget->disbursed_amount,
                'available_amount' => $budget->available_amount,
                'required_amount' => $requiredAmount,
                'has_sufficient_funds' => $hasSufficientFunds,
                'shortfall' => $hasSufficientFunds ? 0 : ($requiredAmount - $budget->available_amount),
                'status' => $budget->status,
                'expiry_date' => $budget->expiry_date,
            ]
        ]);
    }

    /**
     * Get budget for a specific school
     */
    public function getSchoolBudget($schoolId)
    {
        $budget = PartnerSchoolBudget::getCurrentBudget($schoolId);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'No active budget found for this school'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $budget
        ]);
    }

    /**
     * Get budget withdrawals for a school
     */
    public function getWithdrawals(Request $request)
    {
        $schoolId = $request->query('school_id');

        if (!$schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'School ID is required'
            ], 400);
        }

        $withdrawals = \App\Models\PartnerSchoolBudgetWithdrawal::where('school_id', $schoolId)
            ->orderBy('withdrawal_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $withdrawals
        ]);
    }

    /**
     * Record a budget withdrawal (direct deduction, no approval needed)
     */
    public function recordWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'school_id' => 'required|integer',
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'withdrawal_date' => 'required|date',
            'notes' => 'nullable|string',
            'proof_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $budget = PartnerSchoolBudget::getCurrentBudget($request->school_id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'No active budget found for this school',
            ], 404);
        }

        if (!$budget->hasFunds((float) $request->amount)) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient budget funds',
                'available' => $budget->available_amount,
                'requested' => $request->amount
            ], 400);
        }

        // Store proof document
        $documentPath = $request->file('proof_document')->store('budget_withdrawals', 'public');

        // Create withdrawal record and update budget in a transaction
        $withdrawal = \DB::transaction(function () use ($request, $budget, $documentPath) {
            // Create withdrawal record
            $withdrawal = \App\Models\PartnerSchoolBudgetWithdrawal::create([
                'partner_school_budget_id' => $budget->id,
                'school_id' => $request->school_id,
                'amount' => $request->amount,
                'purpose' => $request->purpose,
                'withdrawal_date' => $request->withdrawal_date,
                'notes' => $request->notes,
                'proof_document_path' => $documentPath,
                'recorded_by' => $request->user()->id ?? null,
            ]);

            // Immediately deduct from budget
            $budget->disbursed_amount = $budget->disbursed_amount + $request->amount;
            $budget->save();

            // Check if budget is now depleted
            if ($budget->available_amount <= 0) {
                $budget->status = 'depleted';
                $budget->save();
            }

            return $withdrawal;
        });

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal recorded successfully',
            'data' => [
                'withdrawal' => $withdrawal,
                'updated_budget' => [
                    'allocated_amount' => $budget->allocated_amount,
                    'disbursed_amount' => $budget->disbursed_amount,
                    'available_amount' => $budget->available_amount,
                    'status' => $budget->status,
                ]
            ]
        ], 201);
    }

    /**
     * Get a specific withdrawal record
     */
    public function getWithdrawal($id)
    {
        $withdrawal = \App\Models\PartnerSchoolBudgetWithdrawal::find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal record not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $withdrawal
        ]);
    }

    /**
     * Update a withdrawal record (for corrections)
     */
    public function updateWithdrawal(Request $request, $id)
    {
        $withdrawal = \App\Models\PartnerSchoolBudgetWithdrawal::find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal record not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'purpose' => 'sometimes|string|max:255',
            'notes' => 'sometimes|nullable|string',
            'proof_document' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update allowed fields
        if ($request->has('purpose')) {
            $withdrawal->purpose = $request->purpose;
        }

        if ($request->has('notes')) {
            $withdrawal->notes = $request->notes;
        }

        // Update proof document if provided
        if ($request->hasFile('proof_document')) {
            // Delete old document
            if ($withdrawal->proof_document_path) {
                \Storage::disk('public')->delete($withdrawal->proof_document_path);
            }
            $withdrawal->proof_document_path = $request->file('proof_document')->store('budget_withdrawals', 'public');
        }

        $withdrawal->save();

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal record updated successfully',
            'data' => $withdrawal
        ]);
    }

    /**
     * Download or view the proof document
     */
    public function downloadProof($id)
    {
        $withdrawal = \App\Models\PartnerSchoolBudgetWithdrawal::find($id);

        if (!$withdrawal || !$withdrawal->proof_document_path) {
            abort(404);
        }

        $path = $withdrawal->proof_document_path;

        // Verify file exists in public disk
        if (!\Storage::disk('public')->exists($path)) {
            // Try checking strictly without modification first, if created by store()
            if (!\Storage::disk('public')->exists($path)) {
                abort(404, 'File not found on server');
            }
        }

        return \Storage::disk('public')->response($path);
    }
}
