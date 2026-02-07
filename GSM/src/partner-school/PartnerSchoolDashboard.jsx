import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/v1authStore';
import {
  Upload,
  Download,
  Users,
  FileText,
  BarChart3,
  Settings,
  Wallet,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CloudUpload,
  ShieldCheck,
  History,
  BookOpen,
  LogOut,
  Home,
  GraduationCap,
  Bell,
  Menu,
  User,
  RefreshCw,
  EyeOff,
  Lock,
  XCircle,
} from 'lucide-react';
import {
  fetchPartnerSchoolInfo,
  fetchPartnerSchoolStats,
  fetchPartnerSchoolStudents,
  uploadEnrollmentData,
  fetchEnrollmentData,
  uploadFlexibleData,
  fetchFlexibleStudents,
  matchHeaders
} from '../services/partnerSchoolService';
import { API_CONFIG, getAuthServiceUrl } from '../config/api';
import PartnerSchoolApplicationStatus from './PartnerSchoolApplicationStatus';
import PartnerSchoolFunds from './PartnerSchoolFunds';
import jsPDF from 'jspdf';
// import * as XLSX from 'xlsx';

const PartnerSchoolDashboard = () => {
  const { currentUser, logout, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadFile, setUploadFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // School information state
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [schoolStats, setSchoolStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplicant, setIsApplicant] = useState(false);


  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadMode, setUploadMode] = useState('merge');
  const [parsedCSVData, setParsedCSVData] = useState(null);
  const [parsedHeaders, setParsedHeaders] = useState(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme management - initialize from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [isLoggingOutLocal, setIsLoggingOutLocal] = useState(false);
  const handleLogout = async () => {
    try {
      setIsLoggingOutLocal(true);
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    } finally {
      setIsLoggingOutLocal(false);
    }
  };


  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    // At least 8 characters
    if (password.length >= 8) {
      feedback.push({ text: 'At least 8 characters', valid: true });
      score += 20;
    } else {
      feedback.push({ text: 'At least 8 characters', valid: false });
    }

    // One lowercase letter
    if (/[a-z]/.test(password)) {
      feedback.push({ text: 'One lowercase letter', valid: true });
      score += 20;
    } else {
      feedback.push({ text: 'One lowercase letter', valid: false });
    }

    // One uppercase letter
    if (/[A-Z]/.test(password)) {
      feedback.push({ text: 'One uppercase letter', valid: true });
      score += 20;
    } else {
      feedback.push({ text: 'One uppercase letter', valid: false });
    }

    // One number
    if (/\d/.test(password)) {
      feedback.push({ text: 'One number', valid: true });
      score += 20;
    } else {
      feedback.push({ text: 'One number', valid: false });
    }

    // One special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push({ text: 'One special character', valid: true });
      score += 20;
    } else {
      feedback.push({ text: 'One special character', valid: false });
    }

    return { score, feedback };
  };

  // Handle password form changes
  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'newPassword') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle password change submission
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordStrength.score < 100) {
      alert('Please ensure all password requirements are met');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(`${getAuthServiceUrl('/api/change-password')} `, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token} `,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword
        }),
      });

      if (response.ok) {
        alert('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordStrength({ score: 0, feedback: [] });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getBreadcrumb = () => {
    const breadcrumbs = {
      'overview': ['Partner School', 'Overview'],
      'upload': ['Partner School', 'Upload Data'],
      'students': ['Partner School', 'Students'],
      'budget': ['Partner School', 'Budget & Funds'],
      'reports': ['Partner School', 'Reports'],
      'settings': ['Partner School', 'Settings']
    };
    return breadcrumbs[activeTab] || ['Partner School', 'Overview'];
  };

  // Fetch school information on component mount
  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }


      try {
        setLoading(true);
        setError(null);

        // Fetch school info first to check verification status
        const schoolData = await fetchPartnerSchoolInfo(token);
        setSchoolInfo(schoolData);

        // Check if school is verified
        const verificationStatus = schoolData?.school?.verification_status;
        const isVerified = verificationStatus === 'verified';
        setIsApplicant(!isVerified);

        // Only fetch stats if school is verified
        if (isVerified) {
          try {
            const statsData = await fetchPartnerSchoolStats(token);
            setSchoolStats(statsData);
          } catch (statsErr) {
            console.error('Error fetching stats (may not be available for applicants):', statsErr);
            // Don't set error for stats failure, it's expected for applicants
          }
        }
      } catch (err) {
        console.error('Error fetching school data:', err);

        // Handle specific error cases
        if (err.message.includes('No school assigned')) {
          setError('No school has been assigned to your account. Please contact the administrator to assign a school to your account.');
        } else {
          setError(err.message);
        }

        setSchoolInfo(null);
        setSchoolStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [token, currentUser]);

  // Generate stats data from API response
  const statsData = schoolStats ? [
    {
      title: "Total Applications",
      value: schoolStats.total_applications?.toLocaleString() || "0",
      change: `+ ${schoolStats.recent_applications || 0} this month`,
      changeType: schoolStats.recent_applications > 0 ? "increase" : "neutral",
      icon: Users,
      color: "green"
    },
    {
      title: "Pending Applications",
      value: schoolStats.pending_applications?.toLocaleString() || "0",
      change: "Awaiting review",
      changeType: "neutral",
      icon: Clock,
      color: "blue"
    },
    {
      title: "Approved Applications",
      value: schoolStats.approved_applications?.toLocaleString() || "0",
      change: "Successfully processed",
      changeType: "increase",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Rejected Applications",
      value: schoolStats.rejected_applications?.toLocaleString() || "0",
      change: "Not approved",
      changeType: schoolStats.rejected_applications > 0 ? "decrease" : "neutral",
      icon: AlertCircle,
      color: schoolStats.rejected_applications > 0 ? "red" : "green"
    }
  ] : [];

  // Fetch students data when students tab is active
  useEffect(() => {
    if (activeTab === 'students' && token) {
      fetchStudentsData();
    } else {
      // Clear students data when not on students tab
      setStudents([]);
      setStudentsLoading(false);
    }
  }, [activeTab, token]);

  // Fetch students data when search or filter changes
  useEffect(() => {
    if (activeTab === 'students' && token) {
      fetchStudentsData();
    }
  }, [searchTerm, filterStatus]);

  const fetchStudentsData = async () => {
    try {
      setStudentsLoading(true);
      console.log('🔍 Starting fetchStudentsData...');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Filter status:', filterStatus);
      console.log('Search term:', searchTerm);

      // Fetch enrollment data (which includes students with their academic records)
      const [enrollmentData, flexibleData] = await Promise.allSettled([
        fetchEnrollmentData(token, {
          status: filterStatus,
          search: searchTerm,
          per_page: 1000  // Increase limit to show 100+ students
        }),
        fetchFlexibleStudents(token, {
          search: searchTerm,
          per_page: 1000  // Increase limit to show 100+ students
        })
      ]);

      // Handle the results
      const enrollmentResult = enrollmentData.status === 'fulfilled' ? enrollmentData.value : null;
      const flexibleResult = flexibleData.status === 'fulfilled' ? flexibleData.value : null;

      if (enrollmentData.status === 'rejected') {
        console.error('❌ Error fetching enrollment data:', enrollmentData.reason);
      }
      if (flexibleData.status === 'rejected') {
        console.error('❌ Error fetching flexible students:', flexibleData.reason);
      }

      console.log('✅ Enrollment data received:', enrollmentResult);
      console.log('✅ Flexible data received:', flexibleResult);
      console.log('🔍 Enrollment data type:', typeof enrollmentResult);
      console.log('🔍 Enrollment data.data type:', typeof enrollmentResult?.data);
      console.log('🔍 Enrollment data.data is array:', Array.isArray(enrollmentResult?.data));

      // Handle paginated response for enrollment data
      let studentsArray = [];
      let flexibleArray = [];

      if (enrollmentResult) {
        // Check if enrollmentResult.data is directly an array
        if (Array.isArray(enrollmentResult.data)) {
          studentsArray = enrollmentResult.data;
        }
        // Check if it's a paginated response
        else if (enrollmentResult.data && typeof enrollmentResult.data === 'object') {
          // If it has a 'data' property, use it (paginated response)
          if (enrollmentResult.data.data) {
            studentsArray = enrollmentResult.data.data;
          }
          // If it has an 'items' method, use it (Laravel pagination)
          else if (typeof enrollmentResult.data.items === 'function') {
            studentsArray = enrollmentResult.data.items();
          }
          // If it's an array, use it directly
          else if (Array.isArray(enrollmentResult.data)) {
            studentsArray = enrollmentResult.data;
          }
        }
        // If enrollmentResult is directly an array
        else if (Array.isArray(enrollmentResult)) {
          studentsArray = enrollmentResult;
        }
      }

      if (flexibleResult) {
        // Check if it's a paginated response
        if (flexibleResult.data && typeof flexibleResult.data === 'object') {
          // If it has a 'data' property, use it (paginated response)
          if (flexibleResult.data.data) {
            flexibleArray = flexibleResult.data.data;
          }
          // If it has an 'items' method, use it (Laravel pagination)
          else if (typeof flexibleResult.data.items === 'function') {
            flexibleArray = flexibleResult.data.items();
          }
          // If it's an array, use it directly
          else if (Array.isArray(flexibleResult.data)) {
            flexibleArray = flexibleResult.data;
          }
        }
      }

      console.log('Processed students array:', studentsArray);
      console.log('Processed flexible array:', flexibleArray);

      // Process enrollment data and attach it to students
      const processedStudents = studentsArray.map(student => {
        console.log('Processing student:', student.student_id_number);
        console.log('Student data:', student);

        // The student object should already contain enrollment data
        // Let's ensure it's properly structured
        const enrollmentData = student.enrollmentData || [];
        console.log('Enrollment data for', student.student_id_number, ':', enrollmentData);

        return {
          ...student,
          enrollmentData: enrollmentData,
          // Ensure we have the basic fields
          student_id_number: student.student_id_number,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: student.full_name || `${student.first_name} ${student.last_name} `,
          isFlexible: false
        };
      });

      // Convert flexible data to student format for display
      const flexibleStudents = flexibleArray.map(flexible => {
        console.log('Processing flexible student:', flexible);
        return {
          id: flexible.id,
          student_id_number: flexible.student_id_number,
          first_name: flexible.first_name,
          last_name: flexible.last_name,
          full_name: flexible.full_name,
          flexibleData: flexible.data,
          headers: flexible.headers,
          uploaded_at: flexible.uploaded_at,
          isFlexible: true
        };
      });

      // Group flexible students by student_id_number and keep the most recent record
      const groupedFlexibleStudents = flexibleStudents.reduce((acc, student) => {
        const key = student.student_id_number;
        if (!acc[key] || new Date(student.uploaded_at) > new Date(acc[key].uploaded_at)) {
          acc[key] = student;
        }
        return acc;
      }, {});

      // Convert back to array
      const uniqueFlexibleStudents = Object.values(groupedFlexibleStudents);

      console.log('Grouped flexible students:', uniqueFlexibleStudents);
      console.log('Total flexible students after grouping:', uniqueFlexibleStudents.length);

      // Combine both arrays
      const allStudents = [...processedStudents, ...uniqueFlexibleStudents];

      // Debug each student's data
      allStudents.forEach((student, index) => {
        console.log(`Student ${index + 1}:`, {
          id: student.id,
          student_id_number: student.student_id_number,
          first_name: student.first_name,
          last_name: student.last_name,
          isFlexible: student.isFlexible,
          flexibleData: student.flexibleData,
          enrollmentData: student.enrollmentData,
          scholarshipApplications: student.scholarshipApplications
        });
      });

      setStudents(allStudents);
    } catch (err) {
      console.error('Error fetching students data:', err);
      // Set empty array on error instead of mock data
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadProgress({ status: 'processing', message: 'Processing file...' });

      try {
        let csvData;
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // Parse Excel file-temporarily disabled
          setUploadProgress({ status: 'error', message: 'Excel file support temporarily disabled' });
          throw new Error('Excel file support temporarily disabled');
        } else {
          // Parse CSV file
          setUploadProgress({ status: 'processing', message: 'Processing CSV file...' });
          csvData = await parseCSVFile(file);
        }

        const headers = Object.keys(csvData[0] || {});

        console.log('Parsed data:', csvData);
        console.log('Headers:', headers);
        console.log('Number of records:', csvData.length);

        setUploadProgress({
          status: 'ready',
          message: `File processed successfully! ${csvData.length} student records found.Ready to upload.`
        });

        // Store the parsed data for upload
        setParsedCSVData(csvData);
        setParsedHeaders(headers);

      } catch (error) {
        console.error('Error processing CSV file:', error);
        setUploadProgress({ status: 'error', message: 'Error processing CSV file:' + error.message });
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Define a comprehensive mapping for flexible header recognition
  const headerMap = {
    'citizen_id': [
      'citizen_id', 'citizen id', 'citizenid', 'citizen', 'citizen number', 'citizennumber',
      'citizen id number', 'citizen no', 'citizenno', 'citizen_id_number', 'citizenidnumber',
      'national_id', 'national id', 'nationalid', 'national_id_number', 'nationalidnumber',
      'student_id', 'student id', 'studentid', 'student_id_number', 'studentidnumber',
      'id', 'id_number', 'idnumber', 'student_no', 'studentno', 'student number'
    ],
    'student_id_number': [
      'student_id_number', 'student id', 'id number', 'student_id', 'student_no', 'student number',
      'studentid', 'studentno', 'id', 'student', 'studentidnumber', 'studentnumber',
      'student id number', 'student no', 'student number', 'id no', 'idno'
    ],
    'first_name': [
      'first_name', 'first name', 'given name', 'fname', 'firstname', 'givenname',
      'first', 'name', 'firstname', 'given', 'f name', 'first name'
    ],
    'last_name': [
      'last_name', 'last name', 'surname', 'lname', 'lastname', 'family name',
      'last', 'surname', 'family', 'l name', 'last name', 'familyname'
    ],
    'middle_name': [
      'middle_name', 'middle name', 'mname', 'middlename', 'middle initial', 'middleinitial',
      'middle', 'mi', 'm name', 'middle name', 'middle_initial', 'middleinitial'
    ],
    'extension_name': [
      'extension_name', 'extension name', 'ext', 'extension', 'suffix', 'name_suffix',
      'name suffix', 'extensionname', 'namesuffix', 'ext_name', 'extname'
    ],
    'sex': [
      'sex', 'gender', 'sex_gender', 'sex gender', 'male_female', 'male female',
      'm_f', 'm f', 'male/female', 'male or female', 'gender_sex', 'gendersex'
    ],
    'civil_status': [
      'civil_status', 'civil status', 'marital_status', 'marital status', 'status',
      'civilstatus', 'maritalstatus', 'marital', 'civil', 'marital_status', 'maritalstatus'
    ],
    'nationality': [
      'nationality', 'citizenship', 'citizen', 'country', 'nationality_citizenship',
      'nationality citizenship', 'citizen_status', 'citizen status', 'citizenstatus'
    ],
    'birth_place': [
      'birth_place', 'birth place', 'place_of_birth', 'place of birth', 'birthplace',
      'placeofbirth', 'born_in', 'born in', 'birth_location', 'birth location', 'birthlocation'
    ],
    'birth_date': [
      'birth_date', 'birth date', 'date_of_birth', 'date of birth', 'birthdate',
      'dateofbirth', 'dob', 'born_on', 'born on', 'birth_day', 'birth day', 'birthday'
    ],
    'contact_number': [
      'contact_number', 'contact number', 'phone', 'mobile', 'phone_number', 'phone number',
      'contactnumber', 'phonenumber', 'mobile_number', 'mobile number', 'mobilenumber',
      'telephone', 'tel', 'cell', 'cell_phone', 'cell phone', 'cellphone'
    ],
    'email_address': [
      'email_address', 'email address', 'email', 'e_mail', 'e mail', 'emailaddr',
      'emailaddr', 'email_addr', 'email addr', 'mail', 'electronic_mail', 'electronic mail'
    ],
    'enrollment_year': [
      'enrollment_year', 'enrollment year', 'academic year', 'school year',
      'enrollmentyear', 'academicyear', 'schoolyear', 'academic_year', 'school_year',
      'enrollment year', 'academic year', 'school year'
    ],
    'enrollment_term': [
      'enrollment_term', 'enrollment term', 'semester', 'term', 'enrollmentterm',
      'sem', 'semester term', 'term semester', 'enrollment term', 'enrollment',
      'term', 'semester', 'period', 'quarter', 'trimester'
    ],
    'is_currently_enrolled': [
      'is_currently_enrolled', 'currently enrolled', 'enrolled', 'current enrollment',
      'iscurrentlyenrolled', 'currentlyenrolled', 'currentenrollment', 'enrolled status',
      'enrollment status', 'status', 'active', 'current', 'enrolled status',
      'currently enrolled', 'current enrollment', 'enrollment status', 'enrollment_status',
      'enrollment_status', 'enrollment status', 'enrollmentstatus', 'enrolled_status',
      'enrolled status', 'enrolledstatus', 'current_status', 'current status',
      'currentstatus', 'student_status', 'student status', 'studentstatus'
    ],
    'enrollment_status': [
      'enrollment_status', 'enrollment status', 'status', 'enrolled', 'enrollment',
      'enrollmentstatus', 'enrolled_status', 'enrolled status', 'enrolledstatus',
      'current_status', 'current status', 'currentstatus', 'student_status', 'student status',
      'active', 'inactive', 'enrollment_state', 'enrollment state', 'enrollmentstate'
    ],
    'academic_year': [
      'academic_year', 'academic year', 'academicyear', 'school_year', 'school year',
      'schoolyear', 'year', 'academic_session', 'academic session', 'academicsession',
      'sy', 'ay', 'session', 'period', 'academic_period', 'academic period'
    ],
    'semester': [
      'semester', 'sem', 'term', 'school_term', 'school term', 'schoolterm',
      'academic_term', 'academic term', 'academicterm', 'period', 'quarter',
      'trimester', 'qtr', 'tri', 'session', 'academic_session', 'academic session'
    ],
    'program': [
      'program', 'course', 'degree', 'program of study', 'course of study',
      'degree program', 'major', 'field of study', 'programofstudy',
      'courseofstudy', 'degreeprogram', 'fieldofstudy', 'program of study',
      'course of study', 'degree program', 'field of study'
    ],
    'year_level': [
      'year_level', 'year level', 'level', 'grade level', 'yearlevel',
      'gradelevel', 'grade', 'class', 'year level', 'grade level',
      'academic level', 'academiclevel', 'level year', 'year grade',
      'student level', 'studentlevel', 'academic standing', 'standing'
    ],
    'educational_level': [
      'educational_level', 'educational level', 'education_level', 'education level',
      'level', 'school_level', 'school level', 'schoollevel', 'academic_level',
      'academic level', 'academiclevel', 'degree_level', 'degree level', 'degreelevel'
    ],
    'major': [
      'major', 'major_field', 'major field', 'majorfield', 'specialization',
      'area_of_study', 'area of study', 'areaofstudy', 'field', 'subject',
      'concentration', 'focus', 'discipline', 'speciality', 'specialty'
    ],
    'school_year': [
      'school_year', 'school year', 'academic_year', 'academic year', 'schoolyear',
      'academicyear', 'year', 'academic_period', 'academic period', 'academicperiod',
      'enrollment_year', 'enrollment year', 'enrollmentyear'
    ],
    'school_term': [
      'school_term', 'school term', 'term', 'semester', 'quarter', 'trimester',
      'schoolterm', 'academic_term', 'academic term', 'academicterm', 'period',
      'enrollment_term', 'enrollment term', 'enrollmentterm'
    ],
    'units_enrolled': [
      'units_enrolled', 'units enrolled', 'units', 'credits', 'credit_hours',
      'credit hours', 'unitsenrolled', 'credithours', 'load', 'academic_load',
      'academic load', 'academicload', 'course_load', 'course load', 'courseload'
    ],
    'gpa': [
      'gpa', 'grade_point_average', 'grade point average', 'grade_point',
      'grade point', 'gradepoint', 'gwa', 'general_weighted_average',
      'general weighted average', 'generalweightedaverage', 'average', 'grade_average',
      'grade average', 'gradeaverage'
    ],
    'is_graduating': [
      'is_graduating', 'is graduating', 'graduating', 'graduation_status',
      'graduation status', 'graduationstatus', 'will_graduate', 'will graduate',
      'willgraduate', 'graduate', 'graduation', 'final_year', 'final year', 'finalyear'
    ],
    'enrollment_date': [
      'enrollment_date', 'enrollment date', 'enrollmentdate', 'date_enrolled',
      'date enrolled', 'dateenrolled', 'enrolled_date', 'enrolled date', 'enrolleddate',
      'admission_date', 'admission date', 'admissiondate', 'start_date', 'start date',
      'startdate', 'entry_date', 'entry date', 'entrydate', 'registration_date',
      'registration date', 'registrationdate', 'date', 'enrollment', 'admission'
    ]
  };

  // Define value mappings for smart value recognition
  const valueMaps = {
    'enrollment_term': {
      '1st semester': '1st Semester',
      'first semester': '1st Semester',
      '1st sem': '1st Semester',
      'first sem': '1st Semester',
      'sem 1': '1st Semester',
      'semester 1': '1st Semester',
      '1': '1st Semester',
      '2nd semester': '2nd Semester',
      'second semester': '2nd Semester',
      '2nd sem': '2nd Semester',
      'second sem': '2nd Semester',
      'sem 2': '2nd Semester',
      'semester 2': '2nd Semester',
      '2': '2nd Semester',
      'summer': 'Summer',
      'summer term': 'Summer',
      'summer semester': 'Summer',
      'SUMMER': 'Summer', // Uppercase version
      'midyear': 'Midyear',
      'mid year': 'Midyear',
      'mid-year': 'Midyear',
      'FIRST': '1st Semester', // Uppercase version
      'SECOND': '2nd Semester' // Uppercase version
    },
    'is_currently_enrolled': {
      'true': 'true',
      'yes': 'true',
      'y': 'true',
      '1': 'true',
      'enrolled': 'true',
      'active': 'true',
      'current': 'true',
      'ACTIVE': 'true', // Uppercase version
      'false': 'false',
      'no': 'false',
      'n': 'false',
      '0': 'false',
      'not enrolled': 'false',
      'inactive': 'false',
      'dropped': 'false',
      'graduated': 'false', // Treat graduated as false but with warning
      'INACTIVE': 'false', // Uppercase version
      'DROPPED': 'false', // Uppercase version
      'GRADUATED': 'false' // Uppercase version
    },
    'year_level': {
      '1st year': '1st Year',
      'first year': '1st Year',
      'first_year': '1st Year',
      '1st yr': '1st Year',
      'first yr': '1st Year',
      'year 1': '1st Year',
      '1': '1st Year',
      '2nd year': '2nd Year',
      'second year': '2nd Year',
      'second_year': '2nd Year',
      '2nd yr': '2nd Year',
      'second yr': '2nd Year',
      'year 2': '2nd Year',
      '2': '2nd Year',
      '3rd year': '3rd Year',
      'third year': '3rd Year',
      'third_year': '3rd Year',
      '3rd yr': '3rd Year',
      'third yr': '3rd Year',
      'year 3': '3rd Year',
      '3': '3rd Year',
      '4th year': '4th Year',
      'fourth year': '4th Year',
      'fourth_year': '4th Year',
      '4th yr': '4th Year',
      'fourth yr': '4th Year',
      'year 4': '4th Year',
      '4': '4th Year',
      '5th year': '5th Year',
      'fifth year': '5th Year',
      'fifth_year': '5th Year',
      '5th yr': '5th Year',
      'fifth yr': '5th Year',
      'year 5': '5th Year',
      '5': '5th Year',
      // Handle grade levels
      'grade 12': '12th Grade',
      'grade_12': '12th Grade',
      'grade12': '12th Grade',
      '12th grade': '12th Grade',
      'grade 11': '11th Grade',
      'grade_11': '11th Grade',
      'grade11': '11th Grade',
      '11th grade': '11th Grade',
      'grade 10': '10th Grade',
      'grade_10': '10th Grade',
      'grade10': '10th Grade',
      '10th grade': '10th Grade',
      'grade 9': '9th Grade',
      'grade_9': '9th Grade',
      'grade9': '9th Grade',
      '9th grade': '9th Grade',
      'grade 8': '8th Grade',
      'grade_8': '8th Grade',
      'grade8': '8th Grade',
      '8th grade': '8th Grade',
      'grade 7': '7th Grade',
      'grade_7': '7th Grade',
      'grade7': '7th Grade',
      '7th grade': '7th Grade',
      // Uppercase versions
      'FIRST_YEAR': '1st Year',
      'SECOND_YEAR': '2nd Year',
      'THIRD_YEAR': '3rd Year',
      'FOURTH_YEAR': '4th Year',
      'FIFTH_YEAR': '5th Year',
      'GRADE_12': '12th Grade',
      'GRADE_11': '11th Grade',
      'GRADE_10': '10th Grade',
      'GRADE_9': '9th Grade',
      'GRADE_8': '8th Grade',
      'GRADE_7': '7th Grade'
    },
    'program': {
      // Computer Science variations
      'computer science': 'Bachelor of Science in Computer Science',
      'bs computer science': 'Bachelor of Science in Computer Science',
      'bscs': 'Bachelor of Science in Computer Science',
      'cs': 'Bachelor of Science in Computer Science',
      'computer sci': 'Bachelor of Science in Computer Science',
      'comp sci': 'Bachelor of Science in Computer Science',

      // Psychology variations
      'psychology': 'Bachelor of Arts in Psychology',
      'ba psychology': 'Bachelor of Arts in Psychology',
      'bapsych': 'Bachelor of Arts in Psychology',
      'psych': 'Bachelor of Arts in Psychology',

      // Engineering variations
      'civil engineering': 'Bachelor of Science in Civil Engineering',
      'bs civil engineering': 'Bachelor of Science in Civil Engineering',
      'bscivil': 'Bachelor of Science in Civil Engineering',
      'ce': 'Bachelor of Science in Civil Engineering',

      'electrical engineering': 'Bachelor of Science in Electrical Engineering',
      'bs electrical engineering': 'Bachelor of Science in Electrical Engineering',
      'bsee': 'Bachelor of Science in Electrical Engineering',
      'ee': 'Bachelor of Science in Electrical Engineering',

      'mechanical engineering': 'Bachelor of Science in Mechanical Engineering',
      'bs mechanical engineering': 'Bachelor of Science in Mechanical Engineering',
      'bsme': 'Bachelor of Science in Mechanical Engineering',
      'me': 'Bachelor of Science in Mechanical Engineering',

      // Business variations
      'business administration': 'Bachelor of Science in Business Administration',
      'bsba': 'Bachelor of Science in Business Administration',
      'bs business admin': 'Bachelor of Science in Business Administration',
      'business admin': 'Bachelor of Science in Business Administration',

      // Education variations
      'elementary education': 'Bachelor of Elementary Education',
      'beed': 'Bachelor of Elementary Education',
      'bs elementary ed': 'Bachelor of Elementary Education',

      'secondary education': 'Bachelor of Secondary Education',
      'bsed': 'Bachelor of Secondary Education',
      'bs secondary ed': 'Bachelor of Secondary Education',

      // Nursing variations
      'nursing': 'Bachelor of Science in Nursing',
      'bsn': 'Bachelor of Science in Nursing',
      'bs nursing': 'Bachelor of Science in Nursing',

      // Accountancy variations
      'accountancy': 'Bachelor of Science in Accountancy',
      'bsa': 'Bachelor of Science in Accountancy',
      'bs accountancy': 'Bachelor of Science in Accountancy',
      'accounting': 'Bachelor of Science in Accountancy'
    }
  };

  // Function to normalize a header name with fuzzy matching
  const normalizeHeader = (csvHeader) => {
    if (!csvHeader || typeof csvHeader !== 'string') return null;

    // Clean the header:remove quotes, extra spaces, and convert to lowercase
    const cleanHeader = csvHeader.trim().replace(/['"]/g, '').toLowerCase();

    // Remove all non-alphanumeric characters for better matching
    const normalizedHeader = cleanHeader.replace(/[^a-z0-9]/g, '');

    // First try exact matches
    for (const canonicalField in headerMap) {
      if (headerMap[canonicalField].some(alias =>
        alias.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader
      )) {
        return canonicalField;
      }
    }

    // Then try partial matches (contains)
    for (const canonicalField in headerMap) {
      if (headerMap[canonicalField].some(alias =>
        normalizedHeader.includes(alias.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        alias.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedHeader)
      )) {
        return canonicalField;
      }
    }

    // Finally try word-based matching
    const words = normalizedHeader.split(/(?=[a-z])/).filter(w => w.length > 2);
    for (const canonicalField in headerMap) {
      for (const alias of headerMap[canonicalField]) {
        const aliasWords = alias.toLowerCase().replace(/[^a-z0-9]/g, '').split(/(?=[a-z])/).filter(w => w.length > 2);
        if (words.some(word => aliasWords.some(aliasWord =>
          word.includes(aliasWord) || aliasWord.includes(word)
        ))) {
          return canonicalField;
        }
      }
    }

    return null; // Return null if no match found
  };

  // Enhanced function to normalize field values-CAPTURE AS-IS
  const normalizeValue = (field, value) => {
    if (!value || typeof value !== 'string') return value;

    const originalValue = value;
    const cleanValue = value.trim().toLowerCase();

    // Log value transformations for debugging
    const logTransformation = (original, normalized, reason = '') => {
      if (original !== normalized) {
        console.log(`🔄 Value normalized:"${original}" → "${normalized}"(field:${field}) ${reason} `);
      }
    };

    // Handle name fields-KEEP AS-IS (no capitalization)
    if (field === 'first_name' || field === 'last_name') {
      const normalized = value.trim(); // Keep original case
      logTransformation(originalValue, normalized, '[Name kept as-is]');
      return normalized;
    }

    // Handle middle name-KEEP AS-IS but allow empty
    if (field === 'middle_name') {
      if (!value.trim()) return null; // Allow empty middle names
      const normalized = value.trim(); // Keep original case
      logTransformation(originalValue, normalized, '[Middle name kept as-is]');
      return normalized;
    }

    // Handle extension name-KEEP AS-IS
    if (field === 'extension_name') {
      const normalized = value.trim(); // Keep original case
      logTransformation(originalValue, normalized, '[Extension name kept as-is]');
      return normalized;
    }

    // Handle student ID-ensure it's uppercase and clean with intelligent formatting
    if (field === 'student_id_number') {
      let normalized = value.trim().toUpperCase();

      // Remove common prefixes/suffixes that might be inconsistent
      normalized = normalized.replace(/^(STU|STUDENT|ID|NO|NUMBER)[\s\-_]*/i, '');
      normalized = normalized.replace(/[\s\-_]*$/i, '');

      // Add STU-prefix if not present and looks like a number
      if (!normalized.startsWith('STU-') && /^\d+/.test(normalized)) {
        normalized = `STU-${normalized} `;
      }

      logTransformation(originalValue, normalized, '[Student ID formatting]');
      return normalized;
    }

    // Handle citizen ID-clean and format
    if (field === 'citizen_id') {
      let normalized = value.trim().toUpperCase();

      // Remove common prefixes
      normalized = normalized.replace(/^(CIT|CITIZEN|ID|NO|NUMBER)[\s\-_]*/i, '');
      normalized = normalized.replace(/[\s\-_]*$/i, '');

      // Add CIT-prefix if not present and looks like a number
      if (!normalized.startsWith('CIT-') && /^\d+/.test(normalized)) {
        normalized = `CIT-${normalized} `;
      }

      logTransformation(originalValue, normalized, '[Citizen ID formatting]');
      return normalized;
    }

    // Handle enrollment year-normalize format
    if (field === 'enrollment_year') {
      const yearMatch = cleanValue.match(/(\d{4})[-\/]?(\d{4})?/);
      if (yearMatch) {
        const startYear = yearMatch[1];
        const endYear = yearMatch[2] || (parseInt(startYear) + 1).toString();
        return `${startYear}-${endYear} `;
      }
    }

    // Handle enrollment date-normalize format with intelligent parsing
    if (field === 'enrollment_date') {
      // Try to parse various date formats
      const dateFormats = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // MM/DD/YYYY or MM-DD-YYYY
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
        /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/, // MM DD YYYY
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/, // MM/DD/YY or MM-DD-YY
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
      ];

      for (const format of dateFormats) {
        const match = value.match(format);
        if (match) {
          let year, month, day;
          if (format === dateFormats[0] || format === dateFormats[3]) {
            // MM/DD/YYYY or MM/DD/YY format
            [, month, day, year] = match;
            // Handle 2-digit years
            if (year.length === 2) {
              const currentYear = new Date().getFullYear();
              const century = Math.floor(currentYear / 100) * 100;
              year = (parseInt(year) > 50) ? century + parseInt(year) : century + 100 + parseInt(year);
            }
          } else if (format === dateFormats[1] || format === dateFormats[4]) {
            // YYYY/MM/DD format
            [, year, month, day] = match;
          } else {
            // MM DD YYYY format
            [, month, day, year] = match;
          }

          // Ensure two digits for month and day
          month = month.padStart(2, '0');
          day = day.padStart(2, '0');

          const normalized = `${year}-${month}-${day} `;
          logTransformation(originalValue, normalized, '[Date formatting]');
          return normalized;
        }
      }

      // Try to parse text-based dates
      const textDateFormats = [
        /(jan|january)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(feb|february)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(mar|march)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(apr|april)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(may)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(jun|june)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(jul|july)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(aug|august)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(sep|september)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(oct|october)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(nov|november)\s+(\d{1,2}),?\s+(\d{4})/i,
        /(dec|december)\s+(\d{1,2}),?\s+(\d{4})/i,
      ];

      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

      for (const format of textDateFormats) {
        const match = value.match(format);
        if (match) {
          const monthName = match[1].toLowerCase();
          const day = match[2].padStart(2, '0');
          const year = match[3];
          const month = (monthNames.indexOf(monthName) + 1).toString().padStart(2, '0');

          const normalized = `${year}-${month}-${day} `;
          logTransformation(originalValue, normalized, '[Text date formatting]');
          return normalized;
        }
      }
    }

    // Handle birth date-same logic as enrollment date
    if (field === 'birth_date') {
      // Use the same date parsing logic as enrollment_date
      const dateFormats = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // MM/DD/YYYY or MM-DD-YYYY
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
        /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/, // MM DD YYYY
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/, // MM/DD/YY or MM-DD-YY
      ];

      for (const format of dateFormats) {
        const match = value.match(format);
        if (match) {
          let year, month, day;
          if (format === dateFormats[0] || format === dateFormats[3]) {
            [, month, day, year] = match;
            if (year.length === 2) {
              const currentYear = new Date().getFullYear();
              const century = Math.floor(currentYear / 100) * 100;
              year = (parseInt(year) > 50) ? century + parseInt(year) : century + 100 + parseInt(year);
            }
          } else {
            [, year, month, day] = match;
          }

          month = month.padStart(2, '0');
          day = day.padStart(2, '0');

          const normalized = `${year}-${month}-${day} `;
          logTransformation(originalValue, normalized, '[Birth date formatting]');
          return normalized;
        }
      }
    }

    // Check if this field has value mappings
    if (valueMaps[field]) {
      // First try exact match
      if (valueMaps[field][cleanValue]) {
        return valueMaps[field][cleanValue];
      }

      // Then try partial matching
      for (const [key, normalizedValue] of Object.entries(valueMaps[field])) {
        if (cleanValue.includes(key) || key.includes(cleanValue)) {
          return normalizedValue;
        }
      }

      // For enrollment_term, try to extract semester number
      if (field === 'enrollment_term') {
        const semesterMatch = cleanValue.match(/(\d+)(?:st|nd|rd|th)?\s*(?:sem|semester)/);
        if (semesterMatch) {
          const num = parseInt(semesterMatch[1]);
          if (num === 1) return '1st Semester';
          if (num === 2) return '2nd Semester';
        }

        // Check for summer/midyear keywords
        if (cleanValue.includes('summer')) return 'Summer';
        if (cleanValue.includes('midyear') || cleanValue.includes('mid year')) return 'Midyear';
      }

      // For year_level, try to extract year number with enhanced mapping
      if (field === 'year_level') {
        // Handle FIRST_YEAR, SECOND_YEAR, etc. (uppercase with underscores)
        if (cleanValue === 'first_year' || cleanValue === 'firstyear') {
          const normalized = '1st Year';
          logTransformation(originalValue, normalized, '[Year level-first year]');
          return normalized;
        }
        if (cleanValue === 'second_year' || cleanValue === 'secondyear') {
          const normalized = '2nd Year';
          logTransformation(originalValue, normalized, '[Year level-second year]');
          return normalized;
        }
        if (cleanValue === 'third_year' || cleanValue === 'thirdyear') {
          const normalized = '3rd Year';
          logTransformation(originalValue, normalized, '[Year level-third year]');
          return normalized;
        }
        if (cleanValue === 'fourth_year' || cleanValue === 'fourthyear') {
          const normalized = '4th Year';
          logTransformation(originalValue, normalized, '[Year level-fourth year]');
          return normalized;
        }
        if (cleanValue === 'fifth_year' || cleanValue === 'fifthyear') {
          const normalized = '5th Year';
          logTransformation(originalValue, normalized, '[Year level-fifth year]');
          return normalized;
        }

        // Handle GRADE_12, GRADE_11, etc. (uppercase with underscores)
        const gradeMatch = cleanValue.match(/grade[_\s]*(\d+)/i);
        if (gradeMatch) {
          const grade = parseInt(gradeMatch[1]);
          if (grade >= 7 && grade <= 12) {
            const normalized = `Grade ${grade} `;
            logTransformation(originalValue, normalized, '[Year level-grade]');
            return normalized;
          }
        }

        // Handle regular year patterns
        const yearMatch = cleanValue.match(/(\d+)(?:st|nd|rd|th)?\s*(?:year|yr)/i);
        if (yearMatch) {
          const num = parseInt(yearMatch[1]);
          if (num >= 1 && num <= 5) {
            const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];
            const normalized = `${ordinals[num]} Year`;
            logTransformation(originalValue, normalized, '[Year level-ordinal]');
            return normalized;
          }
        }

        // Handle simple numbers (1, 2, 3, etc.)
        const simpleMatch = cleanValue.match(/^(\d+)$/);
        if (simpleMatch) {
          const num = parseInt(simpleMatch[1]);
          if (num >= 1 && num <= 5) {
            const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];
            const normalized = `${ordinals[num]} Year`;
            logTransformation(originalValue, normalized, '[Year level-simple number]');
            return normalized;
          }
        }
      }

      // For is_currently_enrolled, ALWAYS set to "enrolled" regardless of input
      if (field === 'is_currently_enrolled') {
        const normalized = 'enrolled'; // Always set to enrolled
        logTransformation(originalValue, normalized, '[Enrollment status-always enrolled]');
        return normalized;
      }

      // Handle enrollment_status-normalize to standard values
      if (field === 'enrollment_status') {
        const statusMap = {
          'active': 'ACTIVE',
          'inactive': 'INACTIVE',
          'enrolled': 'ACTIVE',
          'not enrolled': 'INACTIVE',
          'notenrolled': 'INACTIVE',
          'current': 'ACTIVE',
          'present': 'ACTIVE',
          'attending': 'ACTIVE',
          'studying': 'ACTIVE',
          'dropped': 'INACTIVE',
          'withdrawn': 'INACTIVE',
          'suspended': 'INACTIVE',
          'expelled': 'INACTIVE',
          'graduated': 'INACTIVE',
          'completed': 'INACTIVE',
          'finished': 'INACTIVE'
        };

        const normalized = statusMap[cleanValue] || value.toUpperCase();
        logTransformation(originalValue, normalized, '[Enrollment status normalization]');
        return normalized;
      }

      // Handle academic_year-normalize format
      if (field === 'academic_year') {
        let normalized = value.trim();

        // Handle formats like 2024-2025, 2024/2025, 2024-25, etc.
        const yearMatch = normalized.match(/(\d{4})[-\/]?(\d{2,4})?/);
        if (yearMatch) {
          const startYear = yearMatch[1];
          const endYear = yearMatch[2] || (parseInt(startYear) + 1).toString();
          normalized = `${startYear}-${endYear} `;
        }

        logTransformation(originalValue, normalized, '[Academic year formatting]');
        return normalized;
      }

      // Handle semester-normalize to standard values
      if (field === 'semester') {
        const semesterMap = {
          'first': 'FIRST',
          'second': 'SECOND',
          'third': 'THIRD',
          'fourth': 'FOURTH',
          'summer': 'SUMMER',
          'midyear': 'MIDYEAR',
          'mid year': 'MIDYEAR',
          '1st': 'FIRST',
          '2nd': 'SECOND',
          '3rd': 'THIRD',
          '4th': 'FOURTH',
          '1': 'FIRST',
          '2': 'SECOND',
          '3': 'THIRD',
          '4': 'FOURTH',
          'sem1': 'FIRST',
          'sem2': 'SECOND',
          'sem3': 'THIRD',
          'sem4': 'FOURTH'
        };

        const normalized = semesterMap[cleanValue] || value.toUpperCase();
        logTransformation(originalValue, normalized, '[Semester normalization]');
        return normalized;
      }

      // For is_graduating, try intelligent boolean detection
      if (field === 'is_graduating') {
        const positiveValues = ['true', 'yes', '1', 'y', 'graduating', 'will graduate', 'willgraduate', 'final year', 'finalyear', 'senior', 'last year', 'lastyear'];
        const negativeValues = ['false', 'no', '0', 'n', 'not graduating', 'notgraduating', 'not final year', 'notfinalyear', 'not senior', 'notsenior'];

        if (positiveValues.some(val => cleanValue.includes(val))) {
          const normalized = 'true';
          logTransformation(originalValue, normalized, '[Graduating status-positive]');
          return normalized;
        }
        if (negativeValues.some(val => cleanValue.includes(val))) {
          const normalized = 'false';
          logTransformation(originalValue, normalized, '[Graduating status-negative]');
          return normalized;
        }
      }

      // For program, try intelligent program detection
      if (field === 'program') {
        // First try exact matches
        for (const [key, normalizedValue] of Object.entries(valueMaps[field])) {
          if (cleanValue.includes(key) || key.includes(cleanValue)) {
            const normalized = normalizedValue;
            logTransformation(originalValue, normalized, '[Program mapping]');
            return normalized;
          }
        }

        // Enhanced program pattern detection
        const programPatterns = [
          // Computer Science patterns
          { pattern: /computer\s*science|cs|comp\s*sci|computing/i, value: 'Bachelor of Science in Computer Science' },
          { pattern: /information\s*technology|it|infotech/i, value: 'Bachelor of Science in Information Technology' },
          { pattern: /software\s*engineering|se|soft\s*eng/i, value: 'Bachelor of Science in Software Engineering' },
          { pattern: /computer\s*engineering|ce|comp\s*eng/i, value: 'Bachelor of Science in Computer Engineering' },

          // Psychology patterns
          { pattern: /psychology|psych|psy/i, value: 'Bachelor of Arts in Psychology' },
          { pattern: /clinical\s*psychology|clinical\s*psych/i, value: 'Bachelor of Arts in Clinical Psychology' },

          // Engineering patterns
          { pattern: /civil\s*engineering|ce|civil\s*eng/i, value: 'Bachelor of Science in Civil Engineering' },
          { pattern: /mechanical\s*engineering|me|mech\s*eng/i, value: 'Bachelor of Science in Mechanical Engineering' },
          { pattern: /electrical\s*engineering|ee|elec\s*eng/i, value: 'Bachelor of Science in Electrical Engineering' },
          { pattern: /chemical\s*engineering|che|chem\s*eng/i, value: 'Bachelor of Science in Chemical Engineering' },
          { pattern: /industrial\s*engineering|ie|ind\s*eng/i, value: 'Bachelor of Science in Industrial Engineering' },

          // Business patterns
          { pattern: /business\s*administration|ba|bus\s*admin/i, value: 'Bachelor of Science in Business Administration' },
          { pattern: /accountancy|accounting|bsa/i, value: 'Bachelor of Science in Accountancy' },
          { pattern: /marketing|mkt/i, value: 'Bachelor of Science in Marketing' },
          { pattern: /finance|fin/i, value: 'Bachelor of Science in Finance' },
          { pattern: /management|mgt/i, value: 'Bachelor of Science in Management' },

          // Education patterns
          { pattern: /elementary\s*education|elem\s*ed|elem\s*educ/i, value: 'Bachelor of Elementary Education' },
          { pattern: /secondary\s*education|sec\s*ed|sec\s*educ/i, value: 'Bachelor of Secondary Education' },
          { pattern: /early\s*childhood\s*education|ece|early\s*childhood/i, value: 'Bachelor of Early Childhood Education' },

          // Health patterns
          { pattern: /nursing|bsn|bachelor\s*of\s*nursing/i, value: 'Bachelor of Science in Nursing' },
          { pattern: /medicine|md|doctor\s*of\s*medicine/i, value: 'Doctor of Medicine' },
          { pattern: /pharmacy|pharm|bachelor\s*of\s*pharmacy/i, value: 'Bachelor of Science in Pharmacy' },
          { pattern: /physical\s*therapy|pt|phys\s*ther/i, value: 'Bachelor of Science in Physical Therapy' },

          // Arts and Sciences patterns
          { pattern: /biology|bio|bachelor\s*of\s*biology/i, value: 'Bachelor of Science in Biology' },
          { pattern: /chemistry|chem|bachelor\s*of\s*chemistry/i, value: 'Bachelor of Science in Chemistry' },
          { pattern: /mathematics|math|bachelor\s*of\s*mathematics/i, value: 'Bachelor of Science in Mathematics' },
          { pattern: /physics|phys|bachelor\s*of\s*physics/i, value: 'Bachelor of Science in Physics' },
          { pattern: /english|lit|literature/i, value: 'Bachelor of Arts in English' },
          { pattern: /history|hist/i, value: 'Bachelor of Arts in History' },
          { pattern: /political\s*science|pol\s*sci|poli\s*sci/i, value: 'Bachelor of Arts in Political Science' },

          // Technology patterns
          { pattern: /multimedia|multimedia\s*arts|mma/i, value: 'Bachelor of Multimedia Arts' },
          { pattern: /graphics|graphic\s*design|gd/i, value: 'Bachelor of Fine Arts in Graphic Design' },
          { pattern: /animation|anim/i, value: 'Bachelor of Fine Arts in Animation' },

          // Generic patterns
          { pattern: /bachelor\s*of\s*science|bs|bsc/i, value: 'Bachelor of Science' },
          { pattern: /bachelor\s*of\s*arts|ba|baa/i, value: 'Bachelor of Arts' },
          { pattern: /bachelor\s*of\s*engineering|be|beng/i, value: 'Bachelor of Engineering' },
          { pattern: /bachelor\s*of\s*education|bed|beduc/i, value: 'Bachelor of Education' },
        ];

        for (const { pattern, value } of programPatterns) {
          if (pattern.test(cleanValue)) {
            const normalized = value;
            logTransformation(originalValue, normalized, '[Program pattern detection]');
            return normalized;
          }
        }

        // Try to detect common program patterns (legacy)
        if (cleanValue.includes('computer') && cleanValue.includes('science')) {
          const normalized = 'Bachelor of Science in Computer Science';
          logTransformation(originalValue, normalized, '[Program pattern-computer science]');
          return normalized;
        }
        if (cleanValue.includes('psychology') || cleanValue.includes('psych')) {
          const normalized = 'Bachelor of Arts in Psychology';
          logTransformation(originalValue, normalized, '[Program pattern-psychology]');
          return normalized;
        }
        if (cleanValue.includes('engineering')) {
          if (cleanValue.includes('civil')) return 'Bachelor of Science in Civil Engineering';
          if (cleanValue.includes('electrical')) return 'Bachelor of Science in Electrical Engineering';
          if (cleanValue.includes('mechanical')) return 'Bachelor of Science in Mechanical Engineering';
        }
        if (cleanValue.includes('business') || cleanValue.includes('admin')) {
          return 'Bachelor of Science in Business Administration';
        }
        if (cleanValue.includes('nursing')) {
          return 'Bachelor of Science in Nursing';
        }
        if (cleanValue.includes('accounting') || cleanValue.includes('accountancy')) {
          return 'Bachelor of Science in Accountancy';
        }
      }

      // For enrollment_date, try to parse and format dates
      if (field === 'enrollment_date') {
        // Try to parse various date formats
        const dateFormats = [
          /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
          /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
          /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
        ];

        for (const format of dateFormats) {
          const match = cleanValue.match(format);
          if (match) {
            try {
              let year, month, day;
              if (format === dateFormats[0] || format === dateFormats[3]) {
                // YYYY-MM-DD or YYYY/MM/DD
                [, year, month, day] = match;
              } else {
                // MM/DD/YYYY or MM-DD-YYYY
                [, month, day, year] = match;
              }

              // Ensure month and day are zero-padded
              month = month.padStart(2, '0');
              day = day.padStart(2, '0');

              return `${year}-${month}-${day} `;
            } catch (e) {
              // If parsing fails, continue to next format
            }
          }
        }

        // If no date format matches, return original value
        return cleanValue;
      }
    }

    // Handle contact number-clean and validate
    if (field === 'contact_number') {
      let normalized = value.trim().replace(/[^\d+\-\(\)\s]/g, ''); // Keep only digits, +,-, (, ), spaces

      // Remove common prefixes
      normalized = normalized.replace(/^(\+63|63|0)/, '');

      // Ensure it starts with 09 for mobile numbers
      if (normalized.startsWith('9') && normalized.length === 10) {
        normalized = '0' + normalized;
      }

      // Format as 09XX-XXX-XXXX
      if (normalized.length === 11 && normalized.startsWith('09')) {
        normalized = `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)} `;
      }

      logTransformation(originalValue, normalized, '[Contact number formatting]');
      return normalized;
    }

    // Handle email-clean and validate
    if (field === 'email_address') {
      let normalized = value.trim().toLowerCase();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized)) {
        console.warn(`⚠️ Invalid email format:"${originalValue}"`);
      }

      logTransformation(originalValue, normalized, '[Email formatting]');
      return normalized;
    }

    // Handle GPA-normalize decimal format
    if (field === 'gpa') {
      let normalized = value.trim();

      // Extract number from text
      const numberMatch = normalized.match(/(\d+\.?\d*)/);
      if (numberMatch) {
        const num = parseFloat(numberMatch[1]);
        if (num >= 0 && num <= 4) {
          normalized = num.toFixed(2);
          logTransformation(originalValue, normalized, '[GPA formatting]');
          return normalized;
        }
      }
    }

    // Handle units enrolled-ensure it's a number
    if (field === 'units_enrolled') {
      const numberMatch = value.match(/(\d+)/);
      if (numberMatch) {
        const normalized = numberMatch[1];
        logTransformation(originalValue, normalized, '[Units formatting]');
        return normalized;
      }
    }

    // Log any unhandled values for debugging
    if (originalValue !== value) {
      console.log(`ℹ️ Value kept as-is:"${originalValue}"(field:${field})`);
    }

    return value; // Return original value if no normalization found
  };

  // 🚀 INTELLIGENT CSV PARSING SYSTEM 🚀
  // This system can handle ANY CSV format and intelligently map fields to database columns
  // 
  // ✅ SMART FEATURES:
  //-200+ field name variations (student_id, student id, studentid, etc.)
  //-Intelligent date parsing (MM/DD/YYYY, YYYY-MM-DD, text dates, etc.)
  //-Program detection (CS, Computer Science, BSCS, etc.)
  //-Boolean detection (true/false, yes/no, enrolled/active, etc.)
  //-Contact number formatting (09XX-XXX-XXXX)
  //-Email validation and formatting
  //-GPA normalization (0.00-4.00)
  //-Name capitalization (First Last)
  //-Student ID formatting (STU-XXXXX)
  //-Year level detection (1st Year, Grade 12, etc.)
  //-Educational level mapping (ELEMENTARY, HIGH SCHOOL, etc.)
  // 
  // Parse Excel files (.xlsx, .xls)
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row');
          }

          // Get headers from first row
          const rawHeaders = jsonData[0].map(h => String(h).trim().replace(/"/g, ''));

          // Map raw headers to normalized field names (same logic as CSV)
          const headerMapping = {};
          rawHeaders.forEach(header => {
            const normalized = normalizeFieldName(header);
            if (normalized) {
              headerMapping[header] = normalized;
            }
          });

          // Convert data rows to objects
          const processedData = jsonData.slice(1).map((row, index) => {
            const rowObj = {};
            rawHeaders.forEach((header, colIndex) => {
              const value = row[colIndex];
              const normalizedField = headerMapping[header];
              if (normalizedField && value !== undefined && value !== null && value !== '') {
                rowObj[normalizedField] = normalizeFieldValue(normalizedField, String(value));
              }
            });
            return rowObj;
          }).filter(row => Object.keys(row).length > 0); // Remove empty rows

          console.log('Excel file processed:', {
            originalHeaders: rawHeaders,
            mappedHeaders: Object.keys(headerMapping),
            processedRows: processedData.length
          });

          resolve(processedData);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error(`Failed to parse Excel file:${error.message} `));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsBinaryString(file);
    });
  };

  // 🎯 RESULT:Upload ANY CSV with ANY field names and it will work!
  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

          // Map raw headers to normalized field names
          const headerMapping = {};
          const normalizedHeaders = [];

          rawHeaders.forEach(rawHeader => {
            const normalizedHeader = normalizeHeader(rawHeader);
            if (normalizedHeader) {
              headerMapping[rawHeader] = normalizedHeader;
              if (!normalizedHeaders.includes(normalizedHeader)) {
                normalizedHeaders.push(normalizedHeader);
              }
            }
          });

          console.log('=== CSV HEADER MAPPING DEBUG ===');
          console.log('Raw headers from CSV:', rawHeaders);
          console.log('Header mapping:', headerMapping);
          console.log('Normalized headers:', normalizedHeaders);
          console.log('Unmapped headers:', rawHeaders.filter(h => !headerMapping[h]));
          console.log('================================');

          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};

            rawHeaders.forEach((rawHeader, index) => {
              const normalizedHeader = headerMapping[rawHeader];
              if (normalizedHeader) {
                const rawValue = values[index] || '';
                // Apply smart value normalization
                const normalizedValue = normalizeValue(normalizedHeader, rawValue);

                // Log value transformations for debugging
                if (rawValue !== normalizedValue) {
                  console.log(`Value normalized:"${rawValue}" → "${normalizedValue}"(field:${normalizedHeader})`);
                } else {
                  console.log(`Value kept as-is:"${rawValue}"(field:${normalizedHeader})`);
                }

                row[normalizedHeader] = normalizedValue;
              }
            });

            data.push(row);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // CSV validation function
  const validateCSVData = (data) => {
    const requiredFields = ['student_id_number', 'first_name', 'last_name', 'enrollment_term'];
    let validRecords = 0;
    let errorRecords = 0;
    let warningRecords = 0;
    const errors = [];
    const warnings = [];
    const validData = [];

    data.forEach((row, index) => {
      let hasErrors = false;
      let hasWarnings = false;
      const rowErrors = [];
      const rowWarnings = [];

      // Check for missing required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          rowErrors.push(`Missing required field '${field}'`);
          hasErrors = true;
        }
      });

      // Check if we have either enrollment_year OR enrollment_date
      if ((!row.enrollment_year || row.enrollment_year.trim() === '') &&
        (!row.enrollment_date || row.enrollment_date.trim() === '')) {
        rowErrors.push(`Must provide either 'enrollment_year' or 'enrollment_date'`);
        hasErrors = true;
      }

      // Check for valid enrollment year format (YYYY-YYYY) if provided
      if (row.enrollment_year && row.enrollment_year.trim() !== '' && !/^\d{4}-\d{4}$/.test(row.enrollment_year.trim())) {
        rowErrors.push(`Invalid enrollment_year format.Expected YYYY-YYYY, got:${row.enrollment_year} `);
        hasErrors = true;
      }

      // Check for valid enrollment term
      const validTerms = ['1st Semester', '2nd Semester', 'Summer', 'Midyear'];
      if (row.enrollment_term && !validTerms.includes(row.enrollment_term.trim())) {
        rowErrors.push(`Invalid enrollment_term.Expected one of:${validTerms.join(', ')}, got:${row.enrollment_term} `);
        hasErrors = true;
      }

      // is_currently_enrolled will always be set to "enrolled"-no validation needed
      // This field will be automatically normalized to "enrolled" regardless of input

      // Check for valid date format if provided
      if (row.enrollment_date && row.enrollment_date.trim() !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.enrollment_date.trim())) {
          rowErrors.push(`Invalid enrollment_date format.Expected YYYY-MM-DD, got:${row.enrollment_date} `);
          hasErrors = true;
        }
      }

      if (hasErrors) {
        errorRecords++;
        errors.push(`Row ${index + 1}:${rowErrors.join('; ')} `);
      } else {
        validRecords++;
        validData.push(row); // Add valid row to validData array
        if (hasWarnings) {
          warningRecords++;
          warnings.push(`Row ${index + 1}:${rowWarnings.join('; ')} `);
        }
      }
    });

    return {
      totalRecords: data.length,
      validRecords,
      errorRecords,
      warningRecords,
      newRecords: validRecords,
      updatedRecords: 0,
      errors,
      warnings,
      validData
    };
  };

  // Download CSV template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Student ID': '2024-001234',
        'First Name': 'Juan',
        'Last Name': 'Dela Cruz',
        'Academic Year': '2024-2025',
        'Semester': '1st Semester',
        'Currently Enrolled': 'true',
        'Enrollment Date': '2024-08-15',
        'Program': 'Bachelor of Science in Computer Science',
        'Year Level': '1st Year'
      },
      {
        'Student ID': '2024-001235',
        'First Name': 'Maria',
        'Last Name': 'Santos',
        'Academic Year': '', // Optional-will be auto-generated from enrollment_date
        'Semester': '1st Semester',
        'Currently Enrolled': 'true',
        'Enrollment Date': '2024-08-16',
        'Program': 'Bachelor of Arts in Psychology',
        'Year Level': '2nd Year'
      },
      {
        'Student ID': '2024-001236',
        'First Name': 'Jose',
        'Last Name': 'Garcia',
        'Academic Year': '2024',
        'Semester': '1st sem', // Will be normalized to "1st Semester"
        'Currently Enrolled': 'yes', // Will be normalized to "true"
        'Enrollment Date': '08/20/2024', // Will be normalized to "2024-08-20"
        'Program': 'CS', // Will be normalized to "Bachelor of Science in Computer Science"
        'Year Level': '1' // Will be normalized to "1st Year"
      }
    ];

    const headers = ['Student ID', 'First Name', 'Last Name', 'Academic Year', 'Semester', 'Currently Enrolled', 'Enrollment Date', 'Program', 'Year Level'];
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'enrollment_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload CSV data
  const handleCSVUpload = async () => {
    if (!uploadFile || !parsedCSVData) return;

    setUploadProgress({ status: 'uploading', message: 'Uploading student data...' });

    try {
      console.log('Uploading flexible CSV data:', parsedCSVData);
      console.log('Headers:', parsedHeaders);
      console.log('Number of records:', parsedCSVData.length);

      const result = await uploadEnrollmentData(token, parsedCSVData, uploadMode);

      setUploadProgress({
        status: 'success',
        message: `Successfully uploaded ${result.data?.processed_count || result.processed} student records`
      });

      // Refresh students data
      await fetchStudentsData();

      // Reset form
      setUploadFile(null);
      setUploadProgress(null);
      setParsedCSVData(null);
      setParsedHeaders(null);

    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadProgress({
        status: 'error',
        message: 'Upload failed:' + error.message
      });
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setUploadFile(file);
    }
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 p-6 border border-slate-200 dark:border-slate-700 ${color === 'blue' ? 'border-l-[#4A90E2] bg-blue-50 dark:bg-blue-900/20' :
      color === 'green' ? 'border-l-[#4CAF50] bg-green-50 dark:bg-green-900/20' :
        color === 'purple' ? 'border-l-[#4CAF50] bg-green-50 dark:bg-green-900/20' :
          'border-l-[#FDA811] bg-orange-50 dark:bg-orange-900/20'
      } `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className={`text-sm ${changeType === 'increase' ? 'text-[#4CAF50]' :
            changeType === 'decrease' ? 'text-red-600 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            } `}>
            {changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : '→'} {change}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color === 'blue' ? 'bg-blue-100 dark:bg-blue-800' :
          color === 'green' ? 'bg-green-100 dark:bg-green-800' :
            color === 'purple' ? 'bg-green-100 dark:bg-green-800' :
              'bg-orange-100 dark:bg-orange-800'
          } `}>
          <Icon className={`w-6 h-6 ${color === 'blue' ? 'text-[#4A90E2]' :
            color === 'green' ? 'text-[#4CAF50]' :
              color === 'purple' ? 'text-[#4CAF50]' :
                'text-[#FDA811]'
            } `} />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner School Dashboard</h1>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
            ) : schoolInfo ? (
              <>
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome back, {currentUser ? `${currentUser.first_name} ${currentUser.last_name} ` : 'Representative'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {schoolInfo.school.full_name || schoolInfo.school.name}
                  {schoolInfo.school.campus && schoolInfo.school.name !== schoolInfo.school.full_name && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {schoolInfo.school.campus}
                    </span>
                  )}
                </p>
                {schoolInfo.school.address && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    📍 {schoolInfo.school.address}, {schoolInfo.school.city}, {schoolInfo.school.province}
                  </p>
                )}
              </>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">Unable to load school information</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading school information...</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform-translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, uploads..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setActiveTab('upload')}
              className="bg-[#4CAF50] text-white px-4 py-2 rounded-lg hover:bg-[#45A049] flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ))
        ) : (
          statsData.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <CloudUpload className="w-8 h-8 text-[#4CAF50]" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Upload Student Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Upload enrollment data</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Users className="w-8 h-8 text-[#4CAF50]" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage Students</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">View and edit student records</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-[#4CAF50]" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">View Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Generate and download reports</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Wallet className="w-8 h-8 text-[#4CAF50]" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget & Funds</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Manage budget and requests</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Data upload completed</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">150 records processed successfully</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">New student registered</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Juan Cruz Santos-Grade 11</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6">
      {/* Upload Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Student Data</h1>
            <p className="text-gray-600 dark:text-gray-300">Upload any CSV file-we'll extract the required fields automatically</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div
          className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-[#4CAF50] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CloudUpload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload Any Student Data File</h4>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Drag and drop your CSV or Excel file here or click to browse</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
            🎯 <strong>Smart Extraction:</strong> Works with CSV and Excel files! We automatically find and extract:
            <br />• Student ID (any format:ID, Student Number, etc.)
            <br />• First Name (any format:First Name, Given Name, etc.)
            <br />• Last Name (any format:Last Name, Surname, etc.)
            <br />• All students will be marked as "Enrolled"
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45A049] cursor-pointer inline-block"
          >
            Choose File
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Accepted formats:.csv, .xlsx, .xls • Max file size:10MB
          </p>
        </div>
      </div>

      {/* File Requirements */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File Requirements</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
            <span>File must be in CSV format</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
            <span>Maximum file size:10MB</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
            <span>Must include all required fields</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
            <span>Data must be for current academic year</span>
          </li>
        </ul>
      </div>

      {/* File Information and Upload Section */}
      {uploadFile && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File Ready for Upload</h3>

          {/* File Details */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{uploadFile.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Size:{uploadFile.size > 1024 * 1024 ?
                    `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` :
                    `${(uploadFile.size / 1024).toFixed(2)} KB`
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Type:{uploadFile.type || 'CSV file'}
                </p>
                {parsedCSVData && (
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    📊 {parsedCSVData.length} student records found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Mode Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Update Mode:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="merge"
                  checked={uploadMode === 'merge'}
                  onChange={(e) => setUploadMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Merge (Add to existing data)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="replace"
                  checked={uploadMode === 'replace'}
                  onChange={(e) => setUploadMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Replace All (Delete existing data)</span>
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className={`mb-4 p-4 rounded-lg ${uploadProgress.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
              uploadProgress.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
              } `}>
              <div className="flex items-center space-x-2">
                {uploadProgress.status === 'success' && <CheckCircle className="w-5 h-5" />}
                {uploadProgress.status === 'error' && <XCircle className="w-5 h-5" />}
                {uploadProgress.status === 'processing' && <Clock className="w-5 h-5 animate-spin" />}
                {uploadProgress.status === 'uploading' && <CloudUpload className="w-5 h-5 animate-pulse" />}
                <span className="font-medium">{uploadProgress.message}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleCSVUpload}
              disabled={uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'}
              className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45A049] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadProgress?.status === 'uploading' ? 'Uploading...' : 'Upload Data'}
            </button>
            <button
              onClick={() => {
                setUploadFile(null);
                setUploadProgress(null);
              }}
              className="bg-gray-600 dark:bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Validation Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-[#4CAF50] dark:text-green-300">{validationResults.validRecords}</p>
              <p className="text-sm text-green-800 dark:text-green-300">Valid Records</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{validationResults.errorRecords}</p>
              <p className="text-sm text-red-800 dark:text-red-300">Error Records</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{validationResults.warningRecords}</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">Warning Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-[#4CAF50] dark:text-green-300">{validationResults.newRecords}</p>
              <p className="text-sm text-green-800 dark:text-green-300">New Records</p>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            {/* Upload Mode Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Mode:</label>
              <div className="flex space-x-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="merge"
                    checked={uploadMode === 'merge'}
                    onChange={(e) => setUploadMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Merge (Recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="replace"
                    checked={uploadMode === 'replace'}
                    onChange={(e) => setUploadMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Replace All</span>
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
              <div className={`p-4 rounded-lg ${uploadProgress.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                uploadProgress.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                } `}>
                <div className="flex items-center space-x-2">
                  {uploadProgress.status === 'success' && <CheckCircle className="w-5 h-5" />}
                  {uploadProgress.status === 'error' && <XCircle className="w-5 h-5" />}
                  {uploadProgress.status === 'processing' && <Clock className="w-5 h-5 animate-spin" />}
                  {uploadProgress.status === 'uploading' && <CloudUpload className="w-5 h-5 animate-pulse" />}
                  <span className="font-medium">{uploadProgress.message}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {/* Error Details */}
            {validationResults?.errors && validationResults.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">Error Details:</h4>
                <div className="max-h-60 overflow-y-auto">
                  {validationResults.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-700 dark:text-red-300 mb-1 p-2 bg-red-100 dark:bg-red-800/30 rounded">
                      {error}
                    </div>
                  ))}
                  {validationResults.errors.length > 10 && (
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium mt-2">
                      ... and {validationResults.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning Details */}
            {validationResults?.warnings && validationResults.warnings.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">Warning Details:</h4>
                <div className="max-h-60 overflow-y-auto">
                  {validationResults.warnings.slice(0, 10).map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300 mb-1 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded">
                      {warning}
                    </div>
                  ))}
                  {validationResults.warnings.length > 10 && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mt-2">
                      ... and {validationResults.warnings.length - 10} more warnings
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              {validationResults && validationResults.errorRecords === 0 && (
                <button
                  onClick={handleCSVUpload}
                  disabled={uploadProgress?.status === 'uploading'}
                  className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45A049] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress?.status === 'uploading' ? 'Uploading...' : 'Upload Data'}
                </button>
              )}
              <button
                onClick={downloadTemplate}
                className="bg-gray-600 dark:bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-slate-700"
              >
                Download Template
              </button>
              {validationResults?.errors && validationResults.errors.length > 0 && (
                <button className="bg-red-600 dark:bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-700">
                  Download Error Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage student enrollment data</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform-translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Students</option>
              <option value="enrolled">Enrolled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Year Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {studentsLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No students found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm || filterStatus !== 'all'
                            ? 'No students match your current search or filter criteria.'
                            : 'Upload student enrollment data to get started.'
                          }
                        </p>
                      </div>
                      {!searchTerm && filterStatus === 'all' && (
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="bg-[#4CAF50] text-white px-4 py-2 rounded-lg hover:bg-[#45A049] transition-colors"
                        >
                          Upload Student Data
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : students
                .filter(student => {
                  // Check status filter
                  let statusMatch = true;
                  if (filterStatus === 'enrolled') {
                    // For flexible data, always show as enrolled
                    if (student.isFlexible && student.flexibleData) {
                      statusMatch = true;
                    } else {
                      // For regular enrollment data, check is_currently_enrolled
                      const studentEnrollmentData = student.enrollmentData || [];
                      const latestEnrollment = studentEnrollmentData[0];
                      statusMatch = latestEnrollment && latestEnrollment.is_currently_enrolled;
                    }
                  }

                  // Check search term
                  const searchMatch = searchTerm === '' ||
                    (student.first_name && student.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (student.last_name && student.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (student.student_id_number && student.student_id_number.toLowerCase().includes(searchTerm.toLowerCase()));

                  return statusMatch && searchMatch;
                })
                .map((student) => {
                  // Get enrollment data for this student from the student object
                  const studentEnrollmentData = student.enrollmentData || [];
                  const latestEnrollment = studentEnrollmentData[0]; // Most recent enrollment data

                  // Debug logging
                  console.log('Student:', student.student_id_number, 'Enrollment data:', studentEnrollmentData);
                  console.log('Latest enrollment:', latestEnrollment);
                  console.log('Student full object:', student);

                  // For flexible data, extract the actual data
                  let flexibleData = null;
                  if (student.isFlexible && student.flexibleData) {
                    console.log('Flexible data for', student.student_id_number, ':', student.flexibleData);
                    flexibleData = student.flexibleData;
                    console.log('Year Level:', flexibleData.year_level);
                    console.log('Program:', flexibleData.program);
                    console.log('Enrollment Date:', flexibleData.enrollment_date);
                  }

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.student_id_number || student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.full_name || student.name || `${student.first_name} ${student.last_name} `}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {/* Application Status */}
                          {student.scholarshipApplications && student.scholarshipApplications.length > 0 && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.scholarshipApplications[0].status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              student.scholarshipApplications[0].status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                student.scholarshipApplications[0].status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              } `}>
                              App:{student.scholarshipApplications[0].status}
                            </span>
                          )}
                          {/* Always show as Enrolled for unified table data */}
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Enrolled:Yes
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.isFlexible && flexibleData ?
                          (flexibleData.year_level || flexibleData['year level'] || flexibleData.grade || 'N/A') :
                          (latestEnrollment?.year_level || student.currentAcademicRecord?.year_level || student.yearLevel || 'N/A')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.isFlexible && flexibleData ?
                          (flexibleData.program || flexibleData.course || flexibleData.major || 'N/A') :
                          (latestEnrollment?.program || student.currentAcademicRecord?.program || student.program || 'N/A')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.isFlexible && flexibleData ?
                          (flexibleData.enrollment_date || flexibleData['enrollment date'] || flexibleData.date || 'N/A') :
                          (latestEnrollment?.enrollment_date || latestEnrollment?.created_at || student.enrollmentDate || 'N/A')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {latestEnrollment && (
                            <button className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300" title="Enrollment Data Available">
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reports & Analytics</h1>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrollment by Year Level</h3>
            <div className="h-64 flex items-center justify-center">
              <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Available Reports */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-[#4CAF50]" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Enrollment Summary</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Overview by year level and program</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last generated:2024-01-15</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-8 h-8 text-[#4CAF50]" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Scholarship Recipients</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">List of scholarship students</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last generated:2024-01-10</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-8 h-8 text-[#4CAF50]" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Data Quality Report</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Data completeness analysis</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last generated:2024-01-12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderBudget = () => (
    <div className="space-y-6">
      {schoolInfo ? (
        <PartnerSchoolFunds schoolId={schoolInfo.school.id} />
      ) : (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400">Loading school budget info...</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <div className="space-y-8">
          {/* School Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School Name</label>
                <input
                  type="text"
                  value={schoolInfo?.school?.name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campus</label>
                <input
                  type="text"
                  value={schoolInfo?.school?.campus || 'Main Campus'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={currentUser ? `${currentUser.first_name} ${currentUser.last_name} ` : ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={schoolInfo?.school?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="text"
                  value={schoolInfo?.school?.contact_number || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <input
                  type="text"
                  value={schoolInfo?.school?.address ? `${schoolInfo.school.address}, ${schoolInfo.school.city}, ${schoolInfo.school.province} ` : ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Upload Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-approve"
                  className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                />
                <label htmlFor="auto-approve" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-approve uploads
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-verification"
                  defaultChecked
                  className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                />
                <label htmlFor="require-verification" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Require manual verification
                </label>
              </div>
            </div>
          </div>



          {/* Password Change Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password Strength
                        </span>
                        <span className={`text-sm font-medium ${passwordStrength.score === 100 ? 'text-green-600' :
                          passwordStrength.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          } `}>
                          {passwordStrength.score === 100 ? 'Strong' :
                            passwordStrength.score >= 60 ? 'Medium' :
                              'Weak'}
                        </span>
                      </div>

                      {/* Strength Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score === 100 ? 'bg-green-500' :
                            passwordStrength.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            } `}
                          style={{ width: `${passwordStrength.score}% ` }}
                        ></div>
                      </div>

                      {/* Password Requirements */}
                      <div className="space-y-1">
                        {passwordStrength.feedback.map((requirement, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle
                              className={`h-4 w-4 ${requirement.valid ? 'text-green-500' : 'text-gray-400'
                                } `}
                            />
                            <span className={`text-sm ${requirement.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                              } `}>
                              {requirement.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {passwordForm.confirmPassword && (
                    <div className="mt-2 flex items-center space-x-2">
                      <CheckCircle
                        className={`h-4 w-4 ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-500' : 'text-red-500'
                          } `}
                      />
                      <span className={`text-sm ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        } `}>
                        {passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordStrength({ score: 0, feedback: [] });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword || passwordStrength.score < 100 || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="px-6 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45A049] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isChangingPassword ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex justify-end">
            <button className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45A049]">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleDownloadMOA = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MEMORANDUM OF AGREEMENT", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("PARTNER SCHOOL SCHOLARSHIP PROGRAM", 105, 30, { align: "center" });

    // Body Text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let yPos = 50;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = 170; // 210 - 2*20

    const addSection = (title, content) => {
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPos);
      yPos += lineHeight;

      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(content, pageWidth);
      doc.text(splitText, margin, yPos);
      yPos += (splitText.length * 5) + 10;
    };

    addSection("1. Introduction", "This Agreement establishes the terms and conditions under which the Partner School agrees to collaborate with the City Government of Caloocan for the Scholarship Program.");

    addSection("2. Data Privacy & Confidentiality", "The Partner School agrees to handle all student data in strict compliance with the Data Privacy Act of 2012 (RA 10173). All student records, grades, and financial information must be kept confidential and used solely for scholarship validation purposes.");

    addSection("3. Accuracy of Information", "The Partner School certifies that all enrollment data, grades, and student status reports submitted to the system are accurate and verified against official school records. Any discrepancies must be reported immediately.");

    addSection("4. Termination Policy", "The City Government reserves the right to immediately terminate this partnership and revoke all access privileges upon discovery of: Falsification of student records; Unauthorized sharing of data; Submission of ghost students; or Failure to comply with audit requirements. Zero Tolerance Policy Enforced.");

    addSection("5. Agreement Validity", "This agreement remains valid for the current academic year unless terminated earlier due to violations mentioned in Section 4.");

    // Signature Block
    yPos += 20;
    doc.line(margin, yPos, margin + 70, yPos);
    doc.text("Authorized Representative", margin, yPos + 5);
    doc.text("Partner School", margin, yPos + 10);

    doc.line(margin + 90, yPos, margin + 160, yPos);
    doc.text("City Administrator", margin + 90, yPos + 5);
    doc.text("City Government of Caloocan", margin + 90, yPos + 10);

    doc.save("Partner_School_MOA.pdf");
  };

  // If applicant, show only application status view
  if (isApplicant) {
    return <PartnerSchoolApplicationStatus />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-16') : 'w-64'} bg-white border-r border-slate-200/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg dark:bg-slate-900 dark:border-slate-700/50 z-50`}>
        <div className={`${sidebarCollapsed ? 'p-3' : 'p-6'} flex-shrink-0`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              <img src="/GSM_logo.png" alt="GSM Logo" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {loading ? (
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  ) : schoolInfo ? (
                    schoolInfo.school.name.split(' ')[0]
                  ) : (
                    'School'
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Partner School</p>
              </div>
            )}
          </div>
        </div>
        <hr className="border-slate-200 dark:border-slate-700 mx-2 flex-shrink-0" />

        <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'upload', label: 'Upload Data', icon: Upload },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'budget', label: 'Budget', icon: Wallet },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 p-2 md:p-2 rounded-xl transition-all duration-200 text-left ${sidebarCollapsed ? 'px-2 justify-center' : 'px-3'} ${activeTab === item.id
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                } `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-shrink-0 p-2 md:p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOutLocal}
            className={`w-full flex items-center space-x-3 p-2 md:p-3 rounded-xl transition-all duration-200 text-left ${sidebarCollapsed ? 'px-2 justify-center' : 'px-3'} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group`}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 ${isLoggingOutLocal ? 'animate-pulse' : 'group-hover:translate-x-1 transition-transform'}`} />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{isLoggingOutLocal ? 'Logging out...' : 'Logout'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className={`${isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-16' : 'ml-64')} bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors duration-200"
              onClick={handleSidebarToggle}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="hidden md:flex items-center space-x-1">
                <h1 className="text-md font-bold dark:text-white">EDUCATION & SCHOLARSHIP MANAGEMENT</h1>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {getBreadcrumb().join(' > ')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4" />
              <span>{currentUser ? `${currentUser.first_name} ${currentUser.last_name} ` : 'Representative'}</span>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {currentUser?.role || 'ps_rep'}
              </span>
            </div>

            <button className="relative rounded-xl p-2 text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 w-4 h-4 text-white text-xs bg-red-500 rounded-full flex items-center justify-center">1</span>
            </button>

            <button
              className="ml-2 rounded-xl p-2 bg-slate-300 text-slate-600 hover:bg-slate-400 dark:bg-slate-700 dark:text-yellow-400 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path stroke="currentColor" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.46 6.46L5.05 5.05m13.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke="currentColor" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-16' : 'ml-64')} p-6 transition-all duration-300 bg-gray-50 dark:bg-slate-900 min-h-screen`}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && renderSettings()}

        {/* Partnership Compliance Footer */}
        <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8 pb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Partnership Agreement</h3>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4 max-w-4xl">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Termination Policy</h4>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Strict adherence to the partnership guidelines is required. Any breach of terms, data falsification, or violation of student privacy laws will result in the <strong>immediate termination and revocation</strong> of the partnership agreement.
                </p>
                <div className="mt-3 flex space-x-4">
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    View Terms & Conditions
                  </button>
                  <button
                    onClick={handleDownloadMOA}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    Download Agreement (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Guide Modal */}
      {showFieldGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Upload Field Guide</h2>
              <button
                onClick={() => setShowFieldGuide(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Required Fields</h3>
                  <div className="space-y-3">
                    {[
                      { field: 'student_id_number', description: 'Unique student identifier', example: '2024-001' },
                      { field: 'first_name', description: 'Student\'s first name', example: 'Juan' },
                      { field: 'last_name', description: 'Student\'s last name', example: 'Cruz' },
                      { field: 'enrollment_status', description: 'ACTIVE, INACTIVE, GRADUATED, or DROPPED', example: 'ACTIVE' },
                      { field: 'academic_year', description: 'Academic year (YYYY-YYYY)', example: '2024-2025' },
                      { field: 'semester', description: 'FIRST, SECOND, or SUMMER', example: 'FIRST' },
                      { field: 'year_level', description: 'GRADE_7 to GRADE_12 or FIRST_YEAR to FIFTH_YEAR', example: 'GRADE_11' },
                      { field: 'enrollment_date', description: 'Date in YYYY-MM-DD format', example: '2024-06-15' }
                    ].map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.field}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                          </div>
                          <code className="text-sm bg-white dark:bg-slate-600 text-gray-900 dark:text-white px-2 py-1 rounded border border-gray-200 dark:border-slate-600">{item.example}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partner School Agreement</h2>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Introduction</h3>
                  <p>This Agreement establishes the terms and conditions under which the Partner School agrees to collaborate with the City Government of Caloocan for the Scholarship Program.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Data Privacy & Confidentiality</h3>
                  <p>The Partner School agrees to handle all student data in strict compliance with the Data Privacy Act of 2012 (RA 10173). All student records, grades, and financial information must be kept confidential and used solely for scholarship validation purposes.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Accuracy of Information</h3>
                  <p>The Partner School certifies that all enrollment data, grades, and student status reports submitted to the system are accurate and verified against official school records. Any discrepancies must be reported immediately.</p>
                </section>

                <section className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    4. Termination Policy
                  </h3>
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    The City Government reserves the right to immediately terminate this partnership and revoke all access privileges upon discovery of:
                  </p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-red-700 dark:text-red-300">
                    <li>Falsification of student records or grades.</li>
                    <li>Unauthorized sharing or selling of student data.</li>
                    <li>Submission of ghost students or non-existent enrollments.</li>
                    <li>Failure to comply with audit requirements.</li>
                  </ul>
                  <p className="mt-3 text-red-800 dark:text-red-300 font-bold uppercase text-xs tracking-wider">
                    Zero Tolerance Policy Enforced
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Agreement Validity</h3>
                  <p>This agreement remains valid for the current academic year unless terminated earlier due to violations mentioned in Section 4.</p>
                </section>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 bg-[#4CAF50] hover:bg-[#45A049] text-white font-medium rounded-lg shadow-sm transition-all transform active:scale-95"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSchoolDashboard;
