import { scholarshipApiService } from './scholarshipApiService';

import { getScholarshipServiceUrl } from '../config/api';

class StudentRegistrationService {
  constructor() {
    this.baseURL = getScholarshipServiceUrl('/api');
  }

  /**
   * Automatically registers a student when SSC approves their scholarship application
   * @param {Object} applicationData - The approved scholarship application data
   * @returns {Promise<Object>} - The created student record
   */
  async autoRegisterFromSSCApproval(applicationData) {
    try {
      console.log('Auto-registering student from SSC approval:', applicationData);
      
      // Extract student data from the application
      const studentData = this.extractStudentDataFromApplication(applicationData);
      
      // Create the student record
      const response = await this.createStudentFromApplication(studentData, applicationData);
      
      console.log('Student auto-registered successfully:', response);
      return response;
    } catch (error) {
      console.error('Error auto-registering student:', error);
      throw error;
    }
  }

  /**
   * Extract student data from scholarship application
   * @param {Object} application - The scholarship application
   * @returns {Object} - Extracted student data
   */
  extractStudentDataFromApplication(application) {
    const student = application.student || {};
    const school = application.school || {};
    
    return {
      // Basic Information
      first_name: student.first_name || student.firstName || '',
      middle_name: student.middle_name || student.middleName || '',
      last_name: student.last_name || student.lastName || '',
      email: student.email_address || student.email || '',
      contact_number: student.contact_number || student.phone || '',
      citizen_id: student.citizen_id || '',
      
      // Academic Records
      current_school_id: school.id || application.school_id,
      year_level: student.year_level || student.current_year || '',
      program: student.program || student.course || '',
      enrollment_date: student.enrollment_date || new Date().toISOString(),
      academic_status: 'enrolled',
      gpa: student.gpa || 0,
      
      // Scholarship Information
      scholarship_status: 'scholar',
      current_scholarship_id: application.id,
      approved_amount: application.approved_amount || 0,
      scholarship_start_date: new Date().toISOString(),
      total_scholarships_received: 1,
      
      // Initial empty arrays
      financial_aid_records: [{
        type: 'scholarship',
        amount: application.approved_amount || 0,
        date: new Date().toISOString(),
        status: 'disbursed'
      }],
      documents: [],
      notes: [{
        id: Date.now(),
        note: `Auto-registered from SSC approval of scholarship application #${application.application_number || application.id}`,
        created_by: 'System',
        created_at: new Date().toISOString()
      }],
      
      // Status
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Create student record from application data
   * @param {Object} studentData - The extracted student data
   * @param {Object} applicationData - The original application data
   * @returns {Promise<Object>} - The created student record
   */
  async createStudentFromApplication(studentData, applicationData) {
    try {
      const response = await fetch(`${this.baseURL}/students/register-from-scholarship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          application_id: applicationData.id,
          student_data: studentData,
          scholarship_data: {
            application_number: applicationData.application_number,
            category_id: applicationData.category_id,
            subcategory_id: applicationData.subcategory_id,
            approved_amount: applicationData.approved_amount,
            approved_at: new Date().toISOString(),
            approved_by: applicationData.approved_by
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to register student');
      }
    } catch (error) {
      console.error('Error creating student from application:', error);
      
      // Fallback: Create student record locally if API fails
      return this.createLocalStudentRecord(studentData, applicationData);
    }
  }

  /**
   * Fallback method to create student record locally
   * @param {Object} studentData - The student data
   * @param {Object} applicationData - The application data
   * @returns {Object} - The created student record
   */
  createLocalStudentRecord(studentData, applicationData) {
    // Generate a UUID for the student
    const studentUuid = this.generateUUID();
    const studentNumber = this.generateStudentNumber();
    
    return {
      ...studentData,
      student_uuid: studentUuid,
      student_number: studentNumber,
      id: Date.now(), // Temporary ID
      created_via: 'ssc_approval',
      source_application_id: applicationData.id
    };
  }

  /**
   * Generate a UUID for the student
   * @returns {string} - Generated UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a student number
   * @returns {string} - Generated student number
   */
  generateStudentNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GSM${year}${random}`;
  }

  /**
   * Check if a student already exists for the given application
   * @param {number} applicationId - The application ID
   * @returns {Promise<boolean>} - True if student exists
   */
  async checkStudentExists(applicationId) {
    try {
      const response = await fetch(`${this.baseURL}/students/check-by-application/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.exists || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking if student exists:', error);
      return false;
    }
  }

  /**
   * Get student by application ID
   * @param {number} applicationId - The application ID
   * @returns {Promise<Object|null>} - The student record or null
   */
  async getStudentByApplication(applicationId) {
    try {
      const response = await fetch(`${this.baseURL}/students/by-application/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting student by application:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const studentRegistrationService = new StudentRegistrationService();
export default studentRegistrationService;
