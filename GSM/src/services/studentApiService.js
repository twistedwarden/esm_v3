import axios from 'axios';
import { getScholarshipServiceUrl, API_CONFIG } from '../config/api';

class StudentApiService {
  constructor() {
    this.baseURL = getScholarshipServiceUrl('/api');
  }

  /**
   * Get authorization headers
   * @returns {Object} - Headers object
   */
  getHeaders(contentType = 'application/json') {
    return {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': contentType,
    };
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  /**
   * Permanently delete student
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Deletion result
   */
  async forceDeleteStudent(uuid) {
    try {
      const response = await axios.delete(`${this.baseURL}/students/${uuid}/force`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error force deleting student:', error);
      throw error;
    }
  }

  /**
   * Bulk permanently delete students
   * @param {Array} uuids - Array of student UUIDs
   * @returns {Promise<Object>} - Bulk deletion result
   */
  async bulkForceDeleteStudents(uuids) {
    try {
      const response = await axios.post(`${this.baseURL}/students/bulk-force-delete`, {
        uuids: uuids
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error bulk force deleting students:', error);
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error sending notification to students:', error);
      throw error;
    }
  }

  /**
   * Get student documents
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Documents list
   */
  async getStudentDocuments(uuid) {
    try {
      const response = await axios.get(`${this.baseURL}/students/${uuid}/documents`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student documents:', error);
      throw error;
    }
  }

  /**
   * Delete a student document
   * @param {string} studentUuid - Student UUID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteStudentDocument(studentUuid, documentId) {
    try {
      const response = await axios.delete(`${this.baseURL}/students/${studentUuid}/documents/${documentId}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting student document:', error);
      throw error;
    }
  }

  /**
   * Bulk archive students
   * @param {Array} uuids - Array of student UUIDs
   * @param {string} reason - Archive reason
   * @returns {Promise<Object>} - Bulk archive result
   */
  async bulkArchiveStudents(uuids, reason = 'Bulk archived by admin') {
    try {
      const response = await axios.post(`${this.baseURL}/students/bulk-archive`, {
        uuids: uuids,
        reason: reason
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error bulk archiving students:', error);
      throw error;
    }
  }

  /**
   * Bulk restore students from archive
   * @param {Array} uuids - Array of student UUIDs
   * @returns {Promise<Object>} - Bulk restore result
   */
  async bulkRestoreStudents(uuids) {
    try {
      const response = await axios.post(`${this.baseURL}/students/bulk-restore`, {
        uuids: uuids
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error bulk restoring students:', error);
      throw error;
    }
  }

  /**
   * Import students from CSV/Excel file
   * @param {File} file - CSV or Excel file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result with success/error counts
   */
  async importStudents(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add import options
      if (options.skipFirstRow !== undefined) {
        formData.append('skip_first_row', options.skipFirstRow);
      }
      if (options.delimiter) {
        formData.append('delimiter', options.delimiter);
      }
      if (options.defaultStatus) {
        formData.append('default_status', options.defaultStatus);
      }
      if (options.validateEmail !== undefined) {
        formData.append('validate_email', options.validateEmail);
      }
      if (options.autoGenerateStudentNumbers !== undefined) {
        formData.append('auto_generate_student_numbers', options.autoGenerateStudentNumbers);
      }

      const response = await axios.post(`${this.baseURL}/students/import`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  }

  /**
   * Export students to file (returns download URL or blob)
   * @param {Object} filters - Filter options
   * @param {string} format - Export format (csv, excel, json)
   * @returns {Promise<Blob>} - File blob for download
   */
  async exportStudents(filters = {}, format = 'csv') {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${this.baseURL}/students/export?${params.toString()}`, {
        headers: this.getHeaders(),
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting students:', error);
      throw error;
    }
  }

  /**
   * Get student notes
   * @param {string} uuid - Student UUID
   * @returns {Promise<Object>} - Notes list
   */
  async getStudentNotes(uuid) {
    try {
      const response = await axios.get(`${this.baseURL}/students/${uuid}/notes`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching student notes:', error);
      throw error;
    }
  }

  /**
   * Delete a student note
   * @param {string} studentUuid - Student UUID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteStudentNote(studentUuid, noteId) {
    try {
      const response = await axios.delete(`${this.baseURL}/students/${studentUuid}/notes/${noteId}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting student note:', error);
      throw error;
    }
  }

  /**
   * Get available filter options (programs, schools, year levels)
   * @returns {Promise<Object>} - Filter options
   */
  async getFilterOptions() {
    try {
      const response = await axios.get(`${this.baseURL}/students/filter-options`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      // Suppress 404 errors as they mean the endpoint isn't ready yet
      if (error.response && error.response.status !== 404) {
        console.error('StudentApiService: Error fetching filter options:', error);
      }
      // Return default options on error
      return {
        data: {
          programs: [],
          schools: [],
          year_levels: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
          scholarship_statuses: ['none', 'applicant', 'scholar', 'alumni'],
          statuses: ['active', 'inactive', 'archived']
        }
      };
    }
  }
}

// Create and export a singleton instance
const studentApiService = new StudentApiService();
export default studentApiService;
