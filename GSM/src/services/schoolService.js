import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;

/**
 * School Management Service
 * Handles all school-related API operations
 */

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Make authenticated API request
 */
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      // For validation errors, include the detailed errors
      if (response.status === 422 && data.errors) {
        const errorMessages = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // For server errors, include more details
      if (response.status >= 500) {
        const errorDetails = data.error || data.message || 'Internal server error';
        throw new Error(`Server error (${response.status}): ${errorDetails}`);
      }
      
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get all schools with optional filters
 */
export const getSchools = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/api/schools${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await makeAuthenticatedRequest(endpoint);
    
    return response;
  } catch (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }
};

/**
 * Get a specific school by ID
 */
export const getSchoolById = async (schoolId) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/schools/${schoolId}`);
    return response;
  } catch (error) {
    console.error('Error fetching school:', error);
    throw error;
  }
};

/**
 * Create a new school
 */
export const createSchool = async (schoolData) => {
  try {
    const response = await makeAuthenticatedRequest('/api/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData)
    });
    return response;
  } catch (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};

/**
 * Update an existing school
 */
export const updateSchool = async (schoolId, schoolData) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/schools/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify(schoolData)
    });
    return response;
  } catch (error) {
    console.error('Error updating school:', error);
    throw error;
  }
};

/**
 * Delete a school
 */
export const deleteSchool = async (schoolId) => {
  try {
    const response = await makeAuthenticatedRequest(`/api/schools/${schoolId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting school:', error);
    throw error;
  }
};

/**
 * Get school classifications (enum values)
 */
export const getSchoolClassifications = () => {
  return [
    'LOCAL UNIVERSITY/COLLEGE (LUC)',
    'STATE UNIVERSITY/COLLEGE (SUC)',
    'PRIVATE UNIVERSITY/COLLEGE',
    'TECHNICAL/VOCATIONAL INSTITUTE',
    'OTHER'
  ];
};

/**
 * Validate school data before submission
 */
export const validateSchoolData = (schoolData) => {
  const errors = {};

  // Required fields
  if (!schoolData.name || schoolData.name.trim() === '') {
    errors.name = 'School name is required';
  }

  if (!schoolData.classification) {
    errors.classification = 'School classification is required';
  }

  // Email validation
  if (schoolData.email && schoolData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(schoolData.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Website validation
  if (schoolData.website && schoolData.website.trim() !== '') {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(schoolData.website)) {
      errors.website = 'Please enter a valid website URL (must start with http:// or https://)';
    }
  }

  // Phone validation
  if (schoolData.contact_number && schoolData.contact_number.trim() !== '') {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(schoolData.contact_number)) {
      errors.contact_number = 'Please enter a valid phone number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolClassifications,
  validateSchoolData
};

