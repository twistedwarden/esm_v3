<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Provider Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the AI provider for generating natural-language insights.
    | Supported providers: 'template', 'openai', 'anthropic', 'gemini', 'groq', 'custom'
    |
    | FREE OPTIONS:
    | - 'gemini': Google Gemini (15 req/min free) - https://aistudio.google.com/app/apikey
    | - 'groq': Groq (fast, generous free tier) - https://console.groq.com/keys
    |
    | When set to 'template' or when no API key is configured, the system
    | will generate deterministic template-based insights.
    |
    */

    'provider' => env('AI_PROVIDER', 'template'),

    /*
    |--------------------------------------------------------------------------
    | API Key
    |--------------------------------------------------------------------------
    |
    | Your API key for the chosen AI provider.
    | - OpenAI: Get from https://platform.openai.com/api-keys
    | - Anthropic: Get from https://console.anthropic.com/
    | - Custom: Your self-hosted API key
    |
    */

    'api_key' => env('AI_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | API URL
    |--------------------------------------------------------------------------
    |
    | Custom API endpoint URL. Required for 'custom' provider.
    | For OpenAI/Anthropic, this overrides the default endpoint.
    |
    */

    'api_url' => env('AI_API_URL'),

    /*
    |--------------------------------------------------------------------------
    | Model
    |--------------------------------------------------------------------------
    |
    | The AI model to use for generating insights.
    | - OpenAI: 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'
    | - Anthropic: 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'
    | - Custom: Your model identifier
    |
    */

    'model' => env('AI_MODEL', 'gpt-4'),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL
    |--------------------------------------------------------------------------
    |
    | How long to cache AI-generated insights in seconds.
    | Default is 900 seconds (15 minutes).
    |
    */

    'cache_ttl' => env('AI_CACHE_TTL', 900),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Maximum AI API calls per minute to control costs.
    | Set to 0 to disable rate limiting.
    |
    */

    'rate_limit_per_minute' => env('AI_RATE_LIMIT', 10),

    /*
    |--------------------------------------------------------------------------
    | Timeout
    |--------------------------------------------------------------------------
    |
    | Maximum time in seconds to wait for AI API response.
    |
    */

    'timeout' => env('AI_TIMEOUT', 30),

];
