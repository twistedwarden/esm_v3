export interface StudentProfile {
  // Basic Information
  student_uuid: string;
  student_number: string;
  citizen_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  
  // Academic Records
  current_school_id: number;
  year_level: string;
  program: string;
  enrollment_date: string;
  academic_status: 'enrolled' | 'graduated' | 'dropped' | 'transferred';
  gpa: number;
  
  // Scholarship Information
  scholarship_status: 'none' | 'applicant' | 'scholar' | 'alumni';
  current_scholarship_id: number;
  approved_amount: number;
  scholarship_start_date: string;
  total_scholarships_received: number;
  
  // Financial Aid History
  financial_aid_records: Array<{
    type: 'scholarship' | 'grant' | 'loan';
    amount: number;
    date: string;
    status: string;
  }>;
  
  // Documents
  documents: Array<{
    id: number;
    type: string;
    filename: string;
    uploaded_at: string;
  }>;
  
  // Notes & Tracking
  notes: Array<{
    id: number;
    note: string;
    created_by: string;
    created_at: string;
  }>;
  
  // Status
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface StudentFilters {
  search?: string;
  school_id?: number;
  program?: string;
  year_level?: string;
  scholarship_status?: string;
  academic_status?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface StudentStatistics {
  total_students: number;
  active_scholars: number;
  applicants: number;
  alumni: number;
  students_by_status: {
    enrolled: number;
    graduated: number;
    dropped: number;
    transferred: number;
  };
  recent_registrations: number;
  average_gpa: number;
}

export interface StudentNote {
  id: number;
  student_uuid: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDocument {
  id: number;
  student_uuid: string;
  type: 'academic' | 'financial' | 'personal' | 'scholarship';
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  expires_at?: string;
}

export interface AcademicRecord {
  id: number;
  student_uuid: string;
  semester: string;
  year: number;
  gpa: number;
  subjects: Array<{
    code: string;
    name: string;
    units: number;
    grade: string;
    points: number;
  }>;
  status: 'enrolled' | 'completed' | 'failed' | 'dropped';
  created_at: string;
}

export interface FinancialAidRecord {
  id: number;
  student_uuid: string;
  type: 'scholarship' | 'grant' | 'loan';
  amount: number;
  currency: string;
  disbursement_date: string;
  status: 'pending' | 'disbursed' | 'cancelled';
  source: string;
  reference_number: string;
  notes?: string;
  created_at: string;
}
