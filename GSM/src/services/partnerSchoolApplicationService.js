import { API_CONFIG } from '../config/api';

const SCHOLARSHIP_API_BASE_URL = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;

/**
 * Get authentication token from storage
 */
const getToken = () => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

/**
 * List applications with filters
 */
export const getApplications = async (filters = {}) => {
  try {
    const token = getToken();
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.school_id) queryParams.append('school_id', filters.school_id);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.per_page) queryParams.append('per_page', filters.per_page);
    if (filters.page) queryParams.append('page', filters.page);

    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications?${queryParams}`, {
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
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch applications');
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

/**
 * Get application details
 */
export const getApplication = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}`, {
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
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch application');
    }
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
};


/**
 * Create application manually
 */
export const createApplication = async (applicationData) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create application');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create application');
    }
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

/**
 * Update application
 */
export const updateApplication = async (id, applicationData) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update application');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update application');
    }
  } catch (error) {
    console.error('Error updating application:', error);
    throw error;
  }
};

/**
 * Create school account with temporary password (Method 1)
 */
export const createSchoolAccount = async (applicationId, accountData) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${applicationId}/create-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create account');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create account');
    }
  } catch (error) {
    console.error('Error creating school account:', error);
    throw error;
  }
};

/**
 * Submit application for review
 */
export const submitApplication = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit application');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to submit application');
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};

/**
 * Mark application as under review
 */
export const markAsUnderReview = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}/mark-under-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark as under review');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to mark as under review');
    }
  } catch (error) {
    console.error('Error marking as under review:', error);
    throw error;
  }
};

/**
 * Approve application
 */
export const approveApplication = async (id, notes = null) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve application');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to approve application');
    }
  } catch (error) {
    console.error('Error approving application:', error);
    throw error;
  }
};

/**
 * Reject application
 */
export const rejectApplication = async (id, reason) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject application');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to reject application');
    }
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw error;
  }
};

/**
 * Upload verification document
 */
export const uploadDocument = async (applicationId, file, documentType, documentName) => {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('document_name', documentName);

    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${applicationId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload document');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to upload document');
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Get application documents
 */
export const getDocuments = async (applicationId) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${applicationId}/documents`, {
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
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch documents');
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

/**
 * Verify document (admin only)
 */
export const verifyDocument = async (applicationId, documentId, status, notes = null) => {
  try {
    const token = getToken();
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${applicationId}/documents/${documentId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify document');
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to verify document');
    }
  } catch (error) {
    console.error('Error verifying document:', error);
    throw error;
  }
};

