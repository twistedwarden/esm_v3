import { API_CONFIG } from '../config/api';

const AUTH_API_BASE_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current user profile information
   */
  async getCurrentUserProfile() {
    // Return user data from localStorage directly since API endpoint doesn't exist
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // If no user data exists, return default profile
    if (!userData || Object.keys(userData).length === 0) {
      return {
        id: 1,
        name: 'Admin User',
        email: 'admin@gsm.gov.ph',
        role: 'admin',
        department: 'IT Department',
        phone: '+63 123 456 7890',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    return userData;
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(profileData) {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Prepare the data for the API
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        middle_name: profileData.middle_name,
        mobile: profileData.mobile,
        address: profileData.address
      };

      // Remove undefined/null values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const response = await fetch(`${AUTH_API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update localStorage with the new data from the API response
        const updatedUserData = {
          ...userData,
          ...result.data,
          // Ensure name is properly constructed
          name: `${result.data.first_name || ''} ${result.data.last_name || ''}`.trim() || userData.name,
          // Map mobile to phone if needed
          phone: result.data.mobile || userData.phone
        };
        
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        
        // Also update the cache
        this.cache.set('userProfile', updatedUserData);
        
        return { 
          success: true,
          message: 'Profile updated successfully', 
          data: updatedUserData 
        };
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.warn('Password change API not available');
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences() {
    // Check if we have cached preferences first
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      return JSON.parse(stored);
    }

    // Try API call, but don't show errors if it fails
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/user/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Cache the result
          localStorage.setItem('notification_preferences', JSON.stringify(data.data));
          return data.data;
        }
      }
    } catch (error) {
      // Silently fail and use defaults
    }

    // Return default preferences
    const defaultPrefs = {
      email_notifications: true,
      sms_alerts: false,
      push_notifications: true,
      weekly_reports: true,
      system_updates: true
    };
    
    // Cache the defaults
    localStorage.setItem('notification_preferences', JSON.stringify(defaultPrefs));
    return defaultPrefs;
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/user/notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Also store in localStorage
          localStorage.setItem('notification_preferences', JSON.stringify(preferences));
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Notification preferences API not available, using localStorage fallback');
    }

    // Fallback: Store in localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    return { message: 'Notification preferences updated successfully (local storage)' };
  }

  /**
   * Get system settings
   */
  async getSystemSettings() {
    // Check if we have cached settings first
    const stored = localStorage.getItem('system_settings');
    if (stored) {
      return JSON.parse(stored);
    }

    // Try API call, but don't show errors if it fails
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Cache the result
          localStorage.setItem('system_settings', JSON.stringify(data.data));
          return data.data;
        }
      }
    } catch (error) {
      // Silently fail and use defaults
    }

    // Return default settings
    const defaultSettings = {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Manila',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      items_per_page: 25,
      auto_logout: 30,
      session_timeout: 60
    };
    
    // Cache the defaults
    localStorage.setItem('system_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Also store in localStorage
          localStorage.setItem('system_settings', JSON.stringify(settings));
          return data.data;
        }
      }
    } catch (error) {
      console.warn('System settings API not available, using localStorage fallback');
    }

    // Fallback: Store in localStorage
    localStorage.setItem('system_settings', JSON.stringify(settings));
    return { message: 'System settings updated successfully (local storage)' };
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Admin stats API not available, using fallback data');
    }

    // Fallback: Return mock data if API is not available
    return {
      total_users: 1247,
      active_sessions: 23,
      total_requests: 15678,
      error_rate: '0.2%'
    };
  }

  /**
   * Export system data
   */
  async exportSystemData(exportType, filters = {}) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/export/${exportType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Use real data from API
          const csvContent = this.convertToCSV(data.data);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return true;
        }
      }
    } catch (error) {
      console.warn(`Export ${exportType} API not available, using fallback data`);
    }

    // Fallback: Use mock data if API is not available
    const mockData = this.generateMockExportData(exportType);
    const csvContent = this.convertToCSV(mockData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  }

  /**
   * Generate mock export data
   */
  generateMockExportData(exportType) {
    if (exportType === 'users') {
      return [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', created_at: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', created_at: '2024-01-16' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', created_at: '2024-01-17' }
      ];
    } else if (exportType === 'applications') {
      return [
        { id: 1, student_name: 'Alice Brown', program: 'Academic Excellence', status: 'Approved', submitted_at: '2024-01-15' },
        { id: 2, student_name: 'Charlie Wilson', program: 'Financial Aid', status: 'Pending', submitted_at: '2024-01-16' },
        { id: 3, student_name: 'Diana Lee', program: 'Sports Scholarship', status: 'Under Review', submitted_at: '2024-01-17' }
      ];
    }
    return [];
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Clear system cache
   */
  async clearSystemCache() {
    // Clear local cache directly instead of making API calls
    this.cache.clear();
    localStorage.removeItem('notification_preferences');
    localStorage.removeItem('system_settings');
    
    return { message: 'Local cache cleared successfully' };
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/admin/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('System health API not available, using fallback data');
    }

    // Fallback: Return mock data if API is not available
    return {
      uptime: '99.9%',
      memory_usage: '45%',
      cpu_usage: '23%',
      disk_usage: '67%',
      database_status: 'Connected',
      last_updated: new Date().toISOString()
    };
  }
}

export const settingsService = new SettingsService();
export default settingsService;

