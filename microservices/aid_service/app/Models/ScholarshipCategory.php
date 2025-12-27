<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScholarshipCategory extends Model
{
    protected $table = 'scholarship_categories';
    protected $connection = 'scholarship_service';
    
    protected $fillable = [
        'name',
        'description',
        'amount',
        'is_active'
    ];
}
