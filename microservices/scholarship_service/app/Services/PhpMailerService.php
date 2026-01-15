<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Illuminate\Support\Facades\Log;

class PhpMailerService
{
    private $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->configureSmtp();
    }

    private function configureSmtp(): void
    {
        try {
            // SMTP Configuration
            $this->mailer->isSMTP();
            $this->mailer->Host = env('MAIL_HOST', 'smtp.gmail.com');
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = env('MAIL_USERNAME', 'gsph.esm@gmail.com');
            $this->mailer->Password = env('MAIL_PASSWORD');
            $this->mailer->SMTPSecure = env('MAIL_ENCRYPTION', 'tls');
            $this->mailer->Port = (int)env('MAIL_PORT', 587);
            $this->mailer->CharSet = 'UTF-8';

            // Sender
            $this->mailer->setFrom(
                env('MAIL_FROM_ADDRESS', 'gsph.esm@gmail.com'),
                env('MAIL_FROM_NAME', 'GoServePH Partner School')
            );
        } catch (Exception $e) {
            Log::error('PHPMailer configuration error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send account credentials email
     */
    public function sendAccountCredentialsEmail(
        string $recipientEmail,
        string $recipientName,
        string $temporaryPassword,
        string $resetLink
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($recipientEmail, $recipientName);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Your Partner School Account Credentials - GoServePH';

            $htmlContent = view('emails.partner-school.account-credentials', [
                'name' => $recipientName,
                'temporaryPassword' => $temporaryPassword,
                'resetLink' => $resetLink,
                'loginUrl' => env('APP_URL', 'http://localhost:3000') . '/login',
            ])->render();

            $this->mailer->Body = $htmlContent;
            $this->mailer->AltBody = strip_tags($htmlContent);

            $this->mailer->send();

            Log::info('Account credentials email sent', ['recipient' => $recipientEmail]);
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send account credentials email: ' . $this->mailer->ErrorInfo);
            return false;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(
        string $recipientEmail,
        string $recipientName,
        string $resetLink
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($recipientEmail, $recipientName);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Password Reset Request - GoServePH';

            $htmlContent = view('emails.partner-school.password-reset', [
                'name' => $recipientName,
                'resetLink' => $resetLink,
            ])->render();

            $this->mailer->Body = $htmlContent;
            $this->mailer->AltBody = strip_tags($htmlContent);

            $this->mailer->send();

            Log::info('Password reset email sent', ['recipient' => $recipientEmail]);
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send password reset email: ' . $this->mailer->ErrorInfo);
            return false;
        }
    }

    /**
     * Send application status email
     */
    public function sendApplicationStatusEmail(
        string $recipientEmail,
        string $recipientName,
        string $status,
        string $message
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($recipientEmail, $recipientName);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Partner School Application Status Update - GoServePH';

            $template = $status === 'approved' 
                ? 'emails.partner-school.application-approved'
                : 'emails.partner-school.application-rejected';

            $htmlContent = view($template, [
                'name' => $recipientName,
                'status' => $status,
                'message' => $message,
            ])->render();

            $this->mailer->Body = $htmlContent;
            $this->mailer->AltBody = strip_tags($htmlContent);

            $this->mailer->send();

            Log::info('Application status email sent', [
                'recipient' => $recipientEmail,
                'status' => $status
            ]);
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send application status email: ' . $this->mailer->ErrorInfo);
            return false;
        }
    }

    /**
     * Generic email sending method
     */
    public function sendNotificationEmail(
        string $recipientEmail,
        string $recipientName,
        string $subject,
        string $htmlContent
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($recipientEmail, $recipientName);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlContent;
            $this->mailer->AltBody = strip_tags($htmlContent);

            $this->mailer->send();

            Log::info('Notification email sent', ['recipient' => $recipientEmail]);
            return true;
        } catch (Exception $e) {
            Log::error('Failed to send notification email: ' . $this->mailer->ErrorInfo);
            return false;
        }
    }
}
