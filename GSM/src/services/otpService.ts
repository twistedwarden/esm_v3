// OTP Service for handling One-Time Password generation and validation
import { brevoService } from './brevoService';

interface OtpData {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

interface OtpValidationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

class OtpService {
  private otpStorage: Map<string, OtpData> = new Map();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RESEND_COOLDOWN_MINUTES = 1;

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate OTP and send via email
   */
  async generateAndSendOtp(
    email: string,
    recipientName: string = 'User'
  ): Promise<{ success: boolean; message: string; otpCode?: string }> {
    try {
      // Check if there's an existing OTP for this email
      const existingOtp = this.otpStorage.get(email);
      if (existingOtp && existingOtp.expiresAt > new Date()) {
        const timeRemaining = Math.ceil((existingOtp.expiresAt.getTime() - new Date().getTime()) / 1000 / 60);
        return {
          success: false,
          message: `Please wait ${timeRemaining} minute(s) before requesting a new OTP.`
        };
      }

      // Generate new OTP
      const otpCode = this.generateOtpCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Store OTP data
      const otpData: OtpData = {
        code: otpCode,
        email,
        expiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS
      };

      this.otpStorage.set(email, otpData);

      // Send OTP via Brevo
      const emailResult = await brevoService.sendOtpEmail(
        email,
        recipientName,
        otpCode,
        this.OTP_EXPIRY_MINUTES
      );

      if (!emailResult.success) {
        this.otpStorage.delete(email);
        return {
          success: false,
          message: `Failed to send OTP email: ${emailResult.error}`
        };
      }

      // Clean up expired OTPs
      this.cleanupExpiredOtps();

      return {
        success: true,
        message: `OTP sent successfully to ${email}`,
        otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined // Only show in development
      };

    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        message: 'Failed to generate and send OTP. Please try again.'
      };
    }
  }

  /**
   * Validate OTP code
   */
  validateOtp(email: string, inputCode: string): OtpValidationResult {
    try {
      const otpData = this.otpStorage.get(email);

      if (!otpData) {
        return {
          success: false,
          message: 'No OTP found for this email. Please request a new OTP.'
        };
      }

      // Check if OTP has expired
      if (otpData.expiresAt <= new Date()) {
        this.otpStorage.delete(email);
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= otpData.maxAttempts) {
        this.otpStorage.delete(email);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      // Increment attempts
      otpData.attempts++;

      // Validate OTP code
      if (otpData.code !== inputCode) {
        const remainingAttempts = otpData.maxAttempts - otpData.attempts;
        
        if (remainingAttempts <= 0) {
          this.otpStorage.delete(email);
          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.'
          };
        }

        return {
          success: false,
          message: `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
          remainingAttempts
        };
      }

      // OTP is valid - remove it from storage
      this.otpStorage.delete(email);

      return {
        success: true,
        message: 'OTP verified successfully!'
      };

    } catch (error) {
      console.error('OTP validation error:', error);
      return {
        success: false,
        message: 'Failed to validate OTP. Please try again.'
      };
    }
  }

  /**
   * Resend OTP (with cooldown protection)
   */
  async resendOtp(
    email: string,
    recipientName: string = 'User'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existingOtp = this.otpStorage.get(email);
      
      if (existingOtp) {
        const timeSinceLastOtp = new Date().getTime() - (existingOtp.expiresAt.getTime() - (this.OTP_EXPIRY_MINUTES * 60 * 1000));
        const cooldownMs = this.RESEND_COOLDOWN_MINUTES * 60 * 1000;
        
        if (timeSinceLastOtp < cooldownMs) {
          const remainingTime = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
          return {
            success: false,
            message: `Please wait ${remainingTime} second(s) before requesting a new OTP.`
          };
        }
      }

      // Generate and send new OTP
      return await this.generateAndSendOtp(email, recipientName);

    } catch (error) {
      console.error('OTP resend error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      };
    }
  }

  /**
   * Get OTP status for an email
   */
  getOtpStatus(email: string): {
    exists: boolean;
    expiresAt?: Date;
    attempts?: number;
    maxAttempts?: number;
    timeRemaining?: number;
  } {
    const otpData = this.otpStorage.get(email);
    
    if (!otpData) {
      return { exists: false };
    }

    const timeRemaining = Math.max(0, Math.ceil((otpData.expiresAt.getTime() - new Date().getTime()) / 1000));

    return {
      exists: true,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      timeRemaining
    };
  }

  /**
   * Clean up expired OTPs
   */
  private cleanupExpiredOtps(): void {
    const now = new Date();
    for (const [email, otpData] of this.otpStorage.entries()) {
      if (otpData.expiresAt <= now) {
        this.otpStorage.delete(email);
      }
    }
  }

  /**
   * Clear all OTPs for an email
   */
  clearOtp(email: string): void {
    this.otpStorage.delete(email);
  }

  /**
   * Clear all OTPs
   */
  clearAllOtps(): void {
    this.otpStorage.clear();
  }

  /**
   * Get statistics about stored OTPs
   */
  getStats(): {
    totalOtps: number;
    activeOtps: number;
    expiredOtps: number;
  } {
    const now = new Date();
    let activeOtps = 0;
    let expiredOtps = 0;

    for (const otpData of this.otpStorage.values()) {
      if (otpData.expiresAt > now) {
        activeOtps++;
      } else {
        expiredOtps++;
      }
    }

    return {
      totalOtps: this.otpStorage.size,
      activeOtps,
      expiredOtps
    };
  }
}

// Export singleton instance
export const otpService = new OtpService();

export default OtpService;
