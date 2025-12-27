<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\VirusScannerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ScanUploadedDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $documentId;
    protected $filePath;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $filePath)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::find($this->documentId);
        
        if (!$document) {
            Log::error('Document not found for virus scanning', [
                'document_id' => $this->documentId
            ]);
            return;
        }

        $fullPath = Storage::disk('public')->path($this->filePath);
        
        if (!file_exists($fullPath)) {
            Log::error('File not found for virus scanning', [
                'document_id' => $this->documentId,
                'file_path' => $fullPath
            ]);
            return;
        }

        try {
            $scanner = app(VirusScannerService::class);
            $scanResult = $scanner->scanFile($fullPath, $document->file_name);
            
            if (!$scanResult['is_clean']) {
                Log::warning('Malicious file detected in background scan', [
                    'document_id' => $this->documentId,
                    'filename' => $document->file_name,
                    'threat' => $scanResult['threat_name'] ?? 'Unknown',
                    'scan_duration' => $scanResult['scan_duration'] ?? 0
                ]);
                
                // Move file to quarantine
                $this->quarantineFile($document, $scanResult);
                
                // Mark document as rejected
                $document->update([
                    'status' => 'rejected',
                    'verification_notes' => 'Malicious content detected: ' . ($scanResult['threat_name'] ?? 'Unknown threat'),
                    'virus_scan_log_id' => $scanResult['log_id'] ?? null,
                ]);
                
                // Notify admin and student
                $this->notifyMaliciousFile($document, $scanResult);
                
            } else {
                Log::info('File passed background virus scan', [
                    'document_id' => $this->documentId,
                    'filename' => $document->file_name,
                    'scan_duration' => $scanResult['scan_duration'] ?? 0
                ]);
                
                $document->update([
                    'virus_scan_log_id' => $scanResult['log_id'] ?? null,
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Virus scanning job failed', [
                'document_id' => $this->documentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Mark document as needing manual review
            $document->update([
                'verification_notes' => 'Virus scan failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Move file to quarantine
     */
    protected function quarantineFile(Document $document, array $scanResult): void
    {
        try {
            $quarantinePath = 'quarantine/' . date('Y/m/d') . '/' . $document->id . '_' . $document->file_name;
            $quarantineFullPath = Storage::disk('public')->path($quarantinePath);
            
            // Ensure quarantine directory exists
            $quarantineDir = dirname($quarantineFullPath);
            if (!is_dir($quarantineDir)) {
                mkdir($quarantineDir, 0755, true);
            }
            
            // Move file to quarantine
            $originalPath = Storage::disk('public')->path($document->file_path);
            if (file_exists($originalPath)) {
                rename($originalPath, $quarantineFullPath);
                
                // Log quarantine action
                \DB::table('document_quarantine')->insert([
                    'document_id' => $document->id,
                    'original_file_path' => $document->file_path,
                    'quarantine_file_path' => $quarantinePath,
                    'threat_name' => $scanResult['threat_name'] ?? null,
                    'scan_details' => json_encode($scanResult),
                    'quarantine_reason' => 'Malicious content detected',
                    'quarantined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                Log::info('File quarantined', [
                    'document_id' => $document->id,
                    'original_path' => $document->file_path,
                    'quarantine_path' => $quarantinePath
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to quarantine file', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notify about malicious file detection
     */
    protected function notifyMaliciousFile(Document $document, array $scanResult): void
    {
        try {
            // Log the incident for admin review
            Log::critical('MALICIOUS FILE DETECTED', [
                'document_id' => $document->id,
                'student_id' => $document->student_id,
                'application_id' => $document->application_id,
                'filename' => $document->file_name,
                'threat' => $scanResult['threat_name'] ?? 'Unknown',
                'scan_duration' => $scanResult['scan_duration'] ?? 0,
                'quarantined' => true
            ]);
            
            // TODO: Send email notification to admin
            // TODO: Send notification to student about rejected document
            
        } catch (\Exception $e) {
            Log::error('Failed to send malicious file notification', [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Virus scanning job failed permanently', [
            'document_id' => $this->documentId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
        
        // Mark document as needing manual review
        $document = Document::find($this->documentId);
        if ($document) {
            $document->update([
                'verification_notes' => 'Virus scan job failed: ' . $exception->getMessage(),
            ]);
        }
    }
}
