<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;

class RequestSigner
{
    /**
     * Sign an HTTP request for inter-service communication
     *
     * @param  \Illuminate\Http\Client\PendingRequest  $request
     * @param  string  $method  HTTP method (GET, POST, etc.)
     * @param  string  $path  Request path
     * @param  string  $body  Request body (JSON string or empty string)
     * @param  string  $targetService  Target service name
     * @return \Illuminate\Http\Client\PendingRequest
     */
    public static function signRequest(
        PendingRequest $request, 
        string $method, 
        string $path, 
        string $body, 
        string $targetService
    ): PendingRequest {
        $timestamp = time();
        $serviceName = config('app.service_name', 'scholarship_service');
        $secret = config("services.{$targetService}.shared_secret");
        
        if (!$secret) {
            \Log::error('No shared secret configured for target service', [
                'target_service' => $targetService,
                'calling_service' => $serviceName
            ]);
            throw new \Exception("No shared secret configured for service: {$targetService}");
        }
        
        // Build signature payload
        // Format: METHOD|PATH|TIMESTAMP|BODY
        $payload = implode('|', [
            strtoupper($method),
            $path,
            $timestamp,
            $body
        ]);
        
        // Calculate signature using HMAC-SHA256
        $signature = hash_hmac('sha256', $payload, $secret);
        
        // Add signature headers to request
        return $request->withHeaders([
            'X-Signature' => $signature,
            'X-Timestamp' => (string) $timestamp,
            'X-Service-Name' => $serviceName,
        ]);
    }
    
    /**
     * Sign a GET request
     *
     * @param  \Illuminate\Http\Client\PendingRequest  $request
     * @param  string  $path
     * @param  string  $targetService
     * @return \Illuminate\Http\Client\PendingRequest
     */
    public static function signGetRequest(
        PendingRequest $request,
        string $path,
        string $targetService
    ): PendingRequest {
        return self::signRequest($request, 'GET', $path, '', $targetService);
    }
    
    /**
     * Sign a POST request
     *
     * @param  \Illuminate\Http\Client\PendingRequest  $request
     * @param  string  $path
     * @param  array  $data
     * @param  string  $targetService
     * @return \Illuminate\Http\Client\PendingRequest
     */
    public static function signPostRequest(
        PendingRequest $request,
        string $path,
        array $data,
        string $targetService
    ): PendingRequest {
        $body = json_encode($data);
        return self::signRequest($request, 'POST', $path, $body, $targetService);
    }
    
    /**
     * Sign a PUT request
     *
     * @param  \Illuminate\Http\Client\PendingRequest  $request
     * @param  string  $path
     * @param  array  $data
     * @param  string  $targetService
     * @return \Illuminate\Http\Client\PendingRequest
     */
    public static function signPutRequest(
        PendingRequest $request,
        string $path,
        array $data,
        string $targetService
    ): PendingRequest {
        $body = json_encode($data);
        return self::signRequest($request, 'PUT', $path, $body, $targetService);
    }
    
    /**
     * Sign a DELETE request
     *
     * @param  \Illuminate\Http\Client\PendingRequest  $request
     * @param  string  $path
     * @param  string  $targetService
     * @return \Illuminate\Http\Client\PendingRequest
     */
    public static function signDeleteRequest(
        PendingRequest $request,
        string $path,
        string $targetService
    ): PendingRequest {
        return self::signRequest($request, 'DELETE', $path, '', $targetService);
    }
}
