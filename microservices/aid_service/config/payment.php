<?php

return [
    'provider' => env('PAYMENT_PROVIDER', 'paymongo'),
    'mode' => env('PAYMONGO_MODE', 'test'),
    'mock_enabled' => env('PAYMENT_MOCK_ENABLED', false),
    
    'frontend' => [
        'local' => env('FRONTEND_URL_LOCAL', 'http://localhost:5173'),
        'production' => env('FRONTEND_URL_PRODUCTION'),
        'current' => env('FRONTEND_URL', env('FRONTEND_URL_LOCAL', 'http://localhost:5173')),
    ],
    
    'paymongo' => [
        'secret_key' => env('PAYMONGO_SECRET_KEY'),
        'public_key' => env('PAYMONGO_PUBLIC_KEY'),
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
    ],
];
