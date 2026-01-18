<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchivedRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'archive_type',
        'original_id',
        'archived_data',
        'archived_by',
        'archived_at',
        'archive_reason',
        'related_records',
        'can_restore',
        'restored_at',
        'restored_by'
    ];

    protected $casts = [
        'archived_data' => 'array',
        'related_records' => 'array',
        'can_restore' => 'boolean',
        'archived_at' => 'datetime',
        'restored_at' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Get the user who archived this record
     */
    public function archivedBy()
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    /**
     * Get the user who restored this record
     */
    public function restoredBy()
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    /**
     * Scope to filter by archive type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('archive_type', $type);
    }

    /**
     * Scope to filter restorable records
     */
    public function scopeRestorable($query)
    {
        return $query->where('can_restore', true)->whereNull('restored_at');
    }

    /**
     * Scope to filter restored records
     */
    public function scopeRestored($query)
    {
        return $query->whereNotNull('restored_at');
    }
}
