// Brevo Email Service for OTP functionality
// Based on Brevo API documentation: https://app.brevo.com/settings/keys/api
import { envConfig } from '../config/environment';

interface BrevoEmailData {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender: {
    name: string;
    email: string;
  };
}

interface BrevoResponse {
  messageId: string;
}

class BrevoService {
  private apiKey: string;
  private baseUrl: string = 'https://api.brevo.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Send OTP email using Brevo API
   */
  async sendOtpEmail(
    recipientEmail: string,
    recipientName: string,
    otpCode: string,
    expiryMinutes: number = 5
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

      const emailData: BrevoEmailData = {
        to: [{ email: recipientEmail, name: recipientName }],
        subject: 'GoServePH - Your OTP Verification Code',
        htmlContent: this.generateOtpEmailTemplate(otpCode, expiryMinutes),
        textContent: this.generateOtpTextContent(otpCode, expiryMinutes),
        sender: {
          name: 'ESM',
          email: 'jheyjheypogi30@gmail.com'
        }
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${errorData.message || 'Unknown error'}`);
      }

      const result: BrevoResponse = await response.json();
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Brevo OTP email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP email'
      };
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailData: BrevoEmailData = {
        to: [{ email: recipientEmail, name: recipientName }],
        subject: 'Welcome to GoServePH!',
        htmlContent: this.generateWelcomeEmailTemplate(recipientName),
        textContent: this.generateWelcomeTextContent(recipientName),
        sender: {
          name: 'ESM',
          email: 'jheyjheypogi30@gmail.com'
        }
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${errorData.message || 'Unknown error'}`);
      }

      const result: BrevoResponse = await response.json();
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Brevo welcome email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send welcome email'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetToken: string,
    expiryMinutes: number = 30
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
      
      const emailData: BrevoEmailData = {
        to: [{ email: recipientEmail, name: recipientName }],
        subject: 'GoServePH - Password Reset Request',
        htmlContent: this.generatePasswordResetEmailTemplate(recipientName, resetUrl, expiryMinutes),
        textContent: this.generatePasswordResetTextContent(recipientName, resetUrl, expiryMinutes),
        sender: {
          name: 'GoServePH',
          email: 'security@goserveph.com'
        }
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API error: ${errorData.message || 'Unknown error'}`);
      }

      const result: BrevoResponse = await response.json();
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Brevo password reset email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email'
      };
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  private generateOtpEmailTemplate(otpCode: string, expiryMinutes: number): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 OTP Verification</h1>
            <p>Your GoServePH account verification code</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>You have requested to verify your GoServePH account. Please use the following One-Time Password (OTP) to complete your verification:</p>
            
            <div class="otp-code">${otpCode}</div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This code will expire in <strong>${expiryMinutes} minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>GoServePH will never ask for your OTP via phone or email</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you're having trouble with the code, you can request a new one from the verification page.</p>
            
            <p>Thank you for choosing GoServePH!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GoServePH. Please do not reply to this email.</p>
            <p>© 2024 GoServePH. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text content for OTP email
   */
  private generateOtpTextContent(otpCode: string, expiryMinutes: number): string {
    return `
OTP Verification - GoServePH

Hello!

You have requested to verify your GoServePH account. Please use the following One-Time Password (OTP) to complete your verification:

OTP Code: ${otpCode}

IMPORTANT SECURITY INFORMATION:
- This code will expire in ${expiryMinutes} minutes
- Never share this code with anyone
- GoServePH will never ask for your OTP via phone or email
- If you didn't request this code, please ignore this email

If you're having trouble with the code, you can request a new one from the verification page.

Thank you for choosing GoServePH!

---
This is an automated message from GoServePH. Please do not reply to this email.
© 2024 GoServePH. All rights reserved.
    `;
  }

  /**
   * Generate HTML email template for welcome email
   */
  private generateWelcomeEmailTemplate(recipientName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GoServePH</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: #fff; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to GoServePH!</h1>
            <p>Your account has been successfully verified</p>
          </div>
          <div class="content">
            <h2>Hello ${recipientName}!</h2>
            <p>Congratulations! Your GoServePH account has been successfully created and verified. You now have access to all our government services management features.</p>
            
            <h3>What you can do with GoServePH:</h3>
            <div class="feature">
              <strong>📋 Service Management</strong><br>
              Manage and track government services efficiently
            </div>
            <div class="feature">
              <strong>📊 Analytics Dashboard</strong><br>
              Monitor performance and generate reports
            </div>
            <div class="feature">
              <strong>👥 User Management</strong><br>
              Manage your team and access permissions
            </div>
            <div class="feature">
              <strong>🔒 Secure Access</strong><br>
              Enterprise-grade security for your data
            </div>
            
            <p>Ready to get started? <a href="${window.location.origin}/portal" style="color: #667eea; text-decoration: none;">Access your dashboard now</a></p>
            
            <p>If you have any questions, our support team is here to help at support@goserveph.com</p>
            
            <p>Thank you for choosing GoServePH!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GoServePH. Please do not reply to this email.</p>
            <p>© 2024 GoServePH. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text content for welcome email
   */
  private generateWelcomeTextContent(recipientName: string): string {
    return `
Welcome to GoServePH!

Hello ${recipientName}!

Congratulations! Your GoServePH account has been successfully created and verified. You now have access to all our government services management features.

What you can do with GoServePH:
- Service Management: Manage and track government services efficiently
- Analytics Dashboard: Monitor performance and generate reports
- User Management: Manage your team and access permissions
- Secure Access: Enterprise-grade security for your data

Ready to get started? Access your dashboard at: ${window.location.origin}/portal

If you have any questions, our support team is here to help at support@goserveph.com

Thank you for choosing GoServePH!

---
This is an automated message from GoServePH. Please do not reply to this email.
© 2024 GoServePH. All rights reserved.
    `;
  }

  /**
   * Generate HTML email template for password reset
   */
  private generatePasswordResetEmailTemplate(recipientName: string, resetUrl: string, expiryMinutes: number): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reset-button { background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p>Secure your GoServePH account</p>
          </div>
          <div class="content">
            <h2>Hello ${recipientName}!</h2>
            <p>We received a request to reset your GoServePH account password. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>${expiryMinutes} minutes</strong></li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
                <li>For security, this link can only be used once</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            
            <p>If you have any questions, contact our support team at support@goserveph.com</p>
          </div>
          <div class="footer">
            <p>This is an automated message from GoServePH. Please do not reply to this email.</p>
            <p>© 2024 GoServePH. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text content for password reset email
   */
  private generatePasswordResetTextContent(recipientName: string, resetUrl: string, expiryMinutes: number): string {
    return `
Password Reset Request - GoServePH

Hello ${recipientName}!

We received a request to reset your GoServePH account password. If you made this request, use the link below to reset your password:

${resetUrl}

SECURITY INFORMATION:
- This link will expire in ${expiryMinutes} minutes
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one
- For security, this link can only be used once

If you have any questions, contact our support team at support@goserveph.com

---
This is an automated message from GoServePH. Please do not reply to this email.
© 2024 GoServePH. All rights reserved.
    `;
  }
}

// Export singleton instance
export const brevoService = new BrevoService(envConfig.brevoApiKey);

export default BrevoService;
