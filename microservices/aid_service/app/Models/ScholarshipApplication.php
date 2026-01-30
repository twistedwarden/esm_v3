<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipApplication extends Model
{
    protected $connection = 'scholarship_service';
    protected $table = 'scholarship_applications';

    protected $fillable = [
        'application_number',
        'student_id',
        'category_id',
        'subcategory_id',
        'school_id',
        'type',
        'parent_application_id',
        'status',
        'ssc_stage_status',
        'approved_amount',
        'requested_amount',
        'financial_need_description',
        'reason_for_renewal',
        'rejection_reason',
        'notes',
        'marginalized_groups',
        'digital_wallets',
        'wallet_account_number'
    ];

    protected $casts = [
        'ssc_stage_status' => 'array',
        'approved_amount' => 'decimal:2',
        'requested_amount' => 'decimal:2',
        'marginalized_groups' => 'array',
        'digital_wallets' => 'array',
        'approved_at' => 'datetime',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'disbursed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ScholarshipCategory::class, 'category_id');
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(ScholarshipSubcategory::class, 'subcategory_id');
    }
}
