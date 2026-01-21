<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerSchoolApplication;
use App\Models\School;

class PartnerSchoolApplicationTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates test data for partner school applications
     */
    public function run(): void
    {
        // Get all partner schools (created by SchoolSeeder)
        $schools = School::where('is_partner_school', true)->get();

        if ($schools->isEmpty()) {
            $this->command->warn('No partner schools found. Make sure SchoolSeeder has run.');
            return;
        }

        foreach ($schools as $school) {
            // Seed verification documents directly for the school
            $this->seedVerificationDocuments($school);
        }

        $this->command->info('✅ Verification documents seeded for existing partner schools!');
        $this->command->info("   - Processed {$schools->count()} schools");
        $this->command->info('   - Documents generated (including MOA)');
        $this->command->info('');
        $this->command->info('You can now check the School Management UI!');
    }

    /**
     * seed verification documents for an application
     */
    /**
     * seed verification documents for a school
     */
    private function seedVerificationDocuments($school)
    {
        // Clear existing documents to ensure we generate fresh PDFs
        \App\Models\PartnerSchoolVerificationDocument::where('school_id', $school->id)->delete();

        $documents = [
            [
                'document_type' => 'Securities and Exchange Commission (SEC) Registration',
                'document_name' => 'SEC Registration',
                'filename_prefix' => 'SEC_Reg',
                'content' => "<h1>SEC Registration</h1><p>This is a dummy SEC Registration document for <strong>{$school->name}</strong>.</p>",
            ],
            [
                'document_type' => 'Business Permit',
                'document_name' => 'City Business Permit',
                'filename_prefix' => 'Business_Permit',
                'content' => "<h1>Business Permit</h1><p>This is a dummy Business Permit for <strong>{$school->name}</strong>.</p>",
            ],
            [
                'document_type' => 'Memorandum of Agreement',
                'document_name' => 'Signed MOA',
                'filename_prefix' => 'MOA',
                'content' => "<h1>MEMORANDUM OF AGREEMENT</h1><p>This agreement is made and entered into by and between:</p><p><strong>SCHOLARSHIP PROVIDER</strong></p><p>-and-</p><p><strong>{$school->name}</strong></p><p>Subject: Scholarship Program Partnership</p>",
            ],
            [
                'document_type' => 'Board Resolution',
                'document_name' => 'Board Resolution for Partnership',
                'filename_prefix' => 'Board_Res',
                'content' => "<h1>Board Resolution</h1><p>Board Resolution authorizing the partnership with the Scholarship Provider.</p><p>Approved by the Board of <strong>{$school->name}</strong>.</p>",
            ],
        ];

        foreach ($documents as $doc) {
            // Generate a dummy PDF file
            $fileName = $doc['filename_prefix'] . '_S' . $school->id . '.pdf';
            $filePath = 'partner_schools/documents/' . $fileName;

            // Generate PDF content directly without DomPDF to avoid timeout
            $content = $this->generateSimplePDF($school, $doc);

            // Ensure directory exists
            \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $content);

            // Determine status based on school verification status
            $status = $school->verification_status === 'verified' ? 'verified' : 'pending';
            $verifiedAt = $status === 'verified' ? $school->verification_date : null;
            $verifiedBy = $status === 'verified' ? 1 : null;
            $notes = null;

            \App\Models\PartnerSchoolVerificationDocument::create([
                'application_id' => null,
                'school_id' => $school->id,
                'document_type' => $doc['document_type'],
                'document_name' => $doc['document_name'],
                'file_name' => $fileName,
                'file_path' => $filePath,
                'file_size' => strlen($content),
                'mime_type' => 'application/pdf',
                'verification_status' => $status,
                'verification_notes' => $notes,
                'verified_by' => $verifiedBy,
                'verified_at' => $verifiedAt,
            ]);
        }
    }

    /**
     * Generate a simple PDF as fallback
     */
    private function generateSimplePDF($school, $doc): string
    {
        // Minimal PDF structure
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
/Length 250
>>
stream
BT
/F1 16 Tf
50 700 Td
({$doc['document_type']}) Tj
0 -30 Td
/F1 12 Tf
(School: {$school->name}) Tj
0 -20 Td
(Document: {$doc['document_name']}) Tj
0 -20 Td
(Generated: 2026-01-21) Tj
0 -20 Td
(This is a sample verification document.) Tj
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
616
%%EOF
PDF;
        return $content;
    }
}
