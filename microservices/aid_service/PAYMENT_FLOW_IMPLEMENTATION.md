# Payment Flow Implementation - Option 1 (Direct Redirect)

## ✅ Implementation Complete

### Flow Overview

1. **User clicks "Process Grant"** → Frontend calls API
2. **Backend creates PayMongo checkout** → Returns payment URL
3. **Frontend redirects to PayMongo** → User completes payment
4. **PayMongo sends webhook** → Backend processes payment
5. **Automatic updates:**
   - ✅ Budget auto-deducted
   - ✅ Application marked as `grants_disbursed`
   - ✅ `aid_disbursements` record created

---

## Backend Implementation

### 1. Payment Link Creation (`SchoolAidController::processGrant`)

**Location:** `app/Http/Controllers/SchoolAidController.php`

**What it does:**
- Creates PayMongo checkout session
- Creates `payment_transactions` record
- Updates application status to `grants_processing`
- Returns `payment_url` for redirect

**Response:**
```json
{
  "success": true,
  "payment_url": "https://paymongo.com/checkout/...",
  "redirect": true,
  "payment_transaction_id": 123
}
```

### 2. Webhook Handler (`PaymentWebhookController::handlePaymentSuccess`)

**Location:** `app/Http/Controllers/PaymentWebhookController.php`

**What happens when payment is successful:**

1. **Finds payment transaction** by PayMongo transaction ID
2. **Marks transaction as completed**
3. **Creates `aid_disbursements` record:**
   ```php
   AidDisbursement::create([
       'application_id' => $application->id,
       'payment_transaction_id' => $transaction->id,
       'amount' => $transaction->transaction_amount,
       'disbursement_status' => 'completed',
       // ... other fields
   ]);
   ```
4. **Updates application status:**
   ```php
   $application->status = 'grants_disbursed';
   $application->save();
   ```
5. **Auto-deducts budget:**
   ```php
   $this->updateBudgetOnDisbursement($application, $amount, $schoolYear);
   // This calls: $budgetAllocation->incrementDisbursed($amount);
   ```

---

## Frontend Implementation

### 1. Process Grant Handler

**Location:** `GSM/src/admin/components/modules/schoolAid/SchoolAidDistribution.tsx`

**What it does:**
- Calls `schoolAidService.processGrant(applicationId)`
- Receives `payment_url` from backend
- Redirects user to PayMongo checkout:
  ```javascript
  if (result.success && result.payment_url && result.redirect) {
    window.location.href = result.payment_url;
  }
  ```

### 2. Payment Success Page

**Location:** `GSM/src/admin/pages/PaymentSuccess.tsx`
**Route:** `/admin/school-aid/payment/success`

**Features:**
- Shows success message
- Displays payment reference
- Button to return to applications
- Auto-refreshes data after webhook processes

### 3. Payment Cancel Page

**Location:** `GSM/src/admin/pages/PaymentCancel.tsx`
**Route:** `/admin/school-aid/payment/cancel`

**Features:**
- Shows cancellation message
- Option to retry payment
- Button to return to applications

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Process Grant"                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: POST /api/school-aid/applications/{id}/        │
│    process-grant                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend:                                                 │
│    - Creates PayMongo checkout session                     │
│    - Creates payment_transactions record                    │
│    - Updates application → 'grants_processing'              │
│    - Returns payment_url                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend: Redirects to payment_url                      │
│    window.location.href = payment_url                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User completes payment on PayMongo                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PayMongo redirects to:                                  │
│    /admin/school-aid/payment/success                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. PayMongo sends webhook:                                  │
│    POST /api/webhooks/paymongo                             │
│    Event: payment.paid                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend Webhook Handler:                                │
│    ✅ Creates aid_disbursements record                     │
│    ✅ Updates application → 'grants_disbursed'             │
│    ✅ Auto-deducts budget                                   │
│    ✅ Logs audit trail                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Automatic Updates (After Successful Payment)

### ✅ Budget Auto-Deduction

**How it works:**
1. Webhook receives `payment.paid` event
2. Calls `updateBudgetOnDisbursement()`
3. Finds budget allocation by:
   - Budget type: `scholarship_benefits` (or `financial_support`)
   - School year: From application's academic record
   - Active status: `is_active = true`
4. Increments `disbursed_budget`:
   ```php
   $budgetAllocation->incrementDisbursed($amount);
   // disbursed_budget += $amount
   ```
5. `remaining_budget` automatically calculated:
   ```php
   // In BudgetAllocation model
   return max(0, $this->total_budget - $this->disbursed_budget);
   ```

### ✅ Application Status Update

**Status Flow:**
- `approved` → `grants_processing` (when payment link created)
- `grants_processing` → `grants_disbursed` (when payment successful)

### ✅ Disbursement Record Creation

**Record includes:**
- Application reference
- Payment transaction reference
- Amount
- Payment provider (PayMongo)
- Provider transaction ID
- Disbursement status: `completed`
- Timestamps and audit info

---

## Testing Checklist

### Test Payment Flow

1. **Start Services:**
   ```bash
   # Terminal 1: Laravel server
   cd microservices/aid_service
   php artisan serve --port=8002
   
   # Terminal 2: ngrok
   ngrok http 8002
   ```

2. **Update PayMongo Webhook:**
   - Use ngrok URL: `https://your-ngrok-url/api/webhooks/paymongo`

3. **Test Flow:**
   - [ ] Click "Process Grant" on approved application
   - [ ] Verify redirect to PayMongo
   - [ ] Complete test payment
   - [ ] Verify redirect to success page
   - [ ] Check webhook received (ngrok interface)
   - [ ] Verify database:
     - [ ] `payment_transactions` status = `completed`
     - [ ] `aid_disbursements` record created
     - [ ] Application status = `grants_disbursed`
     - [ ] Budget `disbursed_budget` increased
     - [ ] Budget `remaining_budget` decreased

---

## Database Tables Involved

1. **`payment_transactions`** - Tracks payment attempts
2. **`aid_disbursements`** - Records completed disbursements
3. **`budget_allocations`** - Tracks budget per school year
4. **`scholarship_applications`** - Application status tracking

---

## Files Modified/Created

### Backend
- ✅ `app/Services/PaymentService.php` - Payment link creation
- ✅ `app/Http/Controllers/SchoolAidController.php` - Updated processGrant
- ✅ `app/Http/Controllers/PaymentWebhookController.php` - Webhook handler
- ✅ `app/Models/PaymentTransaction.php` - Payment transaction model
- ✅ `database/migrations/2026_01_20_000002_create_payment_transactions_table.php`
- ✅ `database/migrations/2026_01_20_000003_add_payment_fields_to_aid_disbursements.php`
- ✅ `routes/api.php` - Added webhook route

### Frontend
- ✅ `GSM/src/admin/components/modules/schoolAid/SchoolAidDistribution.tsx` - Updated handleProcessGrant
- ✅ `GSM/src/admin/components/modules/schoolAid/services/schoolAidService.ts` - Updated processGrant
- ✅ `GSM/src/admin/pages/PaymentSuccess.tsx` - Success page
- ✅ `GSM/src/admin/pages/PaymentCancel.tsx` - Cancel page
- ✅ `GSM/src/App.tsx` - Added payment routes

---

## Summary

**Option 1 (Direct Redirect) is fully implemented:**

✅ User clicks "Process Grant"  
✅ Redirects to PayMongo checkout (with auto-populated student info)  
✅ User completes payment  
✅ Webhook automatically:
   - Creates `aid_disbursements` record
   - Updates application to `grants_disbursed`
   - Auto-deducts budget
   - Logs audit trail

**Everything is automatic - no manual intervention needed!**
