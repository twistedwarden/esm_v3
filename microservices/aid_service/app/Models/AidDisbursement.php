<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\PaymentTransaction;

class AidDisbursement extends Model
{
    protected $table = 'aid_disbursements';

    protected $fillable = [
        'application_id',
        'payment_transaction_id',
        'application_number',
        'student_id',
        'school_id',
        'amount',
        'method',
        'disbursement_method',
        'provider_name',
        'payment_provider_name',
        'payment_provider',
        'provider_transaction_id',
        'account_number',
        'reference_number',
        'disbursement_reference_number',
        'disbursement_status',
        'receipt_path',
        'notes',
        'disbursed_by_user_id',
        'disbursed_by_name',
        'disbursed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'disbursed_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    /**
     * Get the payment transaction associated with this disbursement
     */
    public function paymentTransaction()
    {
        return $this->belongsTo(PaymentTransaction::class, 'payment_transaction_id');
    }
}
