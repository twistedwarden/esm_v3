<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScholarshipCategory extends Model
{
    protected $table = 'scholarship_categories';

    protected $fillable = [
        'name',
        'description',
        'amount',
        'is_active'
    ];
}
