# SSC Parallel Workflow - Complete Guide

## 📊 **Workflow Overview**

The SSC (Scholarship Selection Committee) uses a **parallel workflow** with 4 stages:

```
Application → Endorsed to SSC → [3 Parallel Stages] → Final Approval
```

### **Stage 1-3: Parallel Review** (Can happen simultaneously)

1. **Document Verification** - Verify all required documents
2. **Financial Review** - Assess financial need and feasibility
3. **Academic Review** - Evaluate academic qualifications

### **Stage 4: Final Approval** (Only after all 3 stages complete)

4. **Final Approval** - Chairperson gives final decision

## 🔄 **How Parallel Workflow Works**

### Key Principle

**All three review stages can be completed in ANY order, by different SSC members at the same time.**

### Example Timeline:

```
Day 1, 9:00 AM  → Application endorsed to SSC (status: 'endorsed_to_ssc')
Day 1, 10:00 AM → Document Verifier approves documents ✓
Day 1, 2:00 PM  → Financial Analyst approves financial ✓
Day 2, 11:00 AM → Academic Reviewer approves academic ✓
                → All 3 stages complete!
                → Status automatically changes to 'ssc_final_approval'
Day 2, 3:00 PM  → Chairperson gives final approval ✓
                → Status becomes 'approved'
```

## 🎯 **API Endpoints for Each Stage**

### 1. Document Verification

```http
POST /api/applications/{id}/ssc/document-verification
Authorization: Bearer {token}
Content-Type: application/json

{
  "verified": true,
  "notes": "All documents complete and verified",
  "document_issues": []
}
```

**Response:**

```json
{
  "success": true,
  "message": "Document verification stage approved successfully.",
  "data": {
    "id": 4,
    "status": "endorsed_to_ssc",
    "ssc_stage_status": {
      "document_verification": {
        "status": "approved",
        "reviewed_by": 123,
        "reviewed_at": "2025-10-18T12:34:56Z",
        "notes": "All documents complete and verified"
      }
    },
    "all_required_stages_completed": false
  }
}
```

### 2. Financial Review

```http
POST /api/applications/{id}/ssc/financial-review
Authorization: Bearer {token}
Content-Type: application/json

{
  "feasible": true,
  "recommended_amount": 15000,
  "notes": "Financial need verified, amount is feasible",
  "budget_period": "Academic Year 2025-2026",
  "financial_assessment_score": 4
}
```

**Response:**

```json
{
  "success": true,
  "message": "Financial review stage approved successfully.",
  "data": {
    "status": "endorsed_to_ssc",
    "ssc_stage_status": {
      "document_verification": { "status": "approved", ... },
      "financial_review": {
        "status": "approved",
        "reviewed_by": 124,
        "reviewed_at": "2025-10-18T14:30:00Z",
        "notes": "Financial need verified, amount is feasible"
      }
    },
    "all_required_stages_completed": false
  }
}
```

### 3. Academic Review

```http
POST /api/applications/{id}/ssc/academic-review
Authorization: Bearer {token}
Content-Type: application/json

{
  "approved": true,
  "notes": "Strong academic performance, eligible for scholarship"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Academic review stage approved successfully.",
  "data": {
    "status": "ssc_final_approval",  // ← Changed automatically!
    "ssc_stage_status": {
      "document_verification": { "status": "approved", ... },
      "financial_review": { "status": "approved", ... },
      "academic_review": {
        "status": "approved",
        "reviewed_by": 125,
        "reviewed_at": "2025-10-19T11:00:00Z",
        "notes": "Strong academic performance"
      }
    },
    "all_required_stages_completed": true,  // ← Now true!
    "ready_for_final_approval_at": "2025-10-19T11:00:00Z"
  }
}
```

### 4. Final Approval (Chairperson Only)

```http
POST /api/applications/{id}/ssc/final-approval
Authorization: Bearer {token}
Content-Type: application/json

{
  "approved_amount": 15000,
  "notes": "Application approved by SSC"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Application approved successfully.",
  "data": {
    "status": "approved", // ← Final status!
    "approved_amount": 15000,
    "ssc_approved_at": "2025-10-19T15:00:00Z"
  }
}
```

## 👥 **SSC Roles**

### Required Roles (in `ssc_member_assignments` table):

1. **document_verifier** - Can approve/reject document verification
2. **financial_analyst** - Can approve/reject financial review
3. **academic_reviewer** - Can approve/reject academic review
4. **chairperson** - Can give final approval/rejection

### Assigning Roles:

```bash
php artisan tinker
```

```php
// Assign Document Verifier
\App\Models\SscMemberAssignment::create([
    'user_id' => 123,
    'ssc_role' => 'document_verifier',
    'is_active' => true,
    'assigned_at' => now()
]);

// Assign Financial Analyst
\App\Models\SscMemberAssignment::create([
    'user_id' => 124,
    'ssc_role' => 'financial_analyst',
    'is_active' => true,
    'assigned_at' => now()
]);

// Assign Academic Reviewer
\App\Models\SscMemberAssignment::create([
    'user_id' => 125,
    'ssc_role' => 'academic_reviewer',
    'is_active' => true,
    'assigned_at' => now()
]);

// Assign Chairperson
\App\Models\SscMemberAssignment::create([
    'user_id' => 126,
    'ssc_role' => 'chairperson',
    'is_active' => true,
    'assigned_at' => now()
]);
exit
```

## 🔒 **Status Transitions**

### Valid Status Flow:

```
draft → submitted → documents_reviewed → interview_scheduled
→ interview_completed → endorsed_to_ssc → ssc_final_approval → approved
```

### For SSC Workflow:

- **endorsed_to_ssc**: Application is under SSC review (parallel stages)
- **ssc_final_approval**: All 3 stages complete, ready for chairperson
- **approved**: Final approval given by chairperson

## 🧪 **Testing the Workflow**

### Step 1: Prepare an Application

```bash
php artisan tinker
```

```php
// Get or create an application
$app = \App\Models\ScholarshipApplication::first();
$app->update(['status' => 'endorsed_to_ssc']);
echo "Application ID: {$app->id} is ready for SSC review";
exit
```

### Step 2: Test Document Verification

Use Postman or curl:

```bash
curl -X POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/document-verification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true,
    "notes": "All documents verified",
    "document_issues": []
  }'
```

### Step 3: Test Financial Review

```bash
curl -X POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/financial-review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feasible": true,
    "recommended_amount": 15000,
    "notes": "Financial need verified"
  }'
```

### Step 4: Test Academic Review

```bash
curl -X POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/academic-review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "notes": "Strong academic performance"
  }'
```

**After step 4, the status should automatically change to `ssc_final_approval`!**

### Step 5: Test Final Approval

```bash
curl -X POST https://scholarship-gsph.up.railway.app/api/applications/4/ssc/final-approval \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved_amount": 15000,
    "notes": "Application approved by SSC"
  }'
```

## 📊 **Checking Stage Status**

### View Current Stage Status:

```bash
php artisan tinker
```

```php
$app = \App\Models\ScholarshipApplication::find(4);
print_r($app->ssc_stage_status);

// Check which stages are complete
echo "\nDocument Verification: " . ($app->ssc_stage_status['document_verification']['status'] ?? 'pending');
echo "\nFinancial Review: " . ($app->ssc_stage_status['financial_review']['status'] ?? 'pending');
echo "\nAcademic Review: " . ($app->ssc_stage_status['academic_review']['status'] ?? 'pending');
echo "\nAll Complete: " . ($app->all_required_stages_completed ? 'Yes' : 'No');
exit
```

## 🚨 **Common Issues**

### Issue 1: 500 Error on Any Stage

**Cause**: Application not in correct status
**Fix**:

```php
$app->update(['status' => 'endorsed_to_ssc']);
```

### Issue 2: Status Not Changing to 'ssc_final_approval'

**Cause**: Not all 3 stages are approved
**Fix**: Check which stages are missing:

```php
$status = $app->ssc_stage_status ?? [];
var_dump($status);
```

### Issue 3: User Can't Access Endpoint

**Cause**: User not assigned correct SSC role
**Fix**: Assign the appropriate role in `ssc_member_assignments`

### Issue 4: "Not in SSC review stage" Error

**Cause**: Application status is not `endorsed_to_ssc` or `ssc_final_approval`
**Fix**: Update status to `endorsed_to_ssc`

## 🎨 **Frontend Implementation Tips**

### Show Stage Progress:

```typescript
interface StageStatus {
  document_verification: { status: string; reviewed_by: number; notes: string };
  financial_review: { status: string; reviewed_by: number; notes: string };
  academic_review: { status: string; reviewed_by: number; notes: string };
}

function StagProgressIndicator({ application }) {
  const stages = application.ssc_stage_status || {};

  return (
    <div>
      <Stage
        name="Document Verification"
        status={stages.document_verification?.status || "pending"}
      />
      <Stage
        name="Financial Review"
        status={stages.financial_review?.status || "pending"}
      />
      <Stage
        name="Academic Review"
        status={stages.academic_review?.status || "pending"}
      />
    </div>
  );
}
```

## 📋 **Summary**

### Parallel Workflow Benefits:

✅ **Faster processing** - Multiple reviewers work simultaneously
✅ **Independent reviews** - Each stage is evaluated separately
✅ **Automatic progression** - Status updates when all stages complete
✅ **Clear tracking** - See exactly which stages are complete

### Key Points:

1. Application must be in `endorsed_to_ssc` status
2. All 3 stages can happen in ANY order
3. Status automatically becomes `ssc_final_approval` when all 3 complete
4. Only chairperson can give final approval
5. Each reviewer needs correct role assignment

---

**Need Help?**

- Check `SSC_STATUS_FIX.md` for status issues
- Check `SSC_QUICK_DIAGNOSIS.md` for troubleshooting
- Run `php check_ssc_tables.php` to verify database setup
