<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AidDisbursement extends Model
{
    protected $table = 'aid_disbursements';

    protected $fillable = [
        'application_id',
        'application_number',
        'student_id',
        'school_id',
        'amount',
        'method',
        'provider_name',
        'reference_number',
        'receipt_path',
        'notes',
        'disbursed_by_user_id',
        'disbursed_by_name',
        'disbursed_at',
    ];

    protected $casts = [
        'disbursed_at' => 'datetime',
    ];
}
