<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSchoolRepresentative extends Model
{
    use HasFactory;

    protected $fillable = [
        'citizen_id',
        'school_id',
        'is_active',
        'assigned_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime',
    ];

    /**
     * Get the school this representative is assigned to
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Scope to get only active representatives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get representative by citizen ID
     */
    public static function findByCitizenId(string $citizenId): ?self
    {
        return static::where('citizen_id', $citizenId)
            ->where('is_active', true)
            ->first();
    }
}

