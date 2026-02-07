import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/v1authStore';
import { scholarshipApiService } from '../../services/scholarshipApiService';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { GraduationCap, Calendar, PhilippinePeso, CheckCircle, Clock, AlertCircle, Clipboard, UserCheck, FileCheck, Hourglass, HandCoins, RefreshCw, Upload, Send, Edit, ChevronUp, Users, Home, Phone, Heart, Wallet, School, ChevronDown, Bell, X, Info, CheckCircle2, AlertTriangle, MessageSquare, Download, Eye, FileText } from 'lucide-react';
import { SecureDocumentUpload } from '../../components/ui/SecureDocumentUpload';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
// EnrollmentVerificationCard removed - automatic verification disabled
import InterviewScheduleCard from '../../components/InterviewScheduleCard';

export const ScholarshipDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Disbursements state
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [isLoadingDisbursements, setIsLoadingDisbursements] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    family: true,
    academic: true,
    financial: true,
    application: true,
    documents: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Notification functions
  const generateMockNotifications = useCallback((application: any) => {
    const mockNotifications = [];
    const readNotificationIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');

    if (application) {
      // Status-based notifications (Historical)

      // Submitted
      if (application.submitted_at) {
        const id = 1;
        mockNotifications.push({
          id,
          type: 'info',
          title: 'Application Submitted',
          message: 'Your scholarship application has been successfully submitted and is now under review.',
          timestamp: new Date(application.submitted_at),
          isRead: readNotificationIds.includes(id),
          priority: 'high'
        });
      }

      // Reviewed
      if (application.reviewed_at) {
        const id = 2;
        mockNotifications.push({
          id,
          type: 'success',
          title: 'Application Reviewed',
          message: 'Your application has been reviewed by the Student Services Committee.',
          timestamp: new Date(application.reviewed_at),
          isRead: readNotificationIds.includes(id),
          priority: 'high'
        });
      }

      // Interview Completed
      if (application.interview_completed_at) {
        const id = 6;
        mockNotifications.push({
          id,
          type: 'success',
          title: 'Interview Completed',
          message: 'Your interview has been completed. The results are being reviewed by the committee.',
          timestamp: new Date(application.interview_completed_at),
          isRead: readNotificationIds.includes(id),
          priority: 'high'
        });
      }

      // Approved
      if (application.approved_at) {
        const id = 3;
        mockNotifications.push({
          id,
          type: 'success',
          title: 'Application Approved!',
          message: `Congratulations! Your scholarship application has been approved for ₱${application.approved_amount?.toLocaleString() || '0'}.`,
          timestamp: new Date(application.approved_at),
          isRead: readNotificationIds.includes(id),
          priority: 'urgent'
        });
      }

      // Rejected
      if (application.rejected_at) {
        const id = 7;
        mockNotifications.push({
          id,
          type: 'error',
          title: 'Application Not Approved',
          message: `Unfortunately, your application was not approved. Reason: ${application.rejection_reason || 'Please contact support for details.'}`,
          timestamp: new Date(application.rejected_at),
          isRead: readNotificationIds.includes(id),
          priority: 'high'
        });
      }

      // Disbursement (if any)
      if (application.disbursed_at) {
        const id = 4;
        mockNotifications.push({
          id,
          type: 'success',
          title: 'Grant Disbursed',
          message: 'Your scholarship grant has been disbursed.',
          timestamp: new Date(application.disbursed_at),
          isRead: readNotificationIds.includes(id),
          priority: 'urgent'
        });
      }

      // Document-related notifications
      if (documents.length > 0) {
        const rejectedDocs = documents.filter(doc => doc.status === 'rejected');
        if (rejectedDocs.length > 0) {
          mockNotifications.push({
            id: 8,
            type: 'warning',
            title: 'Document Issues',
            message: `${rejectedDocs.length} document(s) were rejected and need to be resubmitted.`,
            timestamp: new Date(),
            isRead: readNotificationIds.includes(8),
            priority: 'high'
          });
        }

        const verifiedDocs = documents.filter(doc => doc.status === 'verified');
        if (verifiedDocs.length > 0) {
          mockNotifications.push({
            id: 9,
            type: 'success',
            title: 'Documents Verified',
            message: `${verifiedDocs.length} document(s) have been successfully verified.`,
            timestamp: new Date(),
            isRead: readNotificationIds.includes(9),
            priority: 'medium'
          });
        }
      }

      // Compliance notifications
      if (application.compliance_issues && application.compliance_issues.length > 0) {
        mockNotifications.push({
          id: 10,
          type: 'warning',
          title: 'Compliance Review Required',
          message: 'Your application has been flagged for compliance review. Please check the details and make necessary corrections.',
          timestamp: new Date(),
          isRead: readNotificationIds.includes(10),
          priority: 'urgent'
        });
      }

      // General reminders
      if (application.status === 'draft') {
        const missingDocs = requiredDocumentsCount - submittedRequiredCount;
        if (missingDocs > 0) {
          mockNotifications.push({
            id: 11,
            type: 'info',
            title: 'Complete Your Application',
            message: `You have ${missingDocs} required document(s) remaining to complete your application.`,
            timestamp: new Date(),
            isRead: readNotificationIds.includes(11),
            priority: 'medium'
          });
        }
      }
    }

    // Add some general system notifications
    const sysId = 12;
    mockNotifications.push({
      id: sysId,
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur on Sunday, 2:00 AM - 4:00 AM. Some features may be temporarily unavailable.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: readNotificationIds.includes(sysId),
      priority: 'low'
    });

    return mockNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [documents]); // Added documents dependency

  // Sync unread count with notifications state
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const markNotificationAsRead = (notificationId: number) => {
    // Update local state
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );

    // Update local storage
    const readNotificationIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readNotificationIds.includes(notificationId)) {
      localStorage.setItem('read_notifications', JSON.stringify([...readNotificationIds, notificationId]));
    }
  };

  const markAllAsRead = () => {
    // Update local state
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );

    // Update local storage
    const allIds = notifications.map(n => n.id);
    const existingRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const newRead = [...new Set([...existingRead, ...allIds])];
    localStorage.setItem('read_notifications', JSON.stringify(newRead));
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('[data-notification-dropdown]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const [hasOpenPeriod, setHasOpenPeriod] = useState(false);

  // Fetch user applications, documents, and academic periods
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [userApplications, requiredDocumentsData, periodsData] = await Promise.all([
          scholarshipApiService.getUserApplications(),
          scholarshipApiService.getRequiredDocuments(),
          scholarshipApiService.getAcademicPeriods()
        ]);
        setApplications(userApplications);
        setRequiredDocuments(requiredDocumentsData);

        // Check for any open and current academic period
        const openPeriod = periodsData.find(p => p.status === 'open' && p.is_current);
        setHasOpenPeriod(!!openPeriod);

        // Fetch documents if there's a current application
        if (userApplications.length > 0) {
          const currentApp = userApplications[0];
          try {
            const documentsData = await scholarshipApiService.getDocuments({
              application_id: currentApp.id
            });
            setDocuments(documentsData.data || []);
          } catch (docErr) {
            console.error('Error fetching documents:', docErr);
            // Don't set error for documents, just log it
          }
        }

        // Notifications will be generated in a separate useEffect
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Run only once on mount

  // Update notifications when applications or documents change
  useEffect(() => {
    if (applications.length > 0) {
      const currentApp = applications[0];
      const generatedNotifications = generateMockNotifications(currentApp);
      setNotifications(generatedNotifications);
    }
  }, [applications, documents, generateMockNotifications]);

  // Refresh applications and documents
  const refreshApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [userApplications, requiredDocumentsData] = await Promise.all([
        scholarshipApiService.getUserApplications(),
        scholarshipApiService.getRequiredDocuments()
      ]);
      setApplications(userApplications);
      setRequiredDocuments(requiredDocumentsData);

      // Refresh documents if there's a current application
      if (userApplications.length > 0) {
        const currentApp = userApplications[0];
        try {
          const documentsData = await scholarshipApiService.getDocuments({
            application_id: currentApp.id
          });
          setDocuments(documentsData.data || []);
        } catch (docErr) {
          console.error('Error refreshing documents:', docErr);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh application data');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current application data (most recent or first one)
  const currentApplication = applications.length > 0 ? applications[0] : null;

  // Fetch disbursements for current application
  useEffect(() => {
    const fetchDisbursements = async () => {
      if (!currentApplication || !currentApplication.id) {
        setDisbursements([]);
        return;
      }

      try {
        setIsLoadingDisbursements(true);
        const response = await fetch(
          `${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/disbursements?application_id=${currentApplication.id}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch disbursements');
        }

        const data = await response.json();
        setDisbursements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching disbursements:', err);
        setDisbursements([]);
      } finally {
        setIsLoadingDisbursements(false);
      }
    };

    fetchDisbursements();
  }, [currentApplication]);

  // Standard required documents for scholarship applications
  // Using CORRECT document type IDs from the document_types table
  // Ordered to match UI display: Academic → Financial → Personal
  const standardRequiredDocuments = [
    // Academic Documents
    {
      id: 1, // Transcript of Records (Latest) - correct ID from document_types table
      name: 'Transcript of Records (Latest)',
      description: 'Official transcript showing your latest academic performance and grades',
      category: 'academic',
      is_required: true,
      priority: 1
    },
    {
      id: 2, // Certificate of Good Moral - correct ID from document_types table
      name: 'Certificate of Good Moral',
      description: 'Certificate from your school confirming your good moral character',
      category: 'academic',
      is_required: true,
      priority: 2
    },
    {
      id: 17, // Certificate of Enrollment - correct ID from document_types table
      name: 'Certificate of Enrollment',
      description: 'Document proving your current enrollment status',
      category: 'academic',
      is_required: true,
      priority: 3
    },
    // Financial Documents
    {
      id: 3, // Income Certificate - correct ID from document_types table
      name: 'Income Certificate',
      description: 'Official document showing your family\'s income status from BIR or barangay',
      category: 'financial',
      is_required: true,
      priority: 4
    },
    // Personal Documents
    {
      id: 4, // Barangay Certificate - correct ID from document_types table
      name: 'Barangay Certificate',
      description: 'Certificate from your barangay confirming your residency',
      category: 'personal',
      is_required: true,
      priority: 5
    },
    {
      id: 5, // Valid ID (Government-issued) - correct ID from document_types table
      name: 'Valid ID (Government-issued)',
      description: 'Government-issued identification document (Driver\'s License, Passport, etc.)',
      category: 'personal',
      is_required: true,
      priority: 6
    },
    {
      id: 6, // Birth Certificate - correct ID from document_types table
      name: 'Birth Certificate',
      description: 'Official birth certificate from PSA (Philippine Statistics Authority)',
      category: 'personal',
      is_required: true,
      priority: 7
    }
  ];

  // Create documents checklist
  const createDocumentsChecklist = () => {
    // Use API data if available, otherwise fall back to standard documents
    const documentsToCheck = requiredDocuments.length > 0 ? requiredDocuments : standardRequiredDocuments;

    const checklist = documentsToCheck.map(requiredDoc => {
      // For standard documents, try to match by document type ID or name
      const submittedDoc = documents.find(doc => {
        if (typeof requiredDoc.id === 'number') {
          // For numeric IDs, match directly
          return doc.document_type_id === requiredDoc.id;
        } else if (typeof requiredDoc.id === 'string') {
          // For string IDs (legacy), try to match by document type name
          return doc.document_type?.name?.toLowerCase().includes(requiredDoc.name.toLowerCase().split(' ')[0]);
        }
        return false;
      });

      return {
        id: requiredDoc.id,
        name: requiredDoc.name,
        description: requiredDoc.description,
        category: requiredDoc.category,
        isRequired: requiredDoc.is_required !== false, // Default to true if not specified
        isSubmitted: !!submittedDoc,
        status: submittedDoc ? submittedDoc.status : 'missing',
        submittedAt: submittedDoc ? new Date(submittedDoc.created_at).toLocaleDateString() : null,
        verifiedAt: submittedDoc?.verified_at ? new Date(submittedDoc.verified_at).toLocaleDateString() : null,
        verificationNotes: submittedDoc?.verification_notes || null,
        fileName: submittedDoc?.file_name || null,
        document: submittedDoc,
        priority: requiredDoc.priority || 999
      };
    });

    // Add any submitted documents that aren't in the required list
    documents.forEach(submittedDoc => {
      const isInRequired = documentsToCheck.some(req => {
        if (typeof req.id === 'number') {
          return req.id === submittedDoc.document_type_id;
        } else if (typeof req.id === 'string') {
          return submittedDoc.document_type?.name?.toLowerCase().includes(req.name.toLowerCase().split(' ')[0]);
        }
        return false;
      });

      if (!isInRequired) {
        checklist.push({
          id: submittedDoc.document_type_id,
          name: submittedDoc.document_type?.name || 'Unknown Document',
          description: submittedDoc.document_type?.description || '',
          category: submittedDoc.document_type?.category || 'other',
          isRequired: false,
          isSubmitted: true,
          status: submittedDoc.status,
          submittedAt: new Date(submittedDoc.created_at).toLocaleDateString(),
          verifiedAt: submittedDoc.verified_at ? new Date(submittedDoc.verified_at).toLocaleDateString() : null,
          verificationNotes: submittedDoc.verification_notes || null,
          fileName: submittedDoc.file_name || null,
          document: submittedDoc,
          priority: 999
        });
      }
    });

    // Sort by priority (required documents first, then by priority number)
    return checklist.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return (a.priority || 999) - (b.priority || 999);
    });
  };

  const documentsChecklist = createDocumentsChecklist();
  const requiredDocumentsCount = documentsChecklist.filter(doc => doc.isRequired).length;
  const submittedRequiredCount = documentsChecklist.filter(doc => doc.isRequired && doc.isSubmitted).length;
  const verifiedRequiredCount = documentsChecklist.filter(doc => doc.isRequired && doc.status === 'verified').length;
  const completionPercentage = requiredDocumentsCount > 0 ? Math.round((submittedRequiredCount / requiredDocumentsCount) * 100) : 0;

  // Determine eligibility to submit: (draft OR for_compliance status) AND all required documents submitted
  const canSubmitApplication = !!currentApplication
    && ['draft', 'for_compliance'].includes(currentApplication.status)
    && requiredDocumentsCount > 0
    && submittedRequiredCount === requiredDocumentsCount;

  const handleSubmitApplication = async () => {
    if (!currentApplication) return;
    // Guard: prevent submit if requirements are incomplete
    if (!(requiredDocumentsCount > 0 && submittedRequiredCount === requiredDocumentsCount)) {
      setSubmitError('Please upload all required documents before submitting your application.');
      setTimeout(() => setSubmitError(null), 3000);
      return;
    }
    setIsSubmittingApp(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await scholarshipApiService.submitApplication(currentApplication.id);
      setSubmitSuccess('Application submitted successfully.');
      await refreshApplications();
    } catch (err) {
      console.error('Failed to submit application:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setIsSubmittingApp(false);
      setTimeout(() => setSubmitSuccess(null), 3000);
    }
  };


  // Handle document removal
  const handleRemoveDocument = (document: any) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const confirmRemoveDocument = async () => {
    if (!documentToDelete || !currentApplication) return;

    setIsDeleting(true);
    try {
      await scholarshipApiService.deleteDocument(documentToDelete.id);

      // Refresh documents after successful deletion
      const documentsData = await scholarshipApiService.getDocuments({
        application_id: currentApplication.id
      });
      setDocuments(documentsData.data || []);

      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Error removing document:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to remove document');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to get status display
  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'documents_reviewed': return 'Documents Reviewed';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'endorsed_to_ssc': return 'Endorsed to SSC';
      case 'approved': return 'Approved';
      case 'grants_processing': return 'Grants Processing';
      case 'grants_disbursed': return 'Grants Disbursed';
      case 'rejected': return 'Rejected';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      case 'for_compliance': return 'For Compliance';
      case 'compliance_documents_submitted': return 'Compliance Documents Submitted';
      default: return status || 'Unknown';
    }
  };

  // Helper function to get current stage based on status
  const getCurrentStage = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 0;                   // Stage 0: General Requirements and Interview
      case 'submitted': return 0;               // Stage 0: General Requirements and Interview (when submitted)
      case 'documents_reviewed': return 0;      // Stage 0: Documents being reviewed
      case 'interview_scheduled': return 0;     // Stage 0: Interview scheduled
      case 'endorsed_to_ssc': return 1;         // Stage 1: Endorsed to SSC Approval
      case 'approved': return 2;                // Stage 2: Approved Application
      case 'grants_processing': return 3;       // Stage 3: Grants Processing
      case 'grants_disbursed': return 4;        // Stage 4: Grants Disbursed
      case 'rejected': return -1;               // Special case for rejected
      case 'on_hold': return 1;                 // Stage 1: On hold during review
      case 'cancelled': return -1;              // Special case for cancelled
      case 'for_compliance': return 0;          // Stage 0: Needs compliance review
      case 'compliance_documents_submitted': return 0; // Stage 0: Compliance docs submitted, pending review
      default: return 0;
    }
  };

  // Enhanced scholarship data with real application information
  const scholarshipData = currentApplication ? {
    referenceNumber: currentApplication.application_number || `APP-${currentApplication.id}`,

    // Personal Information
    studentName: `${currentApplication.student?.first_name || ''} ${currentApplication.student?.middle_name || ''} ${currentApplication.student?.last_name || ''}`.trim() || 'Not specified',
    firstName: currentApplication.student?.first_name || 'Not specified',
    middleName: currentApplication.student?.middle_name || 'N/A',
    lastName: currentApplication.student?.last_name || 'Not specified',
    extensionName: currentApplication.student?.extension_name || 'N/A',
    sex: currentApplication.student?.sex || 'Not specified',
    civilStatus: currentApplication.student?.civil_status || 'Not specified',
    dateOfBirth: currentApplication.student?.birth_date ? new Date(currentApplication.student.birth_date).toLocaleDateString() : 'Not specified',
    nationality: currentApplication.student?.nationality || 'Not specified',
    birthPlace: currentApplication.student?.birth_place || 'Not specified',
    religion: currentApplication.student?.religion || 'Not specified',
    heightCm: currentApplication.student?.height_cm ? `${currentApplication.student.height_cm} cm` : 'Not specified',
    weightKg: currentApplication.student?.weight_kg ? `${currentApplication.student.weight_kg} kg` : 'Not specified',
    isPwd: currentApplication.student?.is_pwd ? 'Yes' : 'No',
    pwdSpecification: currentApplication.student?.pwd_specification || 'N/A',
    contactNumber: currentApplication.student?.contact_number || 'Not specified',
    emailAddress: currentApplication.student?.email_address || 'Not specified',

    // Address Information
    presentAddress: currentApplication.student?.addresses?.[0] ?
      [currentApplication.student.addresses[0].address_line_1, currentApplication.student.addresses[0].address_line_2]
        .filter(Boolean).join(', ') || 'Not specified' : 'Not specified',
    addressLine1: currentApplication.student?.addresses?.[0]?.address_line_1 || 'Not specified',
    addressLine2: currentApplication.student?.addresses?.[0]?.address_line_2 || 'Not specified',
    barangay: currentApplication.student?.addresses?.[0]?.barangay || 'Not specified',
    district: currentApplication.student?.addresses?.[0]?.district || 'Not specified',
    city: currentApplication.student?.addresses?.[0]?.city || 'Not specified',
    province: currentApplication.student?.addresses?.[0]?.province || 'Not specified',
    region: currentApplication.student?.addresses?.[0]?.region || 'Not specified',
    zipCode: currentApplication.student?.addresses?.[0]?.zip_code || 'Not specified',

    // Family Information - from family_members table
    familyMembers: currentApplication.student?.family_members || [],

    numberOfSiblings: currentApplication.student?.financial_information?.number_of_siblings?.toString() || 'Not specified',
    numberOfSiblingsInSchool: currentApplication.student?.financial_information?.siblings_currently_enrolled?.toString() || 'Not specified',
    homeOwnershipStatus: currentApplication.student?.financial_information?.home_ownership_status || 'Not specified',

    // Employment & Financial
    isEmployed: currentApplication.student?.is_employed ? 'Yes' : 'No',
    studentOccupation: currentApplication.student?.occupation || 'Not specified',
    studentMonthlyIncome: currentApplication.student?.financial_information?.monthly_income ? `₱${parseFloat(currentApplication.student.financial_information.monthly_income).toLocaleString()}` : 'Not specified',
    totalFamilyMonthlyIncome: currentApplication.student?.financial_information?.family_monthly_income_range ? `₱${currentApplication.student.financial_information.family_monthly_income_range}` : 'Not specified',
    totalAnnualIncome: 'Not specified', // This field is no longer used as we now use family_monthly_income_range

    // Marginalized Groups
    isSoloParent: currentApplication.student?.is_solo_parent ? 'Yes' : 'No',
    isIndigenousGroup: currentApplication.student?.is_indigenous_group ? 'Yes' : 'No',
    is4PsBeneficiary: currentApplication.student?.financial_information?.is_4ps_beneficiary ? 'Yes' : 'No',
    isPwdBeneficiary: currentApplication.student?.family_information?.is_pwd_beneficiary ? 'Yes' : 'No',

    // Voter & Payment
    isRegisteredVoter: currentApplication.student?.is_registered_voter ? 'Yes' : 'No',
    voterNationality: currentApplication.student?.voter_nationality || 'N/A',
    hasPayMayaAccount: currentApplication.student?.has_paymaya_account ? 'Yes' : 'No',

    // Academic Information
    course: currentApplication.student?.current_academic_record?.track_specialization ||
      currentApplication.student?.current_academic_record?.area_of_specialization ||
      currentApplication.student?.current_academic_record?.program || 'Not specified',
    school: currentApplication.school?.name || 'Not specified',
    schoolAddress: currentApplication.school?.address || 'Not specified',
    schoolType: currentApplication.school?.classification || 'Not specified',
    educationalLevel: currentApplication.student?.current_academic_record?.educational_level || 'Not specified',
    gradeYearLevel: currentApplication.student?.current_academic_record?.year_level || 'Not specified',
    academicYear: currentApplication.student?.current_academic_record?.school_year || 'Not specified',
    semester: currentApplication.student?.current_academic_record?.school_term || 'Not specified',
    unitsEnrolled: currentApplication.student?.current_academic_record?.units_enrolled?.toString() || 'Not specified',
    gwa: currentApplication.student?.current_academic_record?.general_weighted_average?.toString() || 'Not specified',
    isCurrentlyEnrolled: currentApplication.student?.is_currently_enrolled ? 'Yes' : 'No',
    isGraduating: currentApplication.student?.is_graduating ? 'Yes' : 'No',

    // Scholarship Information
    scholarshipType: currentApplication.category?.name || 'Not specified',
    scholarshipSubtype: currentApplication.subcategory?.name || 'Not specified',
    amount: currentApplication.approved_amount ? `₱${currentApplication.approved_amount.toLocaleString()}` :
      currentApplication.requested_amount ? `₱${currentApplication.requested_amount.toLocaleString()}` : 'Not specified',
    requestedAmount: currentApplication.requested_amount ? `₱${currentApplication.requested_amount.toLocaleString()}` : 'Not specified',
    approvedAmount: currentApplication.approved_amount ? `₱${currentApplication.approved_amount.toLocaleString()}` : 'Not approved',
    status: getStatusDisplay(currentApplication.status),
    rawStatus: currentApplication.status,
    applicationDate: currentApplication.submitted_at ? new Date(currentApplication.submitted_at).toLocaleDateString() : 'Not submitted',
    approvalDate: currentApplication.approved_at ? new Date(currentApplication.approved_at).toLocaleDateString() : 'Not approved',
    reviewedDate: currentApplication.reviewed_at ? new Date(currentApplication.reviewed_at).toLocaleDateString() : 'Not reviewed',
    currentStage: getCurrentStage(currentApplication.status),
    type: currentApplication.type === 'new' ? 'New Application' : 'Renewal Application',
    reasonForRenewal: currentApplication.reason_for_renewal || 'N/A',
    financialNeedDescription: currentApplication.financial_need_description || 'Not provided',
    rejectionReason: currentApplication.rejection_reason || null,
    notes: currentApplication.notes || null,
    complianceIssues: currentApplication.compliance_issues || [],
    marginalizedGroups: currentApplication.marginalized_groups || [],
    digitalWallets: currentApplication.digital_wallets || [],
    walletAccountNumber: currentApplication.wallet_account_number || 'Not provided',
    paymentMethod: currentApplication.payment_method || 'Not specified',
    howDidYouKnow: currentApplication.how_did_you_know || [],
    isSchoolAtQC: currentApplication.is_school_at_qc || false,
    requirements: documents.map(doc => ({
      name: doc.document_type?.name || 'Unknown Document',
      status: doc.status === 'verified' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'Pending',
      date: new Date(doc.created_at).toLocaleDateString(),
      fileName: doc.file_name,
      verificationNotes: doc.verification_notes,
      verifiedAt: doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : null
    })),
    disbursements: disbursements.map((d: any) => ({
      id: d.id,
      date: d.disbursedAt ? new Date(d.disbursedAt).toLocaleDateString() : 'N/A',
      amount: `₱${parseFloat(d.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: d.disbursement_status || 'completed',
      receiptPath: d.receiptPath,
      referenceNumber: d.referenceNumber || d.reference_number,
      providerName: d.providerName || d.provider_name,
      method: d.method || d.disbursement_method
    }))

  } : {
    referenceNumber: 'No Application',
    studentName: `${currentUser?.first_name || ''} ${currentUser?.middle_name || ''} ${currentUser?.last_name || ''}`.trim() || 'Not specified',
    firstName: currentUser?.first_name || 'Not specified',
    middleName: currentUser?.middle_name || 'N/A',
    lastName: currentUser?.last_name || 'Not specified',
    extensionName: 'N/A',
    sex: 'Not specified',
    civilStatus: 'Not specified',
    dateOfBirth: 'Not specified',
    nationality: 'Not specified',
    birthPlace: 'Not specified',
    religion: 'Not specified',
    heightCm: 'Not specified',
    weightKg: 'Not specified',
    isPwd: 'No',
    pwdSpecification: 'N/A',
    contactNumber: 'Not specified',
    emailAddress: 'Not specified',
    presentAddress: 'Not specified',
    addressLine1: 'Not specified',
    addressLine2: 'Not specified',
    barangay: 'Not specified',
    district: 'Not specified',
    city: 'Not specified',
    province: 'Not specified',
    region: 'Not specified',
    zipCode: 'Not specified',
    familyMembers: [],
    numberOfSiblings: 'Not specified',
    numberOfSiblingsInSchool: 'Not specified',
    homeOwnershipStatus: 'Not specified',
    isEmployed: 'No',
    studentMonthlyIncome: 'Not specified',
    totalFamilyMonthlyIncome: 'Not specified',
    totalAnnualIncome: 'Not specified',
    isSoloParent: 'No',
    isIndigenousGroup: 'No',
    is4PsBeneficiary: 'No',
    isPwdBeneficiary: 'No',
    isRegisteredVoter: 'No',
    voterNationality: 'N/A',
    hasPayMayaAccount: 'No',
    course: 'Not specified',
    school: 'Not specified',
    schoolAddress: 'Not specified',
    schoolType: 'Not specified',
    educationalLevel: 'Not specified',
    gradeYearLevel: 'Not specified',
    academicYear: 'Not specified',
    semester: 'Not specified',
    unitsEnrolled: 'Not specified',
    gwa: 'Not specified',
    isCurrentlyEnrolled: 'No',
    isGraduating: 'No',
    scholarshipType: 'Not specified',
    scholarshipSubtype: 'Not specified',
    amount: 'Not specified',
    requestedAmount: 'Not specified',
    approvedAmount: 'Not specified',
    status: 'No Application',
    rawStatus: 'draft',
    applicationDate: 'Not submitted',
    approvalDate: 'Not approved',
    reviewedDate: 'Not reviewed',
    currentStage: -1,
    type: 'N/A',
    reasonForRenewal: 'N/A',
    financialNeedDescription: 'Not provided',
    rejectionReason: null,
    notes: null,
    marginalizedGroups: [],
    digitalWallets: [],
    walletAccountNumber: 'Not provided',
    howDidYouKnow: [],
    isSchoolAtQC: false,
    requirements: [],
    complianceIssues: [],
    disbursements: disbursements.map((d: any) => ({
      id: d.id,
      date: d.disbursedAt ? new Date(d.disbursedAt).toLocaleDateString() : 'N/A',
      amount: `₱${parseFloat(d.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: d.disbursement_status || 'completed',
      receiptPath: d.receiptPath,
      referenceNumber: d.referenceNumber || d.reference_number,
      providerName: d.providerName || d.provider_name,
      method: d.method || d.disbursement_method
    }))
  };

  // Helper component for collapsible section
  const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ElementType;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, icon: Icon, sectionKey, children }) => {
    const isExpanded = expandedSections[sectionKey];
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 hover:to-orange-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 py-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Helper component for info row
  const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <p className={`text-sm ${highlight ? 'font-semibold text-orange-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );

  // Notification component
  const NotificationItem: React.FC<{ notification: any }> = ({ notification }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'success':
          return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'error':
          return <AlertTriangle className="w-5 h-5 text-red-500" />;
        case 'warning':
          return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        case 'info':
        default:
          return <Info className="w-5 h-5 text-blue-500" />;
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return 'border-l-red-500 bg-red-50';
        case 'high':
          return 'border-l-orange-500 bg-orange-50';
        case 'medium':
          return 'border-l-blue-500 bg-blue-50';
        case 'low':
        default:
          return 'border-l-gray-500 bg-gray-50';
      }
    };

    return (
      <div
        className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
          } hover:bg-opacity-75 transition-all duration-200 cursor-pointer`}
        onClick={() => markNotificationAsRead(notification.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                  {notification.title}
                </h4>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </div>
              <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Scholarship process stages
  const processStages = [
    {
      id: 0,
      title: 'GENERAL REQUIREMENTS AND INTERVIEW',
      icon: Clipboard,
      description: 'Submit requirements and attend interview'
    },
    {
      id: 1,
      title: 'ENDORSED TO SSC APPROVAL',
      icon: UserCheck,
      description: 'Application reviewed by Student Services Committee'
    },
    {
      id: 2,
      title: 'APPROVED APPLICATION',
      icon: FileCheck,
      description: 'Application approved by committee'
    },
    {
      id: 3,
      title: 'GRANTS PROCESSING',
      icon: Hourglass,
      description: 'Processing grant disbursement'
    },
    {
      id: 4,
      title: 'GRANTS DISBURSED',
      icon: HandCoins,
      description: 'Funds released to student'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'grants_processing':
      case 'grants_disbursed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'submitted':
      case 'documents_reviewed':
      case 'interview_scheduled':
      case 'endorsed_to_ssc':
        return <Clock className="h-5 w-5 text-blue-500" />;
      // approved_pending_verification and enrollment_verified statuses removed - automatic verification disabled
      case 'interview_completed':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'on_hold':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'for_compliance':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'compliance_documents_submitted':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'grants_disbursed':
        return 'text-green-600 bg-green-100';
      case 'grants_processing':
        return 'text-purple-600 bg-purple-100';
      case 'submitted':
      case 'documents_reviewed':
      case 'interview_scheduled':
      case 'endorsed_to_ssc':
        return 'text-blue-600 bg-blue-100';
      // approved_pending_verification and enrollment_verified statuses removed - automatic verification disabled
      case 'interview_completed':
        return 'text-indigo-600 bg-indigo-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'for_compliance':
        return 'text-red-600 bg-red-100';
      case 'compliance_documents_submitted':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Show skeleton loading for initial data fetch
  if (isLoading && applications.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scholarship Dashboard</h1>
                <p className="text-sm text-gray-600">Track your application and manage documents</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div
                    data-notification-dropdown
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden max-w-[calc(100vw-2rem)]"
                  >
                    <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium"
                          >
                            <span className="hidden sm:inline">Mark all as read</span>
                            <span className="sm:hidden">Clear all</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <div className="p-6 sm:p-8 text-center text-gray-500">
                          <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs text-gray-400 mt-1">We'll notify you about important updates</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>



              {/* Edit Button for Draft or For Compliance Status */}
              {currentApplication && ['draft', 'for_compliance'].includes(scholarshipData.rawStatus) && (
                <button
                  onClick={() => navigate('/new-application')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Application</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={refreshApplications}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>


          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {!isLoading && !error && applications.length === 0 && (
            <div className={`mt-3 p-4 border rounded-lg shadow-sm ${hasOpenPeriod ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {hasOpenPeriod ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-500" />
                  )}
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${hasOpenPeriod ? 'text-yellow-800' : 'text-gray-800'}`}>
                      {hasOpenPeriod ? "Start Your Journey" : "Applications Closed"}
                    </span>
                    <span className={`text-sm ${hasOpenPeriod ? 'text-yellow-700' : 'text-gray-600'}`}>
                      {hasOpenPeriod
                        ? "Submit a new scholarship application to get started."
                        : "Scholarship applications are currently closed. Please wait for the next academic period."}
                    </span>
                  </div>
                </div>
                {hasOpenPeriod && (
                  <button
                    onClick={() => navigate('/new-application')}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compliance Issues Alert */}
        {(scholarshipData.rawStatus === 'for_compliance' || (scholarshipData.complianceIssues && scholarshipData.complianceIssues.length > 0)) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Action Required: Compliance Review
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Your application has been flagged for compliance issues. Please address the following items:
                </p>
                {scholarshipData.complianceIssues && scholarshipData.complianceIssues.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1 ml-1">
                    {scholarshipData.complianceIssues.map((issue: any, index: number) => (
                      <li key={index}>
                        <span className="font-medium">{issue.title || 'Issue'}:</span> {issue.description || issue.message || JSON.stringify(issue)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-yellow-700 italic">
                    Please review your application details and documents.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application Status Card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-orange-100 text-sm font-medium mb-1">Reference Number</p>
              <p className="text-3xl font-bold mb-3">{scholarshipData.referenceNumber}</p>
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-orange-100 text-xs mb-1">Scholarship Type</p>
                  <p className="text-sm font-medium">{scholarshipData.scholarshipType}</p>
                </div>
                <div className="h-8 w-px bg-orange-400"></div>
                <div>
                  <p className="text-orange-100 text-xs mb-1">Amount</p>
                  <p className="text-sm font-medium">{scholarshipData.amount}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className={`px-4 py-2 rounded-full ${getStatusColor(scholarshipData.status)} shadow-md`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(scholarshipData.status)}
                  <span className="font-semibold text-sm">{scholarshipData.status}</span>
                </div>
              </div>
              {scholarshipData.rawStatus === 'draft' && (
                <p className="text-xs text-orange-100">
                  {submittedRequiredCount} of {requiredDocumentsCount} documents uploaded
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Application Process Flow */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clipboard className="h-5 w-5 text-orange-500" />
            <span>Application Process</span>
          </h2>
          <div className="relative">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-in-out ${scholarshipData.currentStage === -1 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}
                  style={{
                    width: scholarshipData.currentStage === -1
                      ? '100%'
                      : `${Math.max(0, ((scholarshipData.currentStage + 1) / processStages.length) * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Process Stages */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {processStages.map((stage, index) => {
                const IconComponent = stage.icon;
                const isCompleted = scholarshipData.currentStage === -1 ? false : index <= scholarshipData.currentStage;
                const isCurrent = index === scholarshipData.currentStage;
                const isRejected = scholarshipData.currentStage === -1;

                return (
                  <div key={stage.id} className="text-center">
                    <div className="relative mb-3">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isRejected
                        ? 'bg-red-500 border-red-500 text-white shadow-lg'
                        : isCompleted
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      {isCurrent && !isRejected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                      {isRejected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase mb-1 ${isRejected
                      ? 'text-red-600'
                      : isCompleted ? 'text-orange-600' : 'text-gray-400'
                      }`}>
                      {stage.title}
                    </h3>
                    <p className="text-[9px] text-gray-500 hidden md:block leading-tight">
                      {stage.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-4">
            {/* Personal Information */}
            <CollapsibleSection title="Personal Information" icon={Users} sectionKey="personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow label="First Name" value={scholarshipData.firstName} />
                <InfoRow label="Middle Name" value={scholarshipData.middleName} />
                <InfoRow label="Last Name" value={scholarshipData.lastName} />
                <InfoRow label="Extension Name" value={scholarshipData.extensionName} />
                <InfoRow label="Sex" value={scholarshipData.sex} />
                <InfoRow label="Civil Status" value={scholarshipData.civilStatus} />
                <InfoRow label="Date of Birth" value={scholarshipData.dateOfBirth} />
                <InfoRow label="Nationality" value={scholarshipData.nationality} />
                <InfoRow label="Birth Place" value={scholarshipData.birthPlace} />
                <InfoRow label="Religion" value={scholarshipData.religion} />
                <InfoRow label="Height" value={scholarshipData.heightCm} />
                <InfoRow label="Weight" value={scholarshipData.weightKg} />
                <InfoRow label="PWD" value={scholarshipData.isPwd} />
                {scholarshipData.isPwd === 'Yes' && (
                  <div className="sm:col-span-2">
                    <InfoRow label="PWD Specification" value={scholarshipData.pwdSpecification} />
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Home className="h-4 w-4 text-orange-500" />
                  <span>Address Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 md:col-span-3">
                    <InfoRow label="Present Address" value={scholarshipData.presentAddress} />
                  </div>
                  <InfoRow label="Address Line 1" value={scholarshipData.addressLine1} />
                  <InfoRow label="Address Line 2" value={scholarshipData.addressLine2} />
                  <InfoRow label="Barangay" value={scholarshipData.barangay} />
                  <InfoRow label="District" value={scholarshipData.district} />
                  <InfoRow label="City" value={scholarshipData.city} />
                  <InfoRow label="Province" value={scholarshipData.province} />
                  <InfoRow label="Region" value={scholarshipData.region} />
                  <InfoRow label="Zip Code" value={scholarshipData.zipCode} />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-orange-500" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Contact Number" value={scholarshipData.contactNumber} />
                  <InfoRow label="Email Address" value={scholarshipData.emailAddress} />
                </div>
              </div>
            </CollapsibleSection>

            {/* Family Information */}
            <CollapsibleSection title="Family Information" icon={Heart} sectionKey="family">
              <div className="space-y-6">
                {/* Family Members */}
                {scholarshipData.familyMembers.length > 0 ? (
                  scholarshipData.familyMembers.map((member: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span className="text-orange-500">
                          {member.relationship === 'father' ? '👨' :
                            member.relationship === 'mother' ? '👩' :
                              member.relationship === 'guardian' ? '👤' : '👨‍👩‍👧‍👦'}
                        </span>
                        <span className="capitalize">{member.relationship}'s Information</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoRow label="First Name" value={member.first_name || 'Not specified'} />
                        <InfoRow label="Middle Name" value={member.middle_name || 'N/A'} />
                        <InfoRow label="Last Name" value={member.last_name || 'Not specified'} />
                        <InfoRow label="Extension Name" value={member.extension_name || 'N/A'} />
                        <InfoRow label="Contact Number" value={member.contact_number || 'Not specified'} />
                        <InfoRow label="Occupation/Employer" value={member.occupation || 'Not specified'} />
                        <InfoRow
                          label="Monthly Income"
                          value={member.monthly_income ? `₱${parseFloat(member.monthly_income).toLocaleString()}` : 'Not specified'}
                        />
                        <InfoRow label="Is Alive" value={member.is_alive ? 'Yes' : 'No'} />
                        <InfoRow label="Is Employed" value={member.is_employed ? 'Yes' : 'No'} />
                        <InfoRow label="Is OFW" value={member.is_ofw ? 'Yes' : 'No'} />
                        <InfoRow label="Is PWD" value={member.is_pwd ? 'Yes' : 'No'} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No family members information available</p>
                  </div>
                )}

                {/* Household Information */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Household Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Number of Siblings" value={scholarshipData.numberOfSiblings} />
                    <InfoRow label="Siblings in School" value={scholarshipData.numberOfSiblingsInSchool} />
                    <InfoRow label="Home Ownership" value={scholarshipData.homeOwnershipStatus} />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Academic Information */}
            <CollapsibleSection title="Academic Information" icon={School} sectionKey="academic">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <InfoRow label="School Name" value={scholarshipData.school} highlight />
                </div>
                <InfoRow label="School Type" value={scholarshipData.schoolType} />
                <div className="sm:col-span-2 md:col-span-3">
                  <InfoRow label="School Address" value={scholarshipData.schoolAddress} />
                </div>
                <InfoRow label="Educational Level" value={scholarshipData.educationalLevel} />
                <InfoRow label="Grade/Year Level" value={scholarshipData.gradeYearLevel} />
                <div className="sm:col-span-2">
                  <InfoRow label="Track/Specialization" value={scholarshipData.course} />
                </div>
                <InfoRow label="Academic Year" value={scholarshipData.academicYear} />
                <InfoRow label="Semester/Term" value={scholarshipData.semester} />
                <InfoRow label="Units Enrolled" value={scholarshipData.unitsEnrolled} />
                <InfoRow label="GWA/GPA" value={scholarshipData.gwa} highlight />
                <InfoRow label="Currently Enrolled" value={scholarshipData.isCurrentlyEnrolled} />
                <InfoRow label="Graduating Student" value={scholarshipData.isGraduating} />
              </div>
            </CollapsibleSection>

            {/* Financial Information */}
            <CollapsibleSection title="Financial Information" icon={PhilippinePeso} sectionKey="financial">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                  <InfoRow label="Approved Amount" value={scholarshipData.approvedAmount} highlight />
                  <InfoRow label="Student Employed" value={scholarshipData.isEmployed} />
                  <InfoRow label="Student Occupation" value={scholarshipData.studentOccupation} />
                  <InfoRow label="Student Income" value={scholarshipData.studentMonthlyIncome} />
                  <InfoRow label="Family Monthly Income" value={scholarshipData.totalFamilyMonthlyIncome} highlight />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Financial Need Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">{scholarshipData.financialNeedDescription}</p>
                  </div>
                </div>

                {scholarshipData.walletAccountNumber !== 'Not provided' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-orange-500" />
                      <span>Payment Information</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow
                        label={scholarshipData.paymentMethod === 'Bank Transfer' ? 'Bank Account Number' :
                          scholarshipData.paymentMethod === 'GCash' || scholarshipData.paymentMethod === 'PayMaya' ? 'Mobile Number' :
                            'Account Number'}
                        value={scholarshipData.walletAccountNumber}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Marginalized Groups & Benefits</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoRow label="Solo Parent" value={scholarshipData.isSoloParent} />
                    <InfoRow label="Indigenous Group" value={scholarshipData.isIndigenousGroup} />
                    <InfoRow label="4Ps Beneficiary" value={scholarshipData.is4PsBeneficiary} />
                    <InfoRow label="PWD Beneficiary" value={scholarshipData.isPwdBeneficiary} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Voter Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow label="Registered Voter" value={scholarshipData.isRegisteredVoter} />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Application Details */}
            <CollapsibleSection title="Application Details" icon={FileCheck} sectionKey="application">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Application Type" value={scholarshipData.type} highlight />
                  <InfoRow label="Scholarship Category" value={scholarshipData.scholarshipType} highlight />
                  <InfoRow label="Scholarship Subcategory" value={scholarshipData.scholarshipSubtype} />
                  <InfoRow label="Submitted Date" value={scholarshipData.applicationDate} />
                  <InfoRow label="Reviewed Date" value={scholarshipData.reviewedDate} />
                  <InfoRow label="Approval Date" value={scholarshipData.approvalDate} />
                </div>

                {scholarshipData.type === 'Renewal Application' && scholarshipData.reasonForRenewal !== 'N/A' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Reason for Renewal</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">{scholarshipData.reasonForRenewal}</p>
                    </div>
                  </div>
                )}

                {scholarshipData.rejectionReason && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h3>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                      <p className="text-sm text-red-900">{scholarshipData.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {scholarshipData.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">{scholarshipData.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Documents Checklist */}
            <CollapsibleSection title="Documents Checklist" icon={Upload} sectionKey="documents">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  {submittedRequiredCount} of {requiredDocumentsCount} required documents submitted
                </p>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Completion Progress</span>
                    <span className="font-bold text-orange-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 shadow-sm ${completionPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        completionPercentage >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          completionPercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-4">
                {documentsChecklist.length > 0 ? (
                  (() => {
                    // Group documents by category
                    const groupedDocs = documentsChecklist.reduce((groups, item) => {
                      const category = item.category || 'other';
                      if (!groups[category]) {
                        groups[category] = [];
                      }
                      groups[category].push(item);
                      return groups;
                    }, {} as Record<string, typeof documentsChecklist>);

                    // Category labels
                    const categoryLabels = {
                      academic: '📚 Academic Documents',
                      financial: '💰 Financial Documents',
                      personal: '🆔 Personal Documents',
                      other: '📄 Other Documents'
                    };

                    return Object.entries(groupedDocs).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                          {categoryLabels[category as keyof typeof categoryLabels] || `📄 ${category.charAt(0).toUpperCase() + category.slice(1)} Documents`}
                        </h4>
                        {items.map((item, index) => (
                          <div key={index} className={`p-3 rounded-lg border transition-all hover:shadow-sm ${item.isRequired
                            ? item.isSubmitted
                              ? item.status === 'verified'
                                ? 'bg-green-50 border-green-300'
                                : item.status === 'rejected'
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-blue-50 border-blue-300'
                              : 'bg-yellow-50 border-yellow-300'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3">
                              <div className="flex items-start space-x-2 flex-1 w-full sm:w-auto sm:min-w-0">
                                <div className="flex-shrink-0 mt-0.5">
                                  {item.isSubmitted ? (
                                    item.status === 'verified' ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : item.status === 'rejected' ? (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-blue-500" />
                                    )
                                  ) : (
                                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                                    {item.isRequired && (
                                      <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-800 rounded-full">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.description}</p>
                                  )}
                                  {item.isSubmitted && (
                                    <div className="mt-1">
                                      <p className="text-xs text-gray-500">
                                        {item.submittedAt}
                                        {item.fileName && ` • ${item.fileName}`}
                                      </p>
                                      {item.verificationNotes && (
                                        <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                                          <p className="text-xs text-gray-700">
                                            <strong>Note:</strong> {item.verificationNotes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-end sm:flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                {currentApplication ? (
                                  <div className="w-full sm:w-80">
                                    <SecureDocumentUpload
                                      documentTypeId={item.id}
                                      documentTypeName={item.name}
                                      studentId={currentApplication.student_id}
                                      applicationId={currentApplication.id}
                                      isUploading={isUploading}
                                      existingDocument={item.document}
                                      onUploadStart={() => setIsUploading(true)}
                                      onUploadSuccess={async () => {
                                        setIsUploading(false);
                                        // Refresh documents
                                        const documentsData = await scholarshipApiService.getDocuments({
                                          application_id: currentApplication.id
                                        });
                                        setDocuments(documentsData.data || []);
                                      }}
                                      onUploadError={(error) => {
                                        setIsUploading(false);
                                        setUploadError(error);
                                      }}
                                      showRemoveButton={item.isSubmitted && ['draft', 'for_compliance'].includes(currentApplication.status)}
                                      onRemove={() => handleRemoveDocument(item.document)}
                                      maxSizeMB={10}
                                      acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                                      className="w-full"
                                    />
                                  </div>
                                ) : (
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${item.isSubmitted
                                    ? item.status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : item.status === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {item.isSubmitted
                                      ? item.status === 'verified'
                                        ? '✓ Verified'
                                        : item.status === 'rejected'
                                          ? '✗ Rejected'
                                          : '⏱ Pending'
                                      : '⚠ Missing'
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No document requirements found</p>
                    <p className="text-sm">Contact support if you believe this is an error</p>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {documentsChecklist.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">{requiredDocumentsCount}</p>
                      <p className="text-[10px] text-gray-600 uppercase font-medium">Required</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">{submittedRequiredCount}</p>
                      <p className="text-[10px] text-blue-600 uppercase font-medium">Submitted</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className="text-xl font-bold text-green-600">{verifiedRequiredCount}</p>
                      <p className="text-[10px] text-green-600 uppercase font-medium">Verified</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xl font-bold text-yellow-600">{requiredDocumentsCount - submittedRequiredCount}</p>
                      <p className="text-[10px] text-yellow-600 uppercase font-medium">Missing</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Error Display */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Summary</span>
                </h2>
              </div>
              <div className="p-4 space-y-3">

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Application Date</span>
                    <span className="font-medium text-gray-900">{scholarshipData.applicationDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reviewed Date</span>
                    <span className="font-medium text-gray-900">{scholarshipData.reviewedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Approval Date</span>
                    <span className="font-medium text-gray-900">{scholarshipData.approvalDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Documents Status</span>
                    <span className={`text-sm font-bold ${completionPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {submittedRequiredCount}/{requiredDocumentsCount} Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Verification Card - Removed (automatic verification disabled) */}
            {/* Manual enrollment verification is now handled by administrators */}

            {/* Interview Schedule Card */}
            {currentApplication && (scholarshipData.rawStatus === 'interview_scheduled' || scholarshipData.rawStatus === 'interview_completed') && (
              <InterviewScheduleCard
                applicationId={currentApplication.id}
              />
            )}

            {/* Action Card - For Draft and For Compliance Applications */}
            {currentApplication && ['draft', 'for_compliance'].includes(scholarshipData.rawStatus) && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className={`p-4 ${scholarshipData.rawStatus === 'for_compliance' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                  <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>{scholarshipData.rawStatus === 'for_compliance' ? 'Resubmit Application' : 'Submit Application'}</span>
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">{scholarshipData.rawStatus === 'for_compliance' ? 'Ready to Resubmit?' : 'Ready to Submit?'}</span>
                      <span className={`font-bold ${canSubmitApplication ? 'text-green-600' : 'text-orange-600'}`}>
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${canSubmitApplication ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitApplication}
                    disabled={!canSubmitApplication || isSubmittingApp}
                    className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${!canSubmitApplication || isSubmittingApp
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : scholarshipData.rawStatus === 'for_compliance'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                      }`}
                    title={!canSubmitApplication ? 'Upload all required documents first' : scholarshipData.rawStatus === 'for_compliance' ? 'Resubmit your application' : 'Submit your application'}
                  >
                    {isSubmittingApp ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {scholarshipData.rawStatus === 'for_compliance' ? 'Resubmitting...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {scholarshipData.rawStatus === 'for_compliance' ? 'Resubmit Application' : 'Submit Application'}
                      </>
                    )}
                  </button>

                  {!canSubmitApplication && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Complete all {requiredDocumentsCount} required documents to {scholarshipData.rawStatus === 'for_compliance' ? 'resubmit' : 'submit'}
                    </p>
                  )}

                  {(submitError || submitSuccess) && (
                    <div className={`mt-3 p-3 rounded-lg border ${submitError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center space-x-2">
                        {submitError ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-xs ${submitError ? 'text-red-700' : 'text-green-700'}`}>{submitError || submitSuccess}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Disbursements Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <HandCoins className="h-5 w-5" />
                  <span>Disbursements</span>
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {isLoadingDisbursements ? (
                  <div className="text-center py-4">
                    <RefreshCw className="h-5 w-5 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading disbursements...</p>
                  </div>
                ) : scholarshipData.disbursements.length > 0 ? (
                  scholarshipData.disbursements.map((disbursement: any, index: number) => (
                    <div key={disbursement.id || index} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{disbursement.date}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(disbursement.status)}`}>
                          {disbursement.status === 'completed' ? 'Completed' : disbursement.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <PhilippinePeso className="h-4 w-4 text-green-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{disbursement.amount}</span>
                        </div>
                      </div>
                      {disbursement.referenceNumber && (
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                          Ref: {disbursement.referenceNumber}
                        </div>
                      )}
                      {disbursement.receiptPath && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                          <a
                            href={`${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/disbursements/${disbursement.id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Receipt
                          </a>
                          <a
                            href={`${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/disbursements/${disbursement.id}/receipt/download`}
                            download
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/60 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium italic">No record found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>Need Help?</span>
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Contact our support team for assistance with your application.
              </p>
              <button className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div >

      {/* Document Removal Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Remove Document</h3>
                    <p className="text-sm text-gray-600">Are you sure you want to remove this document?</p>
                  </div>
                </div>

                {documentToDelete && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{documentToDelete.file_name}</p>
                    <p className="text-xs text-gray-600">This action cannot be undone.</p>
                  </div>
                )}

                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDocumentToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveDocument}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Removing...' : 'Remove Document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
