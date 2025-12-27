<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScholarshipSubcategory extends Model
{
    protected $table = 'scholarship_subcategories';
    protected $connection = 'scholarship_service';
    
    protected $fillable = [
        'category_id',
        'name',
        'description',
        'amount',
        'is_active'
    ];
}
