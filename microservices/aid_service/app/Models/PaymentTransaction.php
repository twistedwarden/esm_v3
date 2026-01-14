<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentTransaction extends Model
{
    use SoftDeletes;

    protected $table = 'payment_transactions';

    protected $fillable = [
        'application_id',
        'application_number',
        'student_id',
        'transaction_reference',
        'payment_provider',
        'payment_method',
        'transaction_amount',
        'transaction_status',
        'payment_link_url',
        'provider_transaction_id',
        'provider_reference_number',
        'initiated_at',
        'completed_at',
        'expires_at',
        'provider_response',
        'failure_reason',
        'initiated_by_user_id',
        'initiated_by_name',
    ];

    protected $casts = [
        'transaction_amount' => 'decimal:2',
        'initiated_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
        'provider_response' => 'array',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the application associated with this payment transaction
     */
    public function application()
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    /**
     * Get the disbursement record if payment was completed
     */
    public function disbursement()
    {
        return $this->hasOne(AidDisbursement::class, 'payment_transaction_id');
    }

    /**
     * Check if transaction is completed
     */
    public function isCompleted(): bool
    {
        return $this->transaction_status === 'completed';
    }

    /**
     * Check if transaction is pending
     */
    public function isPending(): bool
    {
        return $this->transaction_status === 'pending';
    }

    /**
     * Check if transaction has failed
     */
    public function hasFailed(): bool
    {
        return $this->transaction_status === 'failed';
    }

    /**
     * Mark transaction as completed
     */
    public function markAsCompleted(string $providerTransactionId = null, string $providerReferenceNumber = null): bool
    {
        $this->transaction_status = 'completed';
        $this->completed_at = now();
        
        if ($providerTransactionId) {
            $this->provider_transaction_id = $providerTransactionId;
        }
        
        if ($providerReferenceNumber) {
            $this->provider_reference_number = $providerReferenceNumber;
        }
        
        return $this->save();
    }

    /**
     * Mark transaction as failed
     */
    public function markAsFailed(string $reason = null): bool
    {
        $this->transaction_status = 'failed';
        if ($reason) {
            $this->failure_reason = $reason;
        }
        return $this->save();
    }
}
