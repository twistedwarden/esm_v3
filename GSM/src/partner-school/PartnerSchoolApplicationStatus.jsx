import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/v1authStore';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertCircle,
  Upload,
  Eye,
  EyeOff,
  LogOut,
  Home,
  RefreshCw,
  BookOpen,
  Lock,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Send,
  Ban,
} from 'lucide-react';
import { API_CONFIG, getAuthServiceUrl } from '../config/api';
import { getGuidelines } from '../services/partnerSchoolGuidelinesService';
import { getSchoolClassifications } from '../services/schoolService';

const SCHOLARSHIP_API_BASE_URL = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;

const PartnerSchoolApplicationStatus = () => {
  const { currentUser, logout, token } = useAuthStore();
  const [application, setApplication] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  
  // Document upload state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    document_type: 'other',
    document_name: '',
    file: null,
  });
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Guidelines state
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [guidelines, setGuidelines] = useState({});
  const [guidelinesLoading, setGuidelinesLoading] = useState(false);
  const [guidelinesError, setGuidelinesError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    requirements: true,
    benefits: true,
    responsibilities: true,
    process: true,
  });
  
  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // School information form state
  const [showSchoolInfoModal, setShowSchoolInfoModal] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    classification: '',
    address: '',
    city: '',
    province: '',
    region: '',
    contact_number: '',
  });
  const [isUpdatingSchool, setIsUpdatingSchool] = useState(false);
  const [schoolUpdateError, setSchoolUpdateError] = useState(null);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch application status using the new endpoint
        const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/my-application`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSchool(data.data.school);
            setApplication(data.data.application);
          } else {
            setError(data.message || 'Failed to fetch application status');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch application status');
        }
      } catch (err) {
        console.error('Error fetching application status:', err);
        setError(err.message || 'Failed to fetch application status');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [token, currentUser]);

  // Initialize school form when school data is loaded
  useEffect(() => {
    if (school) {
      setSchoolForm({
        classification: school.classification || '',
        address: school.address || '',
        city: school.city || '',
        province: school.province || '',
        region: school.region || '',
        contact_number: school.contact_number || '',
      });
    }
  }, [school]);

  const handleUpdateSchoolInfo = async (e) => {
    e.preventDefault();
    
    if (!school || !school.id) {
      alert('School information not available');
      return;
    }

    setIsUpdatingSchool(true);
    setSchoolUpdateError(null);

    try {
      const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/school-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(schoolForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('School information updated successfully');
          setShowSchoolInfoModal(false);
          
          // Refresh application data
          const appResponse = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/my-application`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          if (appResponse.ok) {
            const appData = await appResponse.json();
            if (appData.success) {
              setSchool(appData.data.school);
            }
          }
        } else {
          setSchoolUpdateError(data.message || 'Failed to update school information');
        }
      } else {
        const errorData = await response.json();
        setSchoolUpdateError(errorData.message || 'Failed to update school information');
      }
    } catch (error) {
      console.error('Error updating school information:', error);
      setSchoolUpdateError('An error occurred while updating school information');
    } finally {
      setIsUpdatingSchool(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!application || !application.id) {
      alert('No application found. Please contact the administrator.');
      return;
    }

    if (application.status !== 'draft') {
      alert('Only draft applications can be submitted.');
      return;
    }

    if (!window.confirm('Submit this application for review? You will still be able to upload documents while it is under review.')) {
      return;
    }

    try {
      const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${application.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Application submitted successfully.');

          // Refresh application data
          const appResponse = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/my-application`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          if (appResponse.ok) {
            const appData = await appResponse.json();
            if (appData.success) {
              setSchool(appData.data.school);
              setApplication(appData.data.application);
            }
          }
        } else {
          alert(data.message || 'Failed to submit application');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('An error occurred while submitting application');
    }
  };

  const handleWithdrawApplication = async () => {
    if (!application || !application.id) {
      alert('No application found. Please contact the administrator.');
      return;
    }

    // Can only withdraw submitted or under_review applications
    if (!['submitted', 'under_review'].includes(application.status)) {
      alert('Only submitted or under review applications can be withdrawn.');
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${application.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh application data
          const appResponse = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/my-application`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          if (appResponse.ok) {
            const appData = await appResponse.json();
            if (appData.success) {
              setSchool(appData.data.school);
              setApplication(appData.data.application);
            }
          }
          setShowWithdrawModal(false);
          alert('Application withdrawn successfully.');
        } else {
          alert(data.message || 'Failed to withdraw application');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('An error occurred while withdrawing application');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 10) {
      score += 20;
    } else {
      feedback.push({ text: 'At least 10 characters', valid: false });
    }

    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push({ text: 'At least one lowercase letter', valid: false });
    }

    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push({ text: 'At least one uppercase letter', valid: false });
    }

    if (/[0-9]/.test(password)) {
      score += 20;
    } else {
      feedback.push({ text: 'At least one number', valid: false });
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    } else {
      feedback.push({ text: 'At least one special character', valid: false });
    }

    // Mark valid requirements
    feedback.forEach(item => {
      if (!item.valid) {
        const requirement = item.text;
        if (password.length >= 10 && requirement.includes('10 characters')) item.valid = true;
        if (/[a-z]/.test(password) && requirement.includes('lowercase')) item.valid = true;
        if (/[A-Z]/.test(password) && requirement.includes('uppercase')) item.valid = true;
        if (/[0-9]/.test(password) && requirement.includes('number')) item.valid = true;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password) && requirement.includes('special')) item.valid = true;
      }
    });

    return { score, feedback };
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

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
      const response = await fetch(getAuthServiceUrl('/api/change-password'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        setShowPasswordModal(false);
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

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!documentForm.file || !documentForm.document_name) {
      alert('Please fill in all required fields');
      return;
    }

    if (!application || !application.id) {
      alert('No application found. Please contact the administrator.');
      return;
    }

    setIsUploadingDocument(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('document_type', documentForm.document_type);
      formData.append('document_name', documentForm.document_name);
      formData.append('file', documentForm.file);

      const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${application.id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert('Document uploaded successfully');
        setDocumentForm({
          document_type: 'other',
          document_name: '',
          file: null,
        });
        setSelectedRequirement(null);
        setShowDocumentModal(false);
        
        // Refresh application data to show new document
        const appResponse = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/my-application`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (appResponse.ok) {
          const appData = await appResponse.json();
          if (appData.success) {
            setApplication(appData.data.application);
          }
        }
      } else {
        const errorData = await response.json();
        setUploadError(errorData.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('An error occurred while uploading document');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const validateFile = (file) => {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, PNG, or DOC/DOCX files.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setDocumentForm(prev => ({ ...prev, file }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setDocumentForm(prev => ({ ...prev, file }));
      }
    }
  };

  const handleOpenUploadModal = (requirement = null) => {
    if (requirement) {
      setSelectedRequirement(requirement);
      // Pre-fill document name with requirement title
      setDocumentForm({
        document_type: 'other',
        document_name: requirement.title,
        file: null,
      });
    } else {
      setSelectedRequirement(null);
      setDocumentForm({
        document_type: 'other',
        document_name: '',
        file: null,
      });
    }
    setShowDocumentModal(true);
  };

  // Fetch guidelines on component mount
  useEffect(() => {
    if (Object.keys(guidelines).length === 0) {
      fetchGuidelines();
    }
  }, []);

  // Fetch guidelines when modal opens (always fetch fresh data)
  useEffect(() => {
    if (showGuidelinesModal || showDocumentModal) {
      fetchGuidelines();
    }
  }, [showGuidelinesModal, showDocumentModal]);

  const fetchGuidelines = async () => {
    try {
      setGuidelinesLoading(true);
      setGuidelinesError(null);
      const data = await getGuidelines();
      setGuidelines(data);
    } catch (err) {
      console.error('Error fetching guidelines:', err);
      setGuidelinesError(err.message || 'Failed to load guidelines');
    } finally {
      setGuidelinesLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDownloadMOA = async () => {
    try {
      const response = await fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/download-moa`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MOA_${school?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download MOA');
      }
    } catch (error) {
      console.error('Error downloading MOA:', error);
      alert('An error occurred while downloading MOA');
    }
  };

  const sectionIcons = {
    requirements: CheckCircle,
    benefits: BookOpen,
    responsibilities: FileText,
    process: Clock,
  };

  const sectionTitles = {
    requirements: 'Requirements',
    benefits: 'Benefits',
    responsibilities: 'Responsibilities',
    process: 'Application Process',
  };

  const getStatusInfo = () => {
    if (!school) return null;

    const status = school.verification_status || 'not_applied';
    const appStatus = application?.status;

    const colorMap = {
      gray: 'text-gray-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      red: 'text-red-500',
      blue: 'text-blue-500',
    };

    switch (status) {
      case 'not_applied':
        return {
          icon: AlertCircle,
          color: 'gray',
          colorClass: colorMap.gray,
          title: 'Application Not Started',
          message: 'Your school has not yet submitted an application to become a partner school.',
          description: 'Please contact the administrator to begin the application process.',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'yellow',
          colorClass: colorMap.yellow,
          title: 'Application Under Review',
          message: 'Your application is being reviewed by our team.',
          description: 'We will notify you once a decision has been made.',
        };
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'green',
          colorClass: colorMap.green,
          title: 'Application Approved',
          message: 'Congratulations! Your school has been verified as a partner school.',
          description: 'You now have access to the full partner school dashboard.',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'red',
          colorClass: colorMap.red,
          title: 'Application Rejected',
          message: application?.rejection_reason || 'Your application was not approved.',
          description: 'Please contact the administrator if you have questions or wish to reapply.',
        };
      default:
        return {
          icon: Clock,
          color: 'blue',
          colorClass: colorMap.blue,
          title: 'Application Status',
          message: 'Your application status is being processed.',
        };
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
      under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner School Application</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {school?.name || 'School Application Status'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.first_name} {currentUser?.last_name}
              </span>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-6">
          {statusInfo && (
            <>
              <div className="flex items-center gap-4 mb-6">
                {React.createElement(statusInfo.icon, {
                  className: `w-12 h-12 ${statusInfo.colorClass || 'text-gray-500'}`
                })}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {statusInfo.title}
                  </h2>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    {statusInfo.message}
                  </p>
                  {statusInfo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {statusInfo.description}
                    </p>
                  )}
                </div>
              </div>

              {/* School Information Section */}
              {school && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      School Information
                    </h3>
                    {(school.verification_status === 'pending' || school.verification_status === 'not_applied') && (
                      <button
                        onClick={() => setShowSchoolInfoModal(true)}
                        className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                      >
                        {school.classification || school.address ? 'Update Information' : 'Complete School Information'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Classification</p>
                      <p className="text-gray-900 dark:text-white">
                        {school.classification || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contact Number</p>
                      <p className="text-gray-900 dark:text-white">
                        {school.contact_number || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                      <p className="text-gray-900 dark:text-white">
                        {school.address 
                          ? `${school.address}${school.city ? ', ' + school.city : ''}${school.province ? ', ' + school.province : ''}${school.region ? ', ' + school.region : ''}`
                          : <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Application Details */}
              {application && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Application Details
                  </h3>
                  <div className="space-y-6">
                    {/* Status and Dates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Status</p>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted Date</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {application.submitted_at 
                            ? new Date(application.submitted_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Not submitted'}
                        </p>
                      </div>
                      {application.reviewed_at && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reviewed Date</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {new Date(application.reviewed_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Application Section - Only for Draft */}
                    {application.status === 'draft' && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              application.verification_documents &&
                              guidelines.requirements &&
                              application.verification_documents.length >= guidelines.requirements.length
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-orange-100 dark:bg-orange-900/30'
                            }`}>
                              <Send className={`w-6 h-6 ${
                                application.verification_documents &&
                                guidelines.requirements &&
                                application.verification_documents.length >= guidelines.requirements.length
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-orange-600 dark:text-orange-400'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                              Ready to Submit?
                            </h4>
                            {application.verification_documents &&
                              guidelines.requirements &&
                              application.verification_documents.length >= guidelines.requirements.length ? (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                All required documents have been uploaded. You can now submit your application for review.
                              </p>
                            ) : (
                              <div className="mb-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  Please upload all required documents before submitting your application.
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold text-orange-700 dark:text-orange-300">
                                    {application.verification_documents ? application.verification_documents.length : 0} 
                                    <span className="text-gray-600 dark:text-gray-400"> of </span>
                                    {guidelines.requirements ? guidelines.requirements.length : 0}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">documents uploaded</span>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={handleSubmitApplication}
                              disabled={
                                !application.verification_documents ||
                                !guidelines.requirements ||
                                application.verification_documents.length < guidelines.requirements.length
                              }
                              className={`inline-flex items-center px-6 py-3 text-base font-bold rounded-lg shadow-md transition-all transform hover:scale-105 ${
                                !application.verification_documents ||
                                !guidelines.requirements ||
                                application.verification_documents.length < guidelines.requirements.length
                                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none transform-none'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-lg'
                              }`}
                            >
                              <Send className="w-5 h-5 mr-2" />
                              Submit Application
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Withdraw Application Section - For Submitted/Under Review */}
                    {(application.status === 'submitted' || application.status === 'under_review') && (
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                              Withdraw Application
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                              If you wish to withdraw your application, you can do so by clicking the button below. 
                              This action cannot be undone.
                            </p>
                            <button
                              onClick={() => setShowWithdrawModal(true)}
                              className="inline-flex items-center px-6 py-3 text-base font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                            >
                              <Ban className="w-5 h-5 mr-2" />
                              Withdraw Application
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {application.rejection_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                              Rejection Reason
                            </p>
                            <p className="text-sm text-red-800 dark:text-red-300">
                              {application.rejection_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Documents
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Upload required documents according to guidelines
                    </p>
                  </div>
                  {application && (
                    <button
                      onClick={() => setShowGuidelinesModal(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Guidelines
                    </button>
                  )}
                </div>

                {/* Completion Progress */}
                {guidelines.requirements && guidelines.requirements.length > 0 && (
                  <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Completion Progress
                      </span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {application && application.verification_documents 
                          ? Math.round((application.verification_documents.length / guidelines.requirements.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                          application && application.verification_documents && 
                          application.verification_documents.length === guidelines.requirements.length
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : application && application.verification_documents && 
                              application.verification_documents.length > 0
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400'
                        }`}
                        style={{
                          width: `${application && application.verification_documents 
                            ? Math.round((application.verification_documents.length / guidelines.requirements.length) * 100)
                            : 0}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {application && application.verification_documents 
                        ? `${application.verification_documents.length} of ${guidelines.requirements.length} required documents submitted`
                        : `0 of ${guidelines.requirements.length} required documents submitted`}
                    </p>
                  </div>
                )}

                {/* No Application Message */}
                {!application && (
                  <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                          Application Required
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          An application must be created before you can upload documents. Please contact the administrator to create an application for your school.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                {guidelines.requirements && guidelines.requirements.length > 0 ? (
                  <div className="space-y-3">
                    {guidelines.requirements.map((requirement, idx) => {
                      // Find matching uploaded document
                      const matchingDoc = application && application.verification_documents && 
                        application.verification_documents.find(doc => 
                          doc.document_name?.toLowerCase().includes(requirement.title.toLowerCase().substring(0, 15)) ||
                          requirement.title.toLowerCase().includes(doc.document_name?.toLowerCase().substring(0, 15) || '')
                        );

                      const isSubmitted = !!matchingDoc;
                      const status = matchingDoc?.verification_status || 'pending';
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                            isSubmitted
                              ? status === 'verified'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : status === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              <div className="flex-shrink-0 mt-0.5">
                                {isSubmitted ? (
                                  status === 'verified' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                  ) : status === 'rejected' ? (
                                    <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                  )
                                ) : (
                                  <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {requirement.title}
                                  </h3>
                                  <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                                    Required
                                  </span>
                                </div>
                                {requirement.content && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                    {requirement.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                                    {requirement.content.length > 100 ? '...' : ''}
                                  </p>
                                )}
                                {isSubmitted && matchingDoc && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                      <FileText className="w-3.5 h-3.5" />
                                      <span className="font-medium">{matchingDoc.document_name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                                      {matchingDoc.file_size && (
                                        <span>{(matchingDoc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                      )}
                                      <span>Uploaded: {new Date(matchingDoc.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                isSubmitted
                                  ? status === 'verified'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : status === 'rejected'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {isSubmitted
                                  ? status === 'verified'
                                    ? '✓ Verified'
                                    : status === 'rejected'
                                    ? '✗ Rejected'
                                    : '⏱ Pending'
                                  : '⚠ Missing'
                                }
                              </span>
                              {isSubmitted && matchingDoc ? (
                                <div className="flex gap-1 ml-1">
                                  <button
                                    onClick={() => {
                                      fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${application.id}/documents/${matchingDoc.id}/view`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      })
                                        .then(response => {
                                          if (!response.ok) throw new Error('Failed to fetch document');
                                          return response.blob();
                                        })
                                        .then(blob => {
                                          const url = window.URL.createObjectURL(blob);
                                          window.open(url, '_blank', 'noopener,noreferrer');
                                          setTimeout(() => window.URL.revokeObjectURL(url), 100);
                                        })
                                        .catch(error => {
                                          console.error('Error viewing document:', error);
                                          alert('Failed to view document');
                                        });
                                    }}
                                    className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="View document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      fetch(`${SCHOLARSHIP_API_BASE_URL}/api/partner-school/applications/${application.id}/documents/${matchingDoc.id}/download`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      })
                                        .then(response => {
                                          if (!response.ok) throw new Error('Failed to download document');
                                          return response.blob();
                                        })
                                        .then(blob => {
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = matchingDoc.document_name || 'document';
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          window.URL.revokeObjectURL(url);
                                        })
                                        .catch(error => {
                                          console.error('Error downloading document:', error);
                                          alert('Failed to download document');
                                        });
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                    title="Download document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : !isSubmitted && application?.id ? (
                                <button
                                  onClick={() => handleOpenUploadModal(requirement)}
                                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-medium shadow-sm hover:shadow-md"
                                  title="Upload document"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Upload
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No document requirements found</p>
                    <p className="text-xs mt-1">Review guidelines to see required documents</p>
                  </div>
                )}
              </div>

            </>
          )}
        </div>

        {/* Guidelines Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Partner School Guidelines
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Review the partner school guidelines to understand the requirements and benefits of becoming a partner school.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowGuidelinesModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              View Guidelines
            </button>
            <button
              onClick={handleDownloadMOA}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download MOA Template
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordStrength({ score: 0, feedback: [] });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                
                {passwordForm.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password Strength
                      </span>
                      <span className={`text-sm font-medium ${
                        passwordStrength.score === 100 ? 'text-green-600' :
                        passwordStrength.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength.score === 100 ? 'Strong' :
                         passwordStrength.score >= 60 ? 'Medium' :
                         'Weak'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score === 100 ? 'bg-green-500' :
                          passwordStrength.score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${passwordStrength.score}%` }}
                      ></div>
                    </div>
                    
                    <div className="space-y-1">
                      {passwordStrength.feedback.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle 
                            className={`h-4 w-4 ${
                              requirement.valid ? 'text-green-500' : 'text-gray-400'
                            }`} 
                          />
                          <span className={`text-sm ${
                            requirement.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {requirement.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                
                {passwordForm.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    <CheckCircle 
                      className={`h-4 w-4 ${
                        passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-500' : 'text-red-500'
                      }`} 
                    />
                    <span className={`text-sm ${
                      passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordStrength({ score: 0, feedback: [] });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword || passwordStrength.score < 100 || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Document</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upload required documents according to partner school guidelines
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setDocumentForm({ document_type: 'other', document_name: '', file: null });
                    setSelectedRequirement(null);
                    setUploadError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Target Requirement Section (if uploading for specific requirement) */}
              {selectedRequirement && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-1">
                        Uploading for: {selectedRequirement.title}
                      </h3>
                      {selectedRequirement.content && (
                        <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                          {selectedRequirement.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                          {selectedRequirement.content.length > 150 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Guidelines Reference Section */}
              {!selectedRequirement && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                          Required Documents
                        </h3>
                        {application && application.verification_documents && guidelines.requirements && (
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {application.verification_documents.length}/{guidelines.requirements.length} uploaded
                          </span>
                        )}
                      </div>
                      {guidelines.requirements && guidelines.requirements.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                            {guidelines.requirements.slice(0, 5).map((req, idx) => {
                              const hasDocument = application && application.verification_documents && 
                                application.verification_documents.some(doc => 
                                  doc.document_name?.toLowerCase().includes(req.title.toLowerCase().substring(0, 10)) ||
                                  req.title.toLowerCase().includes(doc.document_name?.toLowerCase().substring(0, 10) || '')
                                );
                              
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                                    hasDocument 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                      : 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-300'
                                  }`}
                                >
                                  {hasDocument ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 border-2 border-blue-400 dark:border-blue-500 rounded flex-shrink-0" />
                                  )}
                                  <span className={hasDocument ? 'line-through opacity-75' : ''}>
                                    {req.title}
                                  </span>
                                </div>
                              );
                            })}
                            {guidelines.requirements.length > 5 && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                + {guidelines.requirements.length - 5} more requirements
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDocumentModal(false);
                              setShowGuidelinesModal(true);
                            }}
                            className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline flex items-center gap-1"
                          >
                            View full guidelines with details →
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            Review the partner school guidelines to see all required documents.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDocumentModal(false);
                              setShowGuidelinesModal(true);
                            }}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline whitespace-nowrap ml-3"
                          >
                            View Guidelines →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleDocumentUpload} className="space-y-4">
                {uploadError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-200">{uploadError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={documentForm.document_type}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, document_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select document type...</option>
                    <option value="accreditation">Accreditation Certificate</option>
                    <option value="license">Business License / Permit</option>
                    <option value="registration">Registration Certificate</option>
                    <option value="tax">Tax Identification</option>
                    <option value="bank">Bank Account Information</option>
                    <option value="authorization">Authorization Letter</option>
                    <option value="other">Other Document</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the type that best matches your document from the requirements
                  </p>
                </div>

                {/* Suggested Requirements Based on Selection */}
                {documentForm.document_type && guidelines.requirements && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-2">
                      Matching Requirements:
                    </p>
                    <div className="space-y-1">
                      {guidelines.requirements
                        .filter(req => {
                          const docType = documentForm.document_type.toLowerCase();
                          const reqTitle = req.title.toLowerCase();
                          return reqTitle.includes(docType) || 
                                 (docType === 'accreditation' && reqTitle.includes('accredit')) ||
                                 (docType === 'license' && (reqTitle.includes('license') || reqTitle.includes('permit'))) ||
                                 (docType === 'registration' && reqTitle.includes('regist')) ||
                                 (docType === 'tax' && reqTitle.includes('tax')) ||
                                 (docType === 'bank' && reqTitle.includes('bank')) ||
                                 (docType === 'authorization' && reqTitle.includes('author'));
                        })
                        .slice(0, 3)
                        .map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>{req.title}</span>
                          </div>
                        ))}
                      {guidelines.requirements.filter(req => {
                        const docType = documentForm.document_type.toLowerCase();
                        const reqTitle = req.title.toLowerCase();
                        return reqTitle.includes(docType) || 
                               (docType === 'accreditation' && reqTitle.includes('accredit')) ||
                               (docType === 'license' && (reqTitle.includes('license') || reqTitle.includes('permit'))) ||
                               (docType === 'registration' && reqTitle.includes('regist')) ||
                               (docType === 'tax' && reqTitle.includes('tax')) ||
                               (docType === 'bank' && reqTitle.includes('bank')) ||
                               (docType === 'authorization' && reqTitle.includes('author'));
                      }).length === 0 && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 italic">
                          No matching requirement found. Make sure your document name clearly indicates which requirement it fulfills.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentForm.document_name}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, document_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder={selectedRequirement ? selectedRequirement.title : "e.g., Business Permit 2024, Accreditation Certificate"}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {selectedRequirement 
                      ? `This document will be linked to: ${selectedRequirement.title}`
                      : 'Provide a clear, descriptive name for this document'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                      dragActive
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-1 text-center">
                      <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-green-500' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center items-center">
                        <label className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors">
                          <span className="px-3 py-1">Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-2">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, JPG, PNG, DOC, DOCX up to 10MB
                      </p>
                      {documentForm.file && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">
                              {documentForm.file.name}
                            </p>
                            <span className="text-xs text-green-700 dark:text-green-300">
                              ({(documentForm.file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Tips */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                        Upload Tips:
                      </p>
                      <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                        <li>Ensure documents are clear and legible</li>
                        <li>Upload documents in PDF format when possible</li>
                        <li>Make sure file size is under 10MB</li>
                        <li>Verify document names match the actual content</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocumentModal(false);
                      setShowGuidelinesModal(true);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Guidelines
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocumentModal(false);
                        setDocumentForm({ document_type: 'other', document_name: '', file: null });
                        setSelectedRequirement(null);
                        setUploadError(null);
                        setDragActive(false);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingDocument || !documentForm.file || !documentForm.document_name || !documentForm.document_type}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      {isUploadingDocument ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Upload Document</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Partner School Guidelines</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchGuidelines}
                  disabled={guidelinesLoading}
                  className="text-gray-500 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Guidelines"
                >
                  <RefreshCw className={`w-5 h-5 ${guidelinesLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowGuidelinesModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {guidelinesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading guidelines...</p>
                </div>
              ) : guidelinesError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-red-800 dark:text-red-200">{guidelinesError}</p>
                  </div>
                </div>
              ) : Object.keys(guidelines).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No guidelines available at this time.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(guidelines).map(([section, items]) => {
                    const Icon = sectionIcons[section] || FileText;
                    const title = sectionTitles[section] || section;
                    const isExpanded = expandedSections[section] !== false;

                    return (
                      <div
                        key={section}
                        className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSection(section)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {title}
                            </h3>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {Array.isArray(items) && items.length > 0 ? (
                              items.map((item, index) => (
                                <div
                                  key={item.id || index}
                                  className="border-l-4 border-green-500 pl-4 py-2"
                                >
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {item.title}
                                  </h4>
                                  {item.content && (
                                    <div
                                      className="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                                      dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                  )}
                                  {item.description && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                No items in this section.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* School Information Update Modal */}
      {showSchoolInfoModal && school && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Information</h2>
              <button
                onClick={() => {
                  setShowSchoolInfoModal(false);
                  setSchoolUpdateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSchoolInfo} className="space-y-4">
              {schoolUpdateError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{schoolUpdateError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Classification <span className="text-red-500">*</span>
                </label>
                <select
                  value={schoolForm.classification}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, classification: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select classification...</option>
                  {getSchoolClassifications().map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Street address, building, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province
                  </label>
                  <input
                    type="text"
                    value={schoolForm.province}
                    onChange={(e) => setSchoolForm(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    value={schoolForm.region}
                    onChange={(e) => setSchoolForm(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Region"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={schoolForm.contact_number}
                  onChange={(e) => setSchoolForm(prev => ({ ...prev, contact_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="09123456789"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSchoolInfoModal(false);
                    setSchoolUpdateError(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSchool || !schoolForm.classification}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isUpdatingSchool ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Information</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Application Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Withdraw Application
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                        Warning: This action cannot be undone
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        Withdrawing your application will:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-300 mt-2 space-y-1">
                        <li>Cancel your application immediately</li>
                        <li>Stop the review process</li>
                        <li>Reset your verification status</li>
                        <li>Require you to reapply if you change your mind</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to withdraw your partner school application?
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawApplication}
                disabled={isWithdrawing}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Yes, Withdraw</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSchoolApplicationStatus;
