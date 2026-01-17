<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'DENY');
        
        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Enable XSS protection (legacy but still useful)
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Force HTTPS in production
        if (config('app.env') === 'production') {
            $response->headers->set(
                'Strict-Transport-Security', 
                'max-age=31536000; includeSubDomains; preload'
            );
        }
        
        // Content Security Policy
        $csp = $this->getContentSecurityPolicy();
        $response->headers->set('Content-Security-Policy', $csp);
        
        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions Policy (formerly Feature-Policy)
        $permissionsPolicy = $this->getPermissionsPolicy();
        $response->headers->set('Permissions-Policy', $permissionsPolicy);
        
        // Remove server information
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');
        
        return $response;
    }
    
    /**
     * Get Content Security Policy directives
     */
    private function getContentSecurityPolicy(): string
    {
        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
            "frame-src 'self' https://accounts.google.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "upgrade-insecure-requests"
        ];
        
        // Remove upgrade-insecure-requests in development
        if (config('app.env') !== 'production') {
            $directives = array_filter($directives, function($directive) {
                return $directive !== 'upgrade-insecure-requests';
            });
        }
        
        return implode('; ', $directives);
    }
    
    /**
     * Get Permissions Policy directives
     */
    private function getPermissionsPolicy(): string
    {
        $policies = [
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'accelerometer=()',
            'gyroscope=()'
        ];
        
        return implode(', ', $policies);
    }
}
