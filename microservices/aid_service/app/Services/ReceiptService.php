<?php

namespace App\Services;

use App\Models\AidDisbursement;
use App\Models\ScholarshipApplication;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReceiptService
{
    /**
     * Generate a receipt PDF for a disbursement
     */
    public function generateReceipt(AidDisbursement $disbursement, ScholarshipApplication $application, PaymentTransaction $transaction): ?string
    {
        try {
            // Load relationships
            $application->load(['student', 'school', 'category', 'subcategory']);
            $student = $application->student;
            $school = $application->school;

            // Generate receipt HTML
            $html = $this->generateReceiptHtml($disbursement, $application, $transaction, $student, $school);

            // Generate filename
            $filename = 'receipt_' . ($disbursement->disbursement_reference_number ?? $disbursement->application_number) . '_' . time() . '.pdf';
            $path = 'receipts/' . $filename;

            // Generate PDF using dompdf
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');

            // Store PDF
            Storage::disk('public')->put($path, $pdf->output());

            // Return the public path
            return '/storage/' . $path;

        } catch (\Exception $e) {
            Log::error('Failed to generate receipt', [
                'disbursement_id' => $disbursement->id ?? null,
                'application_id' => $application->id ?? null,
                'transaction_id' => $transaction->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Generate HTML receipt content
     */
    private function generateReceiptHtml(
        AidDisbursement $disbursement,
        ScholarshipApplication $application,
        PaymentTransaction $transaction,
        $student,
        $school
    ): string {
        $receiptNumber = $disbursement->disbursement_reference_number ?: $disbursement->application_number;
        $date = $disbursement->disbursed_at ? $disbursement->disbursed_at->format('F d, Y') : now()->format('F d, Y');
        $time = $disbursement->disbursed_at ? $disbursement->disbursed_at->format('h:i A') : now()->format('h:i A');

        $studentName = $student ? ($student->full_name ?? trim(($student->first_name ?? '') . ' ' . ($student->middle_name ?? '') . ' ' . ($student->last_name ?? ''))) : 'N/A';
        $schoolName = $school ? ($school->name ?? 'N/A') : 'N/A';
        $amount = number_format((float) $disbursement->amount, 2);
        $provider = $disbursement->payment_provider_name ?? 'PayMongo';
        $transactionId = $disbursement->provider_transaction_id ?? $transaction->provider_transaction_id ?? 'N/A';
        $accountNumber = $disbursement->account_number ?? $application->wallet_account_number ?? 'N/A';
        $categoryName = ($application->category && isset($application->category->name)) ? $application->category->name : 'N/A';
        $disbursementMethod = $disbursement->disbursement_method ?? 'Digital Wallet';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - {$receiptNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .info-section {
            flex: 1;
        }
        .info-section h3 {
            color: #2563eb;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .info-section p {
            color: #333;
            font-size: 14px;
            margin: 5px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 14px;
        }
        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        .details-table tr:last-child td {
            border-bottom: none;
        }
        .amount-section {
            text-align: right;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }
        .amount-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 32px;
            color: #2563eb;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #10b981;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>PAYMENT RECEIPT</h1>
            <p>Scholarship Grant Disbursement</p>
        </div>

        <div class="receipt-info">
            <div class="info-section">
                <h3>Receipt Information</h3>
                <p><strong>Receipt Number:</strong> {$receiptNumber}</p>
                <p><strong>Date:</strong> {$date}</p>
                <p><strong>Time:</strong> {$time}</p>
                <p><strong>Status:</strong> <span class="status-badge">PAID</span></p>
            </div>
            <div class="info-section">
                <h3>Payment Details</h3>
                <p><strong>Payment Method:</strong> {$provider}</p>
                <p><strong>Transaction ID:</strong> {$transactionId}</p>
                <p><strong>Application #:</strong> {$application->application_number}</p>
            </div>
        </div>

        <table class="details-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Student Name</strong></td>
                    <td>{$studentName}</td>
                </tr>
                <tr>
                    <td><strong>School</strong></td>
                    <td>{$schoolName}</td>
                </tr>
                <tr>
                    <td><strong>Scholarship Type</strong></td>
                    <td>{$categoryName}</td>
                </tr>
                <tr>
                    <td><strong>Disbursement Method</strong></td>
                    <td>{$disbursementMethod}</td>
                </tr>
                <tr>
                    <td><strong>Account Number</strong></td>
                    <td>{$accountNumber}</td>
                </tr>
            </tbody>
        </table>

        <div class="amount-section">
            <div class="amount-label">Total Amount Disbursed</div>
            <div class="amount-value">₱ {$amount}</div>
        </div>

        <div class="footer">
            <p>This is an official receipt for the scholarship grant disbursement.</p>
            <p>Generated on {$date} at {$time}</p>
            <p style="margin-top: 20px;">For inquiries, please contact the Scholarship Office.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
