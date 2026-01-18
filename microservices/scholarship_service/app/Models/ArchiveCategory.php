<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchiveCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'module'
    ];

    /**
     * Get archived records in this category
     */
    public function archivedRecords()
    {
        // This is a logical relationship based on naming convention
        // You would need to map category names to archive_type values
        return $this->hasMany(ArchivedRecord::class, 'archive_type', 'name');
    }

    /**
     * Scope to filter by module
     */
    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }
}
