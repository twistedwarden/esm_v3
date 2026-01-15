import { API_CONFIG } from '../config/api';

const SCHOLARSHIP_API_BASE_URL = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;

/**
 * Get authentication token from storage
 */
const getToken = () => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

/**
 * Get all active guidelines grouped by section
 */
export const getGuidelines = async () => {
  try {
    const token = getToken();
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists (for admin management)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch guidelines');
    }
  } catch (error) {
    console.error('Error fetching guidelines:', error);
    throw error;
  }
};

/**
 * Get specific guideline by ID
 */
export const getGuideline = async (id) => {
  try {
    const token = getToken();
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines/${id}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch guideline');
    }
  } catch (error) {
    console.error('Error fetching guideline:', error);
    throw error;
  }
};

/**
 * Create new guideline
 */
export const createGuideline = async (guidelineData) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guidelineData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create guideline');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create guideline');
    }
  } catch (error) {
    console.error('Error creating guideline:', error);
    throw error;
  }
};

/**
 * Update guideline
 */
export const updateGuideline = async (id, guidelineData) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guidelineData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update guideline');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update guideline');
    }
  } catch (error) {
    console.error('Error updating guideline:', error);
    throw error;
  }
};

/**
 * Delete guideline
 */
export const deleteGuideline = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete guideline');
    }

    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to delete guideline');
    }
  } catch (error) {
    console.error('Error deleting guideline:', error);
    throw error;
  }
};

/**
 * Toggle guideline active status
 */
export const toggleGuidelineActive = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/guidelines/${id}/toggle-active`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to toggle guideline status');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to toggle guideline status');
    }
  } catch (error) {
    console.error('Error toggling guideline status:', error);
    throw error;
  }
};
