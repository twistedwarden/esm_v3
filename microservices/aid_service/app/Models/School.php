<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $table = 'schools';
    protected $connection = 'scholarship_service';
    
    protected $fillable = [
        'name',
        'code',
        'type',
        'address',
        'contact_person',
        'contact_email',
        'contact_phone',
        'is_active'
    ];
}
