<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log for debugging
        \Log::info('CorsMiddleware called', [
            'method' => $request->getMethod(),
            'path' => $request->path(),
            'origin' => $request->headers->get('Origin'),
        ]);

        // Get the origin from the request
        $origin = $request->headers->get('Origin');
        
        // Define allowed origins
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            'https://educ.goserveph.com',
        ];

        // Determine the allowed origin
        // When using credentials, we cannot use '*' - must specify exact origin
        $allowedOrigin = null;
        if ($origin && in_array($origin, $allowedOrigins)) {
            $allowedOrigin = $origin;
        } elseif (!$origin) {
            // No origin header (e.g., same-origin request or Postman)
            // For API routes, we'll allow it but without credentials
            $allowedOrigin = '*';
        } else {
            // Origin not in allowed list - reject for security
            // But for development, we might want to allow it
            if ($request->is('api/*')) {
                // In development, allow the origin anyway but log it
                $allowedOrigin = $origin;
            }
        }
        
        // Ensure we have a valid origin
        if (!$allowedOrigin) {
            $allowedOrigin = $allowedOrigins[0]; // Default to localhost:5173
        }

        // Handle preflight OPTIONS requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN')
                ->header('Access-Control-Max-Age', '86400');
            
            // Only set credentials header if origin is not '*'
            if ($allowedOrigin !== '*') {
                $response->header('Access-Control-Allow-Credentials', 'true');
            }
            
            return $response;
        }

        // Process the request
        $response = $next($request);

        // Add CORS headers to all responses
        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN');
        
        // Only set credentials if origin is not '*'
        if ($allowedOrigin !== '*') {
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }
        
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');

        return $response;
    }
}
