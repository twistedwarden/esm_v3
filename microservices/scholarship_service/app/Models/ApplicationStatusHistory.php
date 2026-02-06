<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class ApplicationStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'application_status_history';

    public $timestamps = false;

    protected $fillable = [
        'application_id',
        'status',
        'notes',
        'changed_by',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    // Relationships
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    /**
     * Note: changedBy relationship is disabled because users are in a separate
     * auth_service database that this service cannot directly access.
     * The changed_by field stores the user ID for reference only.
     */
    // public function changedBy(): BelongsTo
    // {
    //     return $this->belongsTo(User::class, 'changed_by');
    // }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('changed_at', '>=', now()->subDays($days));
    }
}
