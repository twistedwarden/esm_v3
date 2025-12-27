<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileSecurityLog extends Model
{
    protected $fillable = [
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'is_clean',
        'threat_name',
        'notes',
        'scan_duration',
        'scanner_type',
        'student_id',
        'application_id',
        'document_id',
    ];

    protected $casts = [
        'is_clean' => 'boolean',
        'scan_duration' => 'decimal:4',
        'file_size' => 'integer',
    ];

    /**
     * Get the student that owns the file.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the application that owns the file.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ScholarshipApplication::class, 'application_id');
    }

    /**
     * Get the document that was scanned.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Scope for clean files only.
     */
    public function scopeClean($query)
    {
        return $query->where('is_clean', true);
    }

    /**
     * Scope for infected files only.
     */
    public function scopeInfected($query)
    {
        return $query->where('is_clean', false);
    }

    /**
     * Scope for specific threat type.
     */
    public function scopeThreat($query, $threatName)
    {
        return $query->where('threat_name', $threatName);
    }

    /**
     * Scope for date range.
     */
    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }
}
