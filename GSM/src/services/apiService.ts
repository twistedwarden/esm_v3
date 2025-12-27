// API Service for handling OTP and authentication operations
import { otpService } from './otpService';
import { envConfig } from '../config/environment';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface OtpRequest {
  email: string;
  recipientName?: string;
}

interface OtpVerification {
  email: string;
  otp_code: string;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  birthdate: string;
  regEmail: string;
  mobile: string;
  address: string;
  houseNumber: string;
  street: string;
  barangay: string;
  regPassword: string;
  confirmPassword: string;
  noMiddleName?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = envConfig.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send OTP to email
   */
  async sendOtp(email: string, recipientName?: string): Promise<ApiResponse> {
    try {
      const result = await otpService.generateAndSendOtp(email, recipientName);
      
      return {
        success: result.success,
        message: result.message,
        data: result.otpCode ? { otpCode: result.otpCode } : undefined
      };
    } catch (error) {
      console.error('Send OTP API error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.'
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, otpCode: string): Promise<ApiResponse> {
    try {
      const result = otpService.validateOtp(email, otpCode);
      
      return {
        success: result.success,
        message: result.message,
        data: {
          remainingAttempts: result.remainingAttempts
        }
      };
    } catch (error) {
      console.error('Verify OTP API error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string, recipientName?: string): Promise<ApiResponse> {
    try {
      const result = await otpService.resendOtp(email, recipientName);
      
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Resend OTP API error:', error);
      return {
        success: false,
        error: 'Failed to resend OTP. Please try again.'
      };
    }
  }

  /**
   * Get OTP status
   */
  async getOtpStatus(email: string): Promise<ApiResponse> {
    try {
      const status = otpService.getOtpStatus(email);
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      console.error('Get OTP status API error:', error);
      return {
        success: false,
        error: 'Failed to get OTP status.'
      };
    }
  }

  /**
   * Register new user
   */
  async registerUser(userData: RegistrationData): Promise<ApiResponse> {
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'birthdate', 'regEmail', 'mobile', 'address', 'houseNumber', 'street', 'barangay', 'regPassword', 'confirmPassword'];
      const missingFields = requiredFields.filter(field => !userData[field as keyof RegistrationData]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userData.regEmail)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      // Validate mobile number format
      const mobileRegex = /^09[0-9]{9}$/;
      if (!mobileRegex.test(userData.mobile)) {
        return {
          success: false,
          error: 'Mobile number must be in format 09XXXXXXXXX (11 digits starting with 09)'
        };
      }

      // Validate password match
      if (userData.regPassword !== userData.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match'
        };
      }

      // Validate birthdate
      const today = new Date().toISOString().split('T')[0];
      if (userData.birthdate >= today) {
        return {
          success: false,
          error: 'Birthdate must be before today'
        };
      }

      // Make API call to backend
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Registration failed'
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email for OTP verification.',
        data: result
      };

    } catch (error) {
      console.error('Registration API error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Login user
   */
  async loginUser(email: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Login failed'
        };
      }

      return {
        success: true,
        message: 'Login successful!',
        data: result
      };

    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Google OAuth login
   */
  async googleLogin(authCode: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: authCode })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Google login failed'
        };
      }

      return {
        success: true,
        message: 'Google login successful!',
        data: result
      };

    } catch (error) {
      console.error('Google login API error:', error);
      return {
        success: false,
        error: 'Google login failed. Please try again.'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to send password reset email'
        };
      }

      return {
        success: true,
        message: 'Password reset email sent successfully!',
        data: result
      };

    } catch (error) {
      console.error('Password reset API error:', error);
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Password reset failed'
        };
      }

      return {
        success: true,
        message: 'Password reset successfully!',
        data: result
      };

    } catch (error) {
      console.error('Password reset API error:', error);
      return {
        success: false,
        error: 'Password reset failed. Please try again.'
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No authentication token found'
        };
      }

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to get user profile'
        };
      }

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('Get profile API error:', error);
      return {
        success: false,
        error: 'Failed to get user profile. Please try again.'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          error: 'No authentication token found'
        };
      }

      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Failed to update profile'
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully!',
        data: result
      };

    } catch (error) {
      console.error('Update profile API error:', error);
      return {
        success: false,
        error: 'Failed to update profile. Please try again.'
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

export default ApiService;
