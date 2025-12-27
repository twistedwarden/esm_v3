<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class FileSecurityService
{
    /**
     * Comprehensive file security validation
     * Validates file type, size, content, and basic security checks
     */
    public function validateFile(UploadedFile $file): array
    {
        $startTime = microtime(true);
        $fileName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getMimeType();
        $extension = $file->getClientOriginalExtension();
        
        Log::info('File security validation started', [
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'extension' => $extension
        ]);

        $validation = [
            'is_clean' => true,
            'threat_name' => null,
            'scan_duration' => 0,
            'log_id' => null,
            'warnings' => []
        ];

        try {
            // 1. File size validation (10MB max)
            if ($fileSize > 10 * 1024 * 1024) {
                $validation['is_clean'] = false;
                $validation['threat_name'] = 'File too large';
                Log::warning('File rejected: Too large', ['file_size' => $fileSize]);
                return $validation;
            }

            // 2. MIME type validation
            $allowedMimeTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!in_array($mimeType, $allowedMimeTypes)) {
                $validation['is_clean'] = false;
                $validation['threat_name'] = 'Invalid file type';
                Log::warning('File rejected: Invalid MIME type', ['mime_type' => $mimeType]);
                return $validation;
            }

            // 3. File extension validation
            $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
            if (!in_array(strtolower($extension), $allowedExtensions)) {
                $validation['is_clean'] = false;
                $validation['threat_name'] = 'Invalid file extension';
                Log::warning('File rejected: Invalid extension', ['extension' => $extension]);
                return $validation;
            }

            // 4. File signature validation (magic bytes)
            $fileSignature = $this->validateFileSignature($file, $mimeType);
            if (!$fileSignature['valid']) {
                $validation['is_clean'] = false;
                $validation['threat_name'] = 'File signature mismatch';
                Log::warning('File rejected: Signature mismatch', [
                    'expected' => $fileSignature['expected'],
                    'actual' => $fileSignature['actual']
                ]);
                return $validation;
            }

            // 5. Content validation for PDFs
            if ($mimeType === 'application/pdf') {
                $pdfValidation = $this->validatePdfContent($file);
                if (!$pdfValidation['valid']) {
                    $validation['warnings'][] = $pdfValidation['warning'];
                    Log::warning('PDF validation warning', ['warning' => $pdfValidation['warning']]);
                }
            }

            // 6. Basic security checks
            $securityChecks = $this->performSecurityChecks($file);
            if (!$securityChecks['safe']) {
                $validation['is_clean'] = false;
                $validation['threat_name'] = $securityChecks['threat'];
                Log::warning('File rejected: Security threat detected', ['threat' => $securityChecks['threat']]);
                return $validation;
            }

            $validation['scan_duration'] = round((microtime(true) - $startTime) * 1000, 2);
            
            Log::info('File security validation completed successfully', [
                'file_name' => $fileName,
                'scan_duration' => $validation['scan_duration']
            ]);

        } catch (\Exception $e) {
            Log::error('File security validation failed', [
                'file_name' => $fileName,
                'error' => $e->getMessage()
            ]);
            
            $validation['is_clean'] = false;
            $validation['threat_name'] = 'Validation error';
        }

        return $validation;
    }

    /**
     * Validate file signature (magic bytes)
     */
    private function validateFileSignature(UploadedFile $file, string $mimeType): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if (!$handle) {
            return ['valid' => false, 'expected' => 'unknown', 'actual' => 'unreadable'];
        }

        $header = fread($handle, 10);
        fclose($handle);

        $signatures = [
            'application/pdf' => '%PDF-',
            'image/jpeg' => "\xFF\xD8\xFF",
            'image/jpg' => "\xFF\xD8\xFF", 
            'image/png' => "\x89\x50\x4E\x47",
            'application/msword' => "\xD0\xCF\x11\xE0",
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => "PK\x03\x04"
        ];

        $expected = $signatures[$mimeType] ?? '';
        $actual = substr($header, 0, strlen($expected));

        return [
            'valid' => $actual === $expected,
            'expected' => bin2hex($expected),
            'actual' => bin2hex($actual)
        ];
    }

    /**
     * Validate PDF content for suspicious elements
     */
    private function validatePdfContent(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());
        
        // Check for suspicious PDF elements
        $suspiciousPatterns = [
            '/\/Launch\s+/' => 'PDF with launch actions',
            '/\/JavaScript\s+/' => 'PDF with JavaScript',
            '/\/EmbeddedFile\s+/' => 'PDF with embedded files',
            '/\/OpenAction\s+/' => 'PDF with open actions'
        ];

        foreach ($suspiciousPatterns as $pattern => $description) {
            if (preg_match($pattern, $content)) {
                return [
                    'valid' => false,
                    'warning' => $description
                ];
            }
        }

        return ['valid' => true, 'warning' => null];
    }

    /**
     * Perform basic security checks
     */
    private function performSecurityChecks(UploadedFile $file): array
    {
        $content = file_get_contents($file->getRealPath());
        
        // Check for executable content
        $executablePatterns = [
            '/<script/i' => 'HTML script tags',
            '/javascript:/i' => 'JavaScript URLs',
            '/vbscript:/i' => 'VBScript URLs',
            '/onload=/i' => 'Event handlers',
            '/eval\s*\(/i' => 'Eval functions'
        ];

        foreach ($executablePatterns as $pattern => $description) {
            if (preg_match($pattern, $content)) {
                return [
                    'safe' => false,
                    'threat' => "Suspicious content: {$description}"
                ];
            }
        }

        // Check for suspicious file names
        $suspiciousNames = [
            '/\.(exe|bat|cmd|scr|pif|com)$/i' => 'Executable file extension',
            '/\.(php|asp|jsp|cgi)$/i' => 'Server script extension',
            '/\.(vbs|js|wsf)$/i' => 'Script file extension'
        ];

        $fileName = $file->getClientOriginalName();
        foreach ($suspiciousNames as $pattern => $description) {
            if (preg_match($pattern, $fileName)) {
                return [
                    'safe' => false,
                    'threat' => "Suspicious filename: {$description}"
                ];
            }
        }

        return ['safe' => true, 'threat' => null];
    }

    /**
     * Get scan statistics
     */
    public function getScanStatistics(int $days = 30): array
    {
        // This would typically query a database table
        // For now, return mock data
        return [
            'total_scans' => 0,
            'clean_files' => 0,
            'threats_detected' => 0,
            'scan_duration_avg' => 0,
            'last_scan' => null
        ];
    }
}
