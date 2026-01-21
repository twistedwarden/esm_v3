<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\DocumentType;
use Illuminate\Support\Facades\Storage;

class SampleDocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all scholarship applications
        $applications = ScholarshipApplication::with('student')->get();

        if ($applications->isEmpty()) {
            $this->command->warn('No scholarship applications found. Please run SampleApplicationSeeder first.');
            return;
        }

        // Get required document types for scholarship applications
        $requiredDocTypes = [
            1,  // Transcript of Records
            2,  // Certificate of Good Moral
            3,  // Income Certificate
            4,  // Barangay Certificate
            5,  // Valid ID
            6,  // Birth Certificate
            17, // Certificate of Enrollment
            20, // Income Tax Return (ITR)
        ];

        $documentTypes = DocumentType::whereIn('id', $requiredDocTypes)->get();

        // Create storage directory if it doesn't exist
        $storageDir = 'documents/scholarship';
        if (!Storage::disk('public')->exists($storageDir)) {
            Storage::disk('public')->makeDirectory($storageDir);
        }

        foreach ($applications as $application) {
            $this->command->info("Creating documents for application: {$application->application_number}");

            foreach ($documentTypes as $docType) {
                try {
                    // Generate a dummy PDF file
                    $fileName = $this->generateFileName($application, $docType);
                    $filePath = "{$storageDir}/{$fileName}";

                    // Create a simple dummy PDF content
                    $pdfContent = $this->generateDummyPDF($application, $docType);
                    Storage::disk('public')->put($filePath, $pdfContent);

                    // Create document record
                    Document::create([
                        'student_id' => $application->student_id,
                        'application_id' => $application->id,
                        'document_type_id' => $docType->id,
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'file_size' => strlen($pdfContent),
                        'mime_type' => 'application/pdf',
                        'status' => 'verified', // Auto-verify for sample data
                        'verification_notes' => 'Sample document - auto-verified',
                        'verified_by' => 1, // Admin user
                        'verified_at' => now(),
                    ]);

                    $this->command->info("  ✓ Created: {$docType->name}");
                } catch (\Exception $e) {
                    $this->command->error("  ✗ Failed to create {$docType->name}: " . $e->getMessage());
                }
            }
        }

        $totalDocs = Document::count();
        $this->command->info("\nSample documents created successfully!");
        $this->command->info("Total documents: {$totalDocs}");
    }

    /**
     * Generate a file name for the document
     */
    private function generateFileName($application, $docType): string
    {
        $studentName = str_replace(' ', '_', $application->student->first_name . '_' . $application->student->last_name);
        $docName = str_replace(' ', '_', $docType->name);
        $docName = str_replace(['(', ')', ',', '.'], '', $docName);

        return strtolower("{$studentName}_{$docName}_" . date('Ymd') . ".pdf");
    }

    /**
     * Generate dummy PDF content
     */
    private function generateDummyPDF($application, $docType): string
    {
        // This is a minimal PDF structure
        $content = <<<PDF
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(SAMPLE DOCUMENT) Tj
0 -20 Td
(Document Type: {$docType->name}) Tj
0 -20 Td
(Student: {$application->student->first_name} {$application->student->last_name}) Tj
0 -20 Td
(Application #: {$application->application_number}) Tj
0 -20 Td
(Generated: ) Tj
(2026-01-21) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
566
%%EOF
PDF;

        return $content;
    }
}
