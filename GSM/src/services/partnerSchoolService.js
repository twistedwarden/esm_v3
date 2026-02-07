import { API_CONFIG } from '../config/api';

const AUTH_API_BASE_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;
const SCHOLARSHIP_API_BASE_URL = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;

/**
 * Fetch school information for the current partner school representative
 */
export const fetchPartnerSchoolInfo = async (token) => {
  try {
    // First, get the current user's assigned school from auth service
    const userResponse = await fetch(`${AUTH_API_BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    if (!userData.success || !userData.data?.user?.assigned_school_id) {
      throw new Error('No school assigned to this user');
    }

    // Fetch the assigned school details from scholarship service
    const schoolResponse = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/schools/${userData.data.user.assigned_school_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!schoolResponse.ok) {
      throw new Error(`HTTP error! status: ${schoolResponse.status}`);
    }

    const schoolData = await schoolResponse.json();

    if (schoolData.success) {
      return {
        school: schoolData.data,
        user: userData.data.user
      };
    } else {
      throw new Error(schoolData.message || 'Failed to fetch school info');
    }
  } catch (error) {
    console.error('Error fetching partner school info:', error);
    throw error;
  }
};

/**
 * Fetch statistics for the partner school
 */
export const fetchPartnerSchoolStats = async (token) => {
  try {
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/stats`, {
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
      throw new Error(data.message || 'Failed to fetch school stats');
    }
  } catch (error) {
    console.error('Error fetching partner school stats:', error);
    throw error;
  }
};

/**
 * Fetch students for the partner school
 */
export const fetchPartnerSchoolStudents = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/students?${queryParams}`, {
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
      throw new Error(data.message || 'Failed to fetch students');
    }
  } catch (error) {
    console.error('Error fetching partner school students:', error);
    throw error;
  }
};


/**
 * Upload enrollment data CSV
 */
export const uploadEnrollmentData = async (token, csvData, updateMode = 'merge') => {
  try {
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/enrollment/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csv_data: csvData,
        update_mode: updateMode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to upload enrollment data');
    }
  } catch (error) {
    console.error('Error uploading enrollment data:', error);
    throw error;
  }
};

/**
 * Fetch enrollment data for the partner school
 */
export const fetchEnrollmentData = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/enrollment/data?${queryParams}`, {
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
      throw new Error(data.message || 'Failed to fetch enrollment data');
    }
  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    throw error;
  }
};

// Flexible data upload (accepts any CSV structure)
export const uploadFlexibleData = async (token, csvData, headers, updateMode = 'merge') => {
  try {
    console.log('uploadFlexibleData called with:', { token, csvDataLength: csvData.length, headers, updateMode });
    console.log('SCHOLARSHIP_API_BASE_URL:', SCHOLARSHIP_API_BASE_URL);

    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/flexible/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        csv_data: csvData,
        headers: headers,
        update_mode: updateMode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Upload response:', data);

    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading flexible data:', error);
    throw error;
  }
};

// Fetch flexible students data
export const fetchFlexibleStudents = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    queryParams.append('per_page', params.per_page || 1000); // Request up to 1000 records
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/flexible/students?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch flexible students');
    }
  } catch (error) {
    console.error('Error fetching flexible students:', error);
    throw error;
  }
};

// Match headers using AI (or Smart Matching Service)
export const matchHeaders = async (token, headers) => {
  try {
    const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/match-headers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ headers })
    });

    if (!response.ok) {
      // If service is down or error, fallback gracefully (throw error to be caught)
      const errorText = await response.text();
      console.warn('Match headers service warning:', errorText);
      throw new Error(`Service returned ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data; // Returns a map { "Header": "field" }
    } else {
      throw new Error(data.message || 'Failed to match headers');
    }
  } catch (error) {
    console.warn('Error matching headers via service (will use local fallback):', error);
    return null; // Return null to indicate fallback should be used
  }
};
