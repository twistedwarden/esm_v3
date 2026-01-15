import { API_CONFIG } from '../config/api';

const AUTH_API_BASE_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;

/**
 * Get authentication token from storage
 */
const getToken = () => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

/**
 * Check if password reset is required
 */
export const checkPasswordResetRequired = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${AUTH_API_BASE_URL}/api/partner-school/check-password-reset-required`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data.password_reset_required;
    } else {
      throw new Error(data.message || 'Failed to check password reset requirement');
    }
  } catch (error) {
    console.error('Error checking password reset requirement:', error);
    throw error;
  }
};

/**
 * Reset password using token (public endpoint)
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/api/partner-school/reset-password`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Force password reset on first login (authenticated)
 */
export const forcePasswordReset = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const token = getToken();
    const response = await fetch(`${AUTH_API_BASE_URL}/api/partner-school/force-password-reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch (error) {
    console.error('Error forcing password reset:', error);
    throw error;
  }
};
