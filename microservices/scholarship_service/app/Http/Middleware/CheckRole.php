<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->input('auth_user');
        
        if (!$user) {
            \Log::warning('Role check failed - no user data', [
                'path' => $request->path(),
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Authentication required',
                'error_code' => 'NO_USER_DATA'
            ], 401);
        }
        
        $userRole = $user['role'] ?? null;
        
        if (!$userRole) {
            \Log::warning('Role check failed - user has no role', [
                'user_id' => $user['id'] ?? null,
                'path' => $request->path()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No role assigned',
                'error_code' => 'NO_ROLE'
            ], 401);
        }
        
        // Check if user has any of the required roles
        if (!in_array($userRole, $roles)) {
            \Log::warning('Unauthorized role access attempt', [
                'user_id' => $user['id'] ?? null,
                'user_role' => $userRole,
                'required_roles' => $roles,
                'path' => $request->path(),
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Forbidden - Insufficient permissions',
                'error_code' => 'INSUFFICIENT_PERMISSIONS',
                'required_roles' => $roles,
                'your_role' => $userRole
            ], 403);
        }
        
        // User has required role, proceed
        \Log::info('Role check passed', [
            'user_id' => $user['id'] ?? null,
            'user_role' => $userRole,
            'path' => $request->path()
        ]);
        
        return $next($request);
    }
}
