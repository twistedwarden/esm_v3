import axios from 'axios';
import { getScholarshipServiceUrl, API_CONFIG } from '../config/api';

class StudentApiService {
  constructor() {
    this.baseURL = getScholarshipServiceUrl('/api');
  }

  /**
   * Get students with filters and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Students data with pagination
   */
  async getStudents(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${this.baseURL}/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  /**
   * Get student by UUID
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Student profile
   */
  async getStudentByUUID(uuid) {
    try {
      const response = await axios.get(`${this.baseURL}/students/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  /**
   * Create a new student
   * @param {Object} data - Student data
   * @returns {Promise<Object>} - Created student
   */
  async createStudent(data) {
    try {
      const response = await axios.post(`${this.baseURL}/students`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  /**
   * Update student profile
   * @param {string} uuid - Student UUID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated student
   */
  async updateStudent(uuid, data) {
    try {
      const response = await axios.put(`${this.baseURL}/students/${uuid}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  /**
   * Soft delete student
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteStudent(uuid) {
    try {
      const response = await axios.delete(`${this.baseURL}/students/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  /**
   * Archive student
   * @param {string} uuid - Student UUID
   * @param {string} reason - Archive reason
   * @returns {Promise<Object>} - Archive result
   */
  async archiveStudent(uuid, reason) {
    try {
      const response = await axios.post(`${this.baseURL}/students/${uuid}/archive`, {
        reason: reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error archiving student:', error);
      throw error;
    }
  }

  /**
   * Restore student from archive
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Restore result
   */
  async restoreStudent(uuid) {
    try {
      const response = await axios.post(`${this.baseURL}/students/${uuid}/restore`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error restoring student:', error);
      throw error;
    }
  }

  /**
   * Add note to student
   * @param {string} uuid - Student UUID
   * @param {string} note - Note content
   * @returns {Promise<Object>} - Note creation result
   */
  async addStudentNote(uuid, note) {
    try {
      const response = await axios.post(`${this.baseURL}/students/${uuid}/notes`, {
        note: note
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error adding student note:', error);
      throw error;
    }
  }

  /**
   * Upload document for student
   * @param {string} uuid - Student UUID
   * @param {File} file - File to upload
   * @param {string} type - Document type
   * @returns {Promise<Object>} - Upload result
   */
  async uploadStudentDocument(uuid, file, type) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await axios.post(`${this.baseURL}/students/${uuid}/documents`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading student document:', error);
      throw error;
    }
  }

  /**
   * Get student financial history
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Financial history
   */
  async getStudentFinancialHistory(uuid) {
    try {
      const response = await axios.get(`${this.baseURL}/students/${uuid}/financial-aid`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student financial history:', error);
      throw error;
    }
  }

  /**
   * Get student academic history
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Academic history
   */
  async getStudentAcademicHistory(uuid) {
    try {
      const response = await axios.get(`${this.baseURL}/students/${uuid}/academic-records`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student academic history:', error);
      throw error;
    }
  }

  /**
   * Update academic status
   * @param {string} uuid - Student UUID
   * @param {string} status - New academic status
   * @returns {Promise<Object>} - Update result
   */
  async updateAcademicStatus(uuid, status) {
    try {
      const response = await axios.put(`${this.baseURL}/students/${uuid}/academic-status`, {
        academic_status: status
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating academic status:', error);
      throw error;
    }
  }

  /**
   * Get student statistics for dashboard
   * @returns {Promise<Object>} - Statistics data
   */
  async getStudentStatistics() {
    try {
      const response = await axios.get(`${this.baseURL}/students/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      throw error;
    }
  }

  /**
   * Get students by scholarship status
   * @param {string} status - Scholarship status
   * @returns {Promise<Object>} - Students data
   */
  async getStudentsByScholarshipStatus(status) {
    try {
      const response = await axios.get(`${this.baseURL}/students/scholarship-status/${status}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching students by scholarship status:', error);
      throw error;
    }
  }

  /**
   * Bulk update students
   * @param {Array} uuids - Array of student UUIDs
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Bulk update result
   */
  async bulkUpdateStudents(uuids, updates) {
    try {
      const response = await axios.post(`${this.baseURL}/students/bulk-update`, {
        uuids: uuids,
        updates: updates
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error bulk updating students:', error);
      throw error;
    }
  }

  /**
   * Send notification to students
   * @param {Array} uuids - Array of student UUIDs
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} - Notification result
   */
  async sendNotificationToStudents(uuids, notification) {
    try {
      const response = await axios.post(`${this.baseURL}/students/notifications`, {
        student_uuids: uuids,
        ...notification
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error sending notification to students:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const studentApiService = new StudentApiService();
export default studentApiService;
