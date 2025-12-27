<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialInformation extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'family_monthly_income_range',
        'monthly_income',
        'number_of_children',
        'number_of_siblings',
        'siblings_currently_enrolled',
        'home_ownership_status',
        'is_4ps_beneficiary',
    ];

    protected $casts = [
        'family_monthly_income_range' => 'string',
        'monthly_income' => 'float',
        'number_of_children' => 'integer',
        'number_of_siblings' => 'integer',
        'siblings_currently_enrolled' => 'integer',
        'is_4ps_beneficiary' => 'boolean',
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    // Scopes
    public function scopeLowIncome($query, $threshold = '30,000-50,000')
    {
        return $query->whereIn('family_monthly_income_range', ['Below 5,000', '5,000-10,000', '10,000-15,000', '15,000-20,000', '20,000-30,000', '30,000-50,000']);
    }

    public function scope4psBeneficiary($query)
    {
        return $query->where('is_4ps_beneficiary', true);
    }
}
