<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'campus',
        'classification',
        'address',
        'city',
        'province',
        'region',
        'zip_code',
        'contact_number',
        'email',
        'website',
        'is_public',
        'is_partner_school',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_partner_school' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the users assigned to this school
     */
    public function assignedUsers()
    {
        return $this->hasMany(User::class, 'assigned_school_id');
    }
}
