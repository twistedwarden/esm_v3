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
}
