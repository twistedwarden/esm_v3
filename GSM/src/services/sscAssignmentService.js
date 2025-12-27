import axios from 'axios';
import { getScholarshipServiceUrl } from '../config/api';

class SSCAssignmentService {
  constructor() {
    this.baseURL = `${getScholarshipServiceUrl('/api')}/ssc-assignments`;
  }

  // Get all SSC assignments
  async getAssignments() {
    try {
      const response = await axios.get(this.baseURL);
      return response.data;
    } catch (error) {
      console.error('Error fetching SSC assignments:', error);
      throw error;
    }
  }

  // Get assignments for a specific user
  async getUserAssignments(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user SSC assignments:', error);
      throw error;
    }
  }

  // Create a new SSC assignment
  async createAssignment(assignmentData) {
    try {
      const response = await axios.post(this.baseURL, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating SSC assignment:', error);
      throw error;
    }
  }

  // Update an SSC assignment
  async updateAssignment(assignmentId, assignmentData) {
    try {
      const response = await axios.put(`${this.baseURL}/${assignmentId}`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error updating SSC assignment:', error);
      throw error;
    }
  }

  // Delete an SSC assignment
  async deleteAssignment(assignmentId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting SSC assignment:', error);
      throw error;
    }
  }

  // Get available SSC roles
  getAvailableSSCRoles() {
    return [
      { value: 'chairperson', label: 'Chairperson', stage: 'final_approval' },
      { value: 'city_council', label: 'City Council', stage: 'document_verification' },
      { value: 'hrd', label: 'HRD', stage: 'document_verification' },
      { value: 'social_services', label: 'Social Services', stage: 'document_verification' },
      { value: 'budget_dept', label: 'Budget Department', stage: 'financial_review' },
      { value: 'accounting', label: 'Accounting', stage: 'financial_review' },
      { value: 'treasurer', label: 'Treasurer', stage: 'financial_review' },
      { value: 'education_affairs', label: 'Education Affairs', stage: 'academic_review' },
      { value: 'qcydo', label: 'QCYDO', stage: 'academic_review' },
      { value: 'planning_dept', label: 'Planning Department', stage: 'academic_review' },
      { value: 'schools_division', label: 'Schools Division', stage: 'academic_review' },
      { value: 'qcu', label: 'QCU', stage: 'academic_review' }
    ];
  }

  // Get review stages
  getReviewStages() {
    return [
      { value: 'document_verification', label: 'Document Verification' },
      { value: 'financial_review', label: 'Financial Review' },
      { value: 'academic_review', label: 'Academic Review' },
      { value: 'final_approval', label: 'Final Approval' }
    ];
  }
}

export const sscAssignmentService = new SSCAssignmentService();
export default sscAssignmentService;
