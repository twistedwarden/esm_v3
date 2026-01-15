<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Internal Microservices
    |--------------------------------------------------------------------------
    |
    | Configuration for communicating with other microservices in the GSM
    | platform. Used for token validation and service-to-service auth.
    |
    */

    'auth' => [
        'url' => env('AUTH_SERVICE_URL', 'http://localhost:8000'),
        'token' => env('AUTH_SERVICE_TOKEN'),
    ],

    'scholarship' => [
        'url' => env('SCHOLARSHIP_SERVICE_URL', 'http://localhost:8001'),
        'token' => env('SCHOLARSHIP_SERVICE_TOKEN'),
    ],

    'aid' => [
        'url' => env('AID_SERVICE_URL', 'http://localhost:8002'),
        'token' => env('AID_SERVICE_TOKEN'),
    ],

    'internal' => [
        'token' => env('INTERNAL_SERVICE_TOKEN'),
    ],

];
