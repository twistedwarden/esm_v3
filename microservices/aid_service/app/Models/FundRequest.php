<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FundRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year',
        'budget_type',
        'requested_amount',
        'purpose',
        'notes',
        'status',
        'requested_by_user_id',
        'requested_by_name',
    ];

    protected $casts = [
        'requested_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
