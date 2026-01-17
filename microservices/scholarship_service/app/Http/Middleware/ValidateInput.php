<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateInput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize all input
        $this->sanitizeInput($request);
        
        // Detect malicious patterns
        if ($this->detectMaliciousInput($request)) {
            \Log::warning('Malicious input detected', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'path' => $request->path(),
                'method' => $request->method(),
                'input_keys' => array_keys($request->all())
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected. Please check your data and try again.',
                'error_code' => 'INVALID_INPUT'
            ], 400);
        }
        
        return $next($request);
    }
    
    /**
     * Sanitize input data
     */
    private function sanitizeInput(Request $request): void
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove null bytes
                $value = str_replace("\0", '', $value);
                
                // Trim whitespace
                $value = trim($value);
                
                // Remove control characters (except newline and tab)
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
            }
        });
        
        $request->merge($input);
    }
    
    /**
     * Detect malicious input patterns
     */
    private function detectMaliciousInput(Request $request): bool
    {
        $input = json_encode($request->all());
        
        // Skip validation for certain routes (e.g., document content)
        if ($this->shouldSkipValidation($request)) {
            return false;
        }
        
        // SQL injection patterns
        $sqlPatterns = [
            '/(\bunion\b.*\bselect\b)/i',
            '/(\bselect\b.*\bfrom\b)/i',
            '/(\binsert\b.*\binto\b)/i',
            '/(\bdelete\b.*\bfrom\b)/i',
            '/(\bdrop\b.*\btable\b)/i',
            '/(\btruncate\b.*\btable\b)/i',
            '/(\bor\b\s*[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+)/i',
            '/\'.*--/',
            '/;.*\b(drop|delete|insert|update|create)\b/i',
            '/\bunion\b.*\ball\b.*\bselect\b/i'
        ];
        
        // XSS patterns
        $xssPatterns = [
            '/<script\b[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/on\w+\s*=\s*[\'"][^\'">]+[\'"]/i',
            '/<iframe\b/i',
            '/<object\b/i',
            '/<embed\b/i',
            '/<applet\b/i',
            '/onerror\s*=/i',
            '/onload\s*=/i'
        ];
        
        // Command injection patterns
        $commandPatterns = [
            '/;\s*\b(cat|ls|pwd|whoami|wget|curl|nc|netcat|bash|sh)\b/i',
            '/\|\s*\b(cat|ls|pwd|whoami|rm|mv)\b/i',
            '/`[^`]*`/',
            '/\$\([^)]*\)/',
            '/&&\s*\b(cat|ls|pwd|whoami|rm)\b/i'
        ];
        
        // Path traversal patterns
        $pathTraversalPatterns = [
            '/\.\.[\/\\\\]/',
            '/%2e%2e[\/\\\\]/i',
            '/\.\.[%252f%255c]/i'
        ];
        
        $allPatterns = array_merge(
            $sqlPatterns, 
            $xssPatterns, 
            $commandPatterns,
            $pathTraversalPatterns
        );
        
        foreach ($allPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                \Log::warning('Malicious pattern detected', [
                    'pattern' => $pattern,
                    'input_sample' => substr($input, 0, 200)
                ]);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determine if validation should be skipped for this request
     */
    private function shouldSkipValidation(Request $request): bool
    {
        // Skip for document uploads and certain content fields
        $skipRoutes = [
            'api/documents/*/view',
            'api/documents/*/download',
        ];
        
        foreach ($skipRoutes as $route) {
            if ($request->is($route)) {
                return true;
            }
        }
        
        return false;
    }
}
