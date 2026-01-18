<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'ip_address',
        'attempt_time',
        'success',
        'user_agent'
    ];

    protected $casts = [
        'attempt_time' => 'datetime',
        'success' => 'boolean'
    ];
}
