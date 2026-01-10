import { API_CONFIG, getScholarshipServiceUrl } from '../config/api';

// Types matching the scholarship service
export interface Student {
  id?: number;
  citizen_id: string;
  user_id?: number;
  student_id_number?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  extension_name?: string;
  sex: 'Male' | 'Female';
  civil_status: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated';
  nationality?: string;
  birth_place?: string;
  birth_date?: string;
  is_pwd?: boolean;
  pwd_specification?: string;
  religion?: string;
  height_cm?: number;
  weight_kg?: number;
  contact_number?: string;
  email_address?: string;
  is_employed?: boolean;
  occupation?: string;
  is_job_seeking?: boolean;
  is_currently_enrolled?: boolean;
  is_graduating?: boolean;
  is_solo_parent?: boolean;
  is_indigenous_group?: boolean;
  is_registered_voter?: boolean;
  voter_nationality?: string;
  has_paymaya_account?: boolean;
  preferred_mobile_number?: string;
  created_at?: string;
  updated_at?: string;
  emergency_contacts?: EmergencyContact[];
  addresses?: Address[];
  family_members?: FamilyMember[];
  financial_information?: FinancialInformation;
  academic_records?: AcademicRecord[];
}

export interface Address {
  id?: number;
  student_id?: number;
  type: 'present' | 'permanent' | 'school';
  address_line_1?: string;
  address_line_2?: string;
  barangay?: string;
  district?: string;
  city?: string;
  province?: string;
  region?: string;
  zip_code?: string;
}

export interface FamilyMember {
  id?: number;
  student_id?: number;
  relationship: 'father' | 'mother' | 'guardian' | 'sibling' | 'spouse';
  first_name: string;
  last_name: string;
  middle_name?: string;
  extension_name?: string;
  contact_number?: string;
  occupation?: string;
  monthly_income?: number;
  is_alive?: boolean;
  is_employed?: boolean;
  is_ofw?: boolean;
  is_pwd?: boolean;
  pwd_specification?: string;
}

export interface FinancialInformation {
  id?: number;
  student_id?: number;
  family_monthly_income_range?: string;
  monthly_income?: number;
  number_of_siblings?: number;
  siblings_currently_enrolled?: number;
  home_ownership_status?: 'owned' | 'rented' | 'living_with_relatives' | 'boarding_house' | 'informal_settlers' | 'others';
  is_4ps_beneficiary?: boolean;
}

export interface EmergencyContact {
  id?: number;
  student_id?: number;
  full_name: string;
  contact_number: string;
  relationship: string;
  address?: string;
  email?: string;
  notes?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface School {
  id: number;
  name: string;
  campus?: string;
  contact_number?: string;
  email?: string;
  website?: string;
  classification: string;
  address?: string;
  city?: string;
  province?: string;
  region?: string;
  zip_code?: string;
  is_public?: boolean;
  is_partner_school?: boolean;
  is_active?: boolean;
}

export interface AcademicRecord {
  id?: number;

  student_id?: number;
  school_id: number;
  educational_level: 'ELEMENTARY' | 'HIGH SCHOOL' | 'SENIOR HIGH SCHOOL' | 'TERTIARY/COLLEGE' | 'GRADUATE SCHOOL';
  program?: string;
  major?: string;
  track_specialization?: string;
  area_of_specialization?: string;
  year_level: string;
  school_year: string;
  school_term: string;
  units_enrolled?: number;
  units_completed?: number;
  gpa?: number;
  general_weighted_average?: number;
  previous_school?: string;
  is_current?: boolean;
  is_graduating?: boolean;
  enrollment_date?: string;
  graduation_date?: string;
}

export interface ScholarshipCategory {
  id: number;
  name: string;
  description?: string;
  type: 'merit' | 'need_based' | 'special' | 'renewal';
  is_active?: boolean;
  subcategories?: ScholarshipSubcategory[];
}

export interface ScholarshipSubcategory {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  amount?: number;
  type: 'merit' | 'need_based' | 'special' | 'renewal';
  requirements?: string[];
  benefits?: string[];
  is_active?: boolean;
}

export interface ScholarshipApplication {
  id?: number;
  application_number?: string;
  student_id: number;
  category_id: number;
  subcategory_id: number;
  school_id: number;
  type: 'new' | 'renewal';
  parent_application_id?: string;
  status: 'draft' | 'submitted' | 'documents_reviewed' | 'interview_scheduled' | 'interview_completed' | 'endorsed_to_ssc' | 'approved' | 'grants_processing' | 'grants_disbursed' | 'rejected' | 'on_hold' | 'cancelled' | 'for_compliance' | 'compliance_documents_submitted';
  reason_for_renewal?: string;
  financial_need_description: string;
  requested_amount?: number;
  approved_amount?: number;
  rejection_reason?: string;
  notes?: string;
  marginalized_groups?: string[];
  digital_wallets?: string[];
  wallet_account_number?: string;
  how_did_you_know?: string[];
  is_school_at_qc?: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  reviewed_by?: number;
  approved_by?: number;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  category?: ScholarshipCategory;
  subcategory?: ScholarshipSubcategory;
  school?: School;
}

export interface DocumentType {
  id: number;
  name: string;
  description?: string;
  is_required: boolean;
  category: 'personal' | 'academic' | 'financial' | 'other';
  is_active: boolean;
}

export interface Document {
  id?: number;
  student_id: number;
  application_id?: number;
  document_type_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  verified_by?: number;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
  document_type?: DocumentType;
}

// EnrollmentVerification interface removed - automatic verification is disabled

export interface InterviewSchedule {
  id?: number;
  application_id: number;
  student_id: number;
  interview_date: string;
  interview_time: string;
  interview_location: string;
  interview_type: 'in_person' | 'online' | 'phone';
  meeting_link?: string;
  interviewer_id?: number;
  interviewer_name?: string;
  scheduling_type: 'automatic' | 'manual';
  status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'no_show';
  interview_notes?: string;
  interview_result?: 'passed' | 'failed' | 'needs_followup';
  completed_at?: string;
  scheduled_by?: number;
  created_at?: string;
  updated_at?: string;
  application?: ScholarshipApplication;
  student?: Student;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

class ScholarshipApiService {
  constructor() {
    // No need to store baseURL as we use getScholarshipServiceUrl helper
  }

  // Helper method for making HTTP requests
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = getScholarshipServiceUrl(endpoint);

    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization header if token exists
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;

      // Add user information headers for SSC role detection
      try {
        const userData = localStorage.getItem('user_data');
        console.log('ScholarshipApiService - User data from localStorage:', userData);
        if (userData) {
          const user = JSON.parse(userData);
          console.log('ScholarshipApiService - Parsed user:', user);
          defaultHeaders['X-User-ID'] = user.id;
          defaultHeaders['X-User-Role'] = user.role;
          defaultHeaders['X-User-Email'] = user.email;
          defaultHeaders['X-User-First-Name'] = user.first_name;
          defaultHeaders['X-User-Last-Name'] = user.last_name;
          console.log('ScholarshipApiService - Headers being sent:', defaultHeaders);
        }
      } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
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
  }

  // Public endpoints (no authentication required)
  async getSchools(): Promise<School[]> {
    try {
      const response = await this.makeRequest<{ data: { data: School[] } }>(
        API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.PUBLIC_SCHOOLS
      );
      console.log('Schools API response:', response);
      // Handle paginated response
      const schools = response.data?.data || response.data || [];
      console.log('Parsed schools:', schools);
      return Array.isArray(schools) ? schools : [];
    } catch (error) {
      console.error('Error fetching schools:', error);
      return [];
    }
  }

  async getScholarshipCategories(): Promise<ScholarshipCategory[]> {
    try {
      const response = await this.makeRequest<{ data: ScholarshipCategory[] }>(
        API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.PUBLIC_SCHOLARSHIP_CATEGORIES
      );
      console.log('Categories API response:', response);
      // Handle paginated response
      const categories = response.data?.data || response.data || [];
      console.log('Parsed categories:', categories);
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createScholarshipCategory(categoryData: Partial<ScholarshipCategory>): Promise<ScholarshipCategory> {
    const response = await this.makeRequest<{ data: ScholarshipCategory }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_CATEGORIES,
      {
        method: 'POST',
        body: JSON.stringify(categoryData),
      }
    );
    return response.data!.data! || response.data!;
  }

  async updateScholarshipCategory(id: number, categoryData: Partial<ScholarshipCategory>): Promise<ScholarshipCategory> {
    const response = await this.makeRequest<{ data: ScholarshipCategory }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_CATEGORY(id),
      {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      }
    );
    return response.data!.data! || response.data!;
  }

  async deleteScholarshipCategory(id: number): Promise<void> {
    await this.makeRequest(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_CATEGORY(id),
      {
        method: 'DELETE',
      }
    );
  }

  async createScholarshipSubcategory(subcategoryData: Partial<ScholarshipSubcategory>): Promise<ScholarshipSubcategory> {
    const response = await this.makeRequest<{ data: ScholarshipSubcategory }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_SUBCATEGORIES,
      {
        method: 'POST',
        body: JSON.stringify(subcategoryData),
      }
    );
    return response.data!.data! || response.data!;
  }

  async updateScholarshipSubcategory(id: number, subcategoryData: Partial<ScholarshipSubcategory>): Promise<ScholarshipSubcategory> {
    const response = await this.makeRequest<{ data: ScholarshipSubcategory }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_SUBCATEGORY(id),
      {
        method: 'PUT',
        body: JSON.stringify(subcategoryData),
      }
    );
    return response.data!.data! || response.data!;
  }

  async deleteScholarshipSubcategory(id: number): Promise<void> {
    await this.makeRequest(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.SCHOLARSHIP_SUBCATEGORY(id),
      {
        method: 'DELETE',
      }
    );
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await this.makeRequest<{ data: DocumentType[] }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.PUBLIC_DOCUMENT_TYPES
    );
    return response.data?.data || [];
  }

  async getRequiredDocuments(): Promise<DocumentType[]> {
    const response = await this.makeRequest<{ data: DocumentType[] }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.PUBLIC_REQUIRED_DOCUMENTS
    );
    return response.data?.data || [];
  }

  // Student management
  async getStudents(params?: any): Promise<{ data: Student[]; meta?: any }> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `${API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENTS}?${queryParams}`
      : API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENTS;

    const response = await this.makeRequest<{ data: Student[]; meta?: any }>(endpoint);
    return response.data!;
  }

  async getStudent(id: number): Promise<Student> {
    const response = await this.makeRequest<{ data: Student }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENT(id)
    );
    return response.data!.data!;
  }

  async createStudent(studentData: Partial<Student>): Promise<Student> {
    const response = await this.makeRequest<{ data: Student }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENTS,
      {
        method: 'POST',
        body: JSON.stringify(studentData),
      }
    );
    return response.data!.data!;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student> {
    const response = await this.makeRequest<{ data: Student }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENT(id),
      {
        method: 'PUT',
        body: JSON.stringify(studentData),
      }
    );
    return response.data!.data!;
  }

  async deleteStudent(id: number): Promise<void> {
    await this.makeRequest(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STUDENT(id),
      {
        method: 'DELETE',
      }
    );
  }

  // Scholarship applications
  async getApplications(params?: any): Promise<{ data: ScholarshipApplication[]; meta?: any }> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `${API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATIONS}?${queryParams}`
      : API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATIONS;

    const response = await this.makeRequest<{ data: any; meta?: any }>(endpoint);
    // Normalize Laravel paginator shape to a consistent `{ data, meta }`
    const payload = response.data as any;
    if (payload && Array.isArray(payload.data)) {
      // Laravel paginator: `{ data: [...], current_page, last_page, ... }`
      const { data, ...restMeta } = payload;
      return { data, meta: restMeta };
    }
    // Already normalized array
    return { data: (payload as ScholarshipApplication[]) || [], meta: undefined };
  }

  // Get current user's applications
  async getUserApplications(): Promise<ScholarshipApplication[]> {
    try {
      // Add 'mine=true' parameter to scope results to current user only
      const response = await this.getApplications({ mine: true });
      // Handle paginated response: response.data contains the actual applications array
      const applications = response.data || [];
      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      console.error('Error fetching user applications:', error);
      return [];
    }
  }

  async getApplication(id: number): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ success: boolean; data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION(id)
    );
    // Backend returns `{ success: boolean, data: application }`
    console.log('getApplication response:', response);
    console.log('getApplication response.data:', response.data);
    console.log('getApplication response.data.data:', response.data?.data);

    // Handle different response structures
    if (response.data?.data) {
      return response.data.data;
    } else if (response.data && typeof response.data === 'object' && !('success' in response.data)) {
      return response.data as ScholarshipApplication;
    } else {
      throw new Error('Invalid response structure from getApplication API');
    }
  }

  async createApplication(applicationData: Partial<ScholarshipApplication>): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATIONS,
      {
        method: 'POST',
        body: JSON.stringify(applicationData),
      }
    );
    return response.data!.data!;
  }

  async updateApplication(id: number, applicationData: Partial<ScholarshipApplication>): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION(id),
      {
        method: 'PUT',
        body: JSON.stringify(applicationData),
      }
    );
    return response.data!.data!;
  }

  async deleteApplication(id: number): Promise<void> {
    await this.makeRequest(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION(id),
      {
        method: 'DELETE',
      }
    );
  }

  async submitApplication(id: number): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION_SUBMIT(id),
      {
        method: 'POST',
      }
    );
    return response.data!.data!;
  }

  async approveApplication(id: number, approvedAmount: number, notes?: string): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION_APPROVE(id),
      {
        method: 'POST',
        body: JSON.stringify({ approved_amount: approvedAmount, notes }),
      }
    );
    return response.data!.data!;
  }

  async rejectApplication(id: number, rejectionReason: string): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION_REJECT(id),
      {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      }
    );
    return response.data!.data!;
  }

  async endorseToSSC(id: number, notes?: string): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      `/api/applications/${id}/endorse-to-ssc`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );
    return response.data!.data!;
  }

  async bulkEndorseToSSC(applicationIds: number[], filterType: 'recommended' | 'conditional' | 'all', notes?: string): Promise<any> {
    const response = await this.makeRequest<any>(
      `/api/applications/bulk-endorse-to-ssc`,
      {
        method: 'POST',
        body: JSON.stringify({
          application_ids: applicationIds,
          filter_type: filterType,
          notes
        }),
      }
    );
    return response.data!;
  }

  async markAsReviewed(id: number): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION_REVIEW(id),
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    return response.data!.data!;
  }

  async flagForCompliance(id: number, reason: string): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.APPLICATION_COMPLIANCE(id),
      {
        method: 'POST',
        body: JSON.stringify({
          reason: reason
        }),
      }
    );
    return response.data!.data!;
  }

  // Form integration endpoints
  async submitNewApplication(formData: any): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.FORM_NEW_APPLICATION,
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    );
    return response.data!.data!;
  }

  async submitRenewalApplication(formData: any): Promise<ScholarshipApplication> {
    const response = await this.makeRequest<{ data: ScholarshipApplication }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.FORM_RENEWAL_APPLICATION,
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    );
    return response.data!.data!;
  }

  async uploadDocument(documentData: FormData): Promise<Document> {
    // Get authentication token from localStorage
    const token = localStorage.getItem('auth_token');

    // Debug logging
    console.log('Upload token check:', token ? 'Token found' : 'No token found');

    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(
      getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENTS),
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: documentData,
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);

        if (errorData.errors) {
          // Handle validation errors
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Validation failed: ${validationErrors}`;
        } else {
          errorMessage = errorData.message || errorData.detail || errorMessage;
        }
      } catch {
        // If response is not JSON, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success && data.message) {
      throw new Error(data.message);
    }
    return data.data;
  }

  // Document management
  async getDocuments(params?: any): Promise<{ data: Document[]; meta?: any }> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `${API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENTS}?${queryParams}`
      : API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENTS;

    const response = await this.makeRequest<{ data: Document[]; meta?: any }>(endpoint);
    return response.data!;
  }

  async getDocumentsChecklist(applicationId: number): Promise<{ checklist: any[]; statistics: any }> {
    const response = await this.makeRequest<{ data: { checklist: any[]; statistics: any } }>(
      `${API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENTS}/checklist?application_id=${applicationId}`
    );
    return response.data!.data!;
  }

  // Check document scan status
  async checkDocumentScanStatus(documentId: number): Promise<{
    status: 'not_scanned' | 'clean' | 'infected',
    is_clean?: boolean,
    threat_name?: string,
    scan_duration?: number,
    scanned_at?: string,
    scan_type?: string
  }> {
    const response = await this.makeRequest<{ data: any }>(
      `${API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENTS}/${documentId}/scan-status`
    );
    return response.data!.data!;
  }

  async getDocument(id: number): Promise<Document> {
    const response = await this.makeRequest<{ data: Document }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT(id)
    );
    return response.data!.data!;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.makeRequest(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT(id),
      {
        method: 'DELETE',
      }
    );
  }

  async viewDocument(id: number): Promise<string> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT_VIEW(id)),
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return the URL for viewing the document
    return getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT_VIEW(id));
  }

  async downloadDocument(id: number): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT_DOWNLOAD(id)),
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }

  async verifyDocument(id: number, verificationNotes?: string): Promise<Document> {
    const response = await this.makeRequest<{ data: Document }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT_VERIFY(id),
      {
        method: 'POST',
        body: JSON.stringify({ verification_notes: verificationNotes }),
      }
    );
    return response.data!.data!;
  }

  async rejectDocument(id: number, verificationNotes: string): Promise<Document> {
    const response = await this.makeRequest<{ data: Document }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.DOCUMENT_REJECT(id),
      {
        method: 'POST',
        body: JSON.stringify({ verification_notes: verificationNotes }),
      }
    );
    return response.data!.data!;
  }

  // Statistics
  async getStatsOverview(): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STATS_OVERVIEW
    );
    return response.data!.data!;
  }

  async getApplicationsByStatus(): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STATS_APPLICATIONS_BY_STATUS
    );
    return response.data!.data!;
  }

  async getApplicationsByType(): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STATS_APPLICATIONS_BY_TYPE
    );
    return response.data!.data!;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await this.makeRequest<{ status: string; timestamp: string; service: string }>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.HEALTH
    );
    return response.data!;
  }

  // Enrollment Verification Methods have been removed - automatic verification is disabled

  // Interview Schedule Methods
  async getInterviewSchedules(): Promise<InterviewSchedule[]> {
    const response = await this.makeRequest<{ data: InterviewSchedule[] }>(
      '/api/interview-schedules'
    );
    return response.data!.data!;
  }

  async getInterviewSchedule(id: number): Promise<InterviewSchedule> {
    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/interview-schedules/${id}`
    );
    return response.data!.data!;
  }

  async scheduleInterview(applicationId: number, interviewData: Partial<InterviewSchedule>): Promise<InterviewSchedule> {
    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/applications/${applicationId}/schedule-interview`,
      {
        method: 'POST',
        body: JSON.stringify(interviewData),
      }
    );
    return response.data!.data!;
  }

  async scheduleInterviewAuto(applicationId: number): Promise<InterviewSchedule> {
    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/applications/${applicationId}/schedule-interview-auto`,
      {
        method: 'POST',
      }
    );
    return response.data!.data!;
  }

  async rescheduleInterview(id: number, newDate: string, newTime: string, reason?: string, duration?: number): Promise<InterviewSchedule> {
    const body: any = {
      interview_date: newDate,
      interview_time: newTime,
      reschedule_reason: reason
    };

    if (duration !== undefined) {
      body.duration = duration;
    }

    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/interview-schedules/${id}/reschedule`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
    return response.data!.data!;
  }

  async completeInterview(id: number, result: 'passed' | 'failed' | 'needs_followup', notes?: string, evaluationData?: any): Promise<InterviewSchedule> {
    const requestBody: any = {
      interview_result: result,
      interview_notes: notes
    };

    // Add detailed evaluation data if provided
    if (evaluationData) {
      Object.assign(requestBody, evaluationData);
    }

    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/interview-schedules/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );
    return response.data!.data!;
  }

  async cancelInterview(id: number, reason: string): Promise<InterviewSchedule> {
    const response = await this.makeRequest<{ data: InterviewSchedule }>(
      `/api/interview-schedules/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ cancel_reason: reason }),
      }
    );
    return response.data!.data!;
  }

  async getAvailableSlots(date?: string, interviewType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (interviewType) params.append('type', interviewType);

    const response = await this.makeRequest<{ data: any[] }>(
      `/api/interview-schedules/available-slots?${params.toString()}`
    );
    return response.data!.data!;
  }

  async getInterviewCalendar(): Promise<any[]> {
    const response = await this.makeRequest<{ data: any[] }>(
      '/api/interview-schedules/calendar'
    );
    return response.data!.data!;
  }

  // Staff methods
  async getStaffInterviewers(): Promise<{ success: boolean; data: any[]; message: string }> {
    const response = await this.makeRequest<{ success: boolean; data: any[]; message: string }>(
      '/api/staff/interviewers'
    );
    return response.data!;
  }

  async getAllStaff(): Promise<{ success: boolean; data: any[]; message: string }> {
    const response = await this.makeRequest<{ success: boolean; data: any[]; message: string }>(
      '/api/staff'
    );
    return response.data!;
  }

  async getStaffById(id: number): Promise<{ success: boolean; data: any; message: string }> {
    const response = await this.makeRequest<{ success: boolean; data: any; message: string }>(
      `/api/staff/${id}`
    );
    return response.data!;
  }

  // Interview Evaluation Methods
  async getInterviewEvaluations(): Promise<any[]> {
    const response = await this.makeRequest<{ data: any[] }>(
      '/api/interview-evaluations'
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async getInterviewEvaluation(id: number): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/interview-evaluations/${id}`
    );
    return response.data!.data!;
  }

  // SSC Methods
  async getSscPendingApplications(filters?: {
    category_id?: number;
    school_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/applications/ssc/pending?${params.toString()}`
    );
    return response.data!;
  }

  async getSscStatistics(): Promise<{
    totalApplications: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    thisMonthDecisions: number;
    averageProcessingTime: number;
  }> {
    const response = await this.makeRequest<{
      totalApplications: number;
      pendingReview: number;
      approved: number;
      rejected: number;
      thisMonthDecisions: number;
      averageProcessingTime: number;
    }>(
      '/api/applications/ssc/statistics'
    );
    return response.data!;
  }

  async sscApproveApplication(
    applicationId: number,
    approvedAmount: number,
    notes?: string
  ): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc-approve`,
      {
        method: 'POST',
        body: JSON.stringify({
          approved_amount: approvedAmount,
          notes: notes
        }),
      }
    );
    return response.data!.data!;
  }

  async sscRejectApplication(
    applicationId: number,
    rejectionReason: string
  ): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc-reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          rejection_reason: rejectionReason
        }),
      }
    );
    return response.data!.data!;
  }

  async sscBulkApprove(
    applicationIds: number[],
    notes?: string
  ): Promise<{
    approved_count: number;
    total_processed: number;
    failed_applications: any[];
  }> {
    const response = await this.makeRequest<{ data: any }>(
      '/api/applications/ssc/bulk-approve',
      {
        method: 'POST',
        body: JSON.stringify({
          application_ids: applicationIds,
          notes: notes
        }),
      }
    );
    return response.data!.data!;
  }

  async sscBulkReject(
    applicationIds: number[],
    rejectionReason: string
  ): Promise<{
    rejected_count: number;
    total_processed: number;
    failed_applications: any[];
  }> {
    const response = await this.makeRequest<{ data: any }>(
      '/api/applications/ssc/bulk-reject',
      {
        method: 'POST',
        body: JSON.stringify({
          application_ids: applicationIds,
          rejection_reason: rejectionReason
        }),
      }
    );
    return response.data!.data!;
  }

  async getSscDecisionHistory(filters?: {
    decision?: 'approved' | 'rejected';
    date_from?: string;
    date_to?: string;
    decided_by?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/applications/ssc/decision-history?${params.toString()}`
    );
    return response.data!;
  }

  // Get all SSC review decisions from all stages
  async getAllSscDecisions(filters?: {
    stage?: 'document_verification' | 'financial_review' | 'academic_review' | 'final_approval';
    status?: 'approved' | 'rejected';
    date_from?: string;
    date_to?: string;
    reviewed_by?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/applications/ssc/all-decisions?${params.toString()}`
    );
    return response.data!;
  }

  // ===== NEW SSC MULTI-STAGE METHODS =====

  // Get applications by stage
  async getSscApplicationsByStage(stage: string, filters?: {
    category_id?: number;
    school_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/applications/ssc/stage/${stage}?${params.toString()}`
    );
    return response.data!;
  }

  // Get my assigned applications (role-based)
  async getMySscApplications(filters?: {
    category_id?: number;
    school_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/applications/ssc/my-applications?${params.toString()}`
    );
    return response.data!;
  }

  // Stage-specific reviews
  async sscSubmitDocumentVerification(applicationId: number, data: {
    verified: boolean;
    notes?: string;
    document_issues?: string[];
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/document-verification`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async sscSubmitFinancialReview(applicationId: number, data: {
    feasible: boolean;
    recommended_amount: number;
    notes?: string;
    budget_period?: string;
    financial_assessment_score?: number;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/financial-review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async sscSubmitAcademicReview(applicationId: number, data: {
    approved: boolean;
    notes?: string;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/academic-review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async sscFinalApproval(applicationId: number, data: {
    approved_amount: number;
    notes?: string;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/final-approval`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async sscFinalRejection(applicationId: number, data: {
    rejection_reason: string;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/final-rejection`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  // Request revision
  async sscRequestRevision(applicationId: number, data: {
    stage: 'document_verification' | 'financial_review' | 'academic_review';
    notes: string;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/ssc/request-revision`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  // Get review history
  async getSscReviewHistory(applicationId: number): Promise<any[]> {
    const response = await this.makeRequest<any[]>(
      `/api/applications/${applicationId}/ssc/review-history`
    );
    return response.data!;
  }

  // Get current user's SSC roles
  async getUserSscRoles(): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/ssc/my-roles`
    );
    console.log('ScholarshipApiService - getUserSscRoles response:', response);
    return response.data!;
  }

  // Approve a specific stage (parallel workflow)
  async approveStage(applicationId: number, stage: string, notes: string, reviewData: any = {}): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/applications/${applicationId}/approve-stage`,
      {
        method: 'POST',
        body: JSON.stringify({
          stage,
          notes,
          review_data: reviewData
        })
      }
    );
    return response.data!;
  }

  // Get SSC member assignments
  async getSscMemberAssignments(): Promise<any[]> {
    const response = await this.makeRequest<any[]>(
      `/api/applications/ssc/member-assignments`
    );
    return response.data!;
  }

  // ===== INTERVIEWER METHODS =====

  // Get interviews assigned to the logged-in interviewer
  async getMyInterviews(filters?: {
    status?: 'pending' | 'completed' | 'cancelled' | 'all';
    date_from?: string;
    date_to?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; per_page: number; current_page: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await this.makeRequest<{ data: any[]; total: number; per_page: number; current_page: number }>(
      `/api/interviewer/my-interviews?${params.toString()}`
    );
    return response.data!;
  }

  // Get interviewer statistics for dashboard
  async getInterviewerStatistics(): Promise<{
    total_interviews: number;
    pending_interviews: number;
    completed_this_week: number;
    completed_this_month: number;
    average_scores: {
      academic_motivation: number;
      leadership_involvement: number;
      financial_need: number;
      character_values: number;
    };
    upcoming_interviews: any[];
  }> {
    const response = await this.makeRequest<{
      total_interviews: number;
      pending_interviews: number;
      completed_this_week: number;
      completed_this_month: number;
      average_scores: {
        academic_motivation: number;
        leadership_involvement: number;
        financial_need: number;
        character_values: number;
      };
      upcoming_interviews: any[];
    }>(
      '/api/interviewer/statistics'
    );
    return response.data!;
  }

  // Submit interview evaluation
  async submitInterviewEvaluation(scheduleId: number, evaluation: {
    academic_motivation_score: number;
    leadership_involvement_score: number;
    financial_need_score: number;
    character_values_score: number;
    overall_recommendation: 'recommended' | 'not_recommended' | 'needs_followup';
    remarks?: string;
  }): Promise<any> {
    const response = await this.makeRequest<{ data: any }>(
      `/api/interviewer/interviews/${scheduleId}/evaluate`,
      {
        method: 'POST',
        body: JSON.stringify(evaluation)
      }
    );
    return response.data!;
  }

  async getAppStatsBySubcategory(): Promise<Record<string, number>> {
    const response = await this.makeRequest<Record<string, number>>(
      API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.STATS_APPLICATIONS_BY_SUBCATEGORY
    );
    return response.data || {};
  }

  // Dashboard and Reporting
  async getDashboardOverview(): Promise<{ stats: any; recentActivities: any[] }> {
    const response = await this.makeRequest<{ stats: any; recentActivities: any[] }>(
      '/api/stats/dashboard-overview'
    );
    return response.data!;
  }

  async getApplicationsReportData(params?: any): Promise<any[]> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `/api/reports/applications/get-report-data?${queryParams}`
      : `/api/reports/applications/get-report-data`;

    const response = await this.makeRequest<any[]>(endpoint);
    return response.data!;
  }

  async exportApplications(params?: any): Promise<void> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams
      ? `/api/reports/applications/export?${queryParams}`
      : `/api/reports/applications/export`;

    const token = localStorage.getItem('auth_token');

    // Use native fetch for blob response since makeRequest expects JSON
    const response = await fetch(getScholarshipServiceUrl(endpoint), {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarship_applications_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Export singleton instance
export const scholarshipApiService = new ScholarshipApiService();
export default scholarshipApiService;
