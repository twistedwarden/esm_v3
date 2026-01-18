import React, { useEffect, useState } from 'react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import { useNotifications } from '../../../../contexts/NotificationContext';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  PhilippinePeso,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Star,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  Plus,
  Minus,
  BarChart3,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  School,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  FileCheck,
  Shield,
  Zap,
  AlertCircle,
  Flag,
  Edit3,
  Send,
} from 'lucide-react';
import { LoadingApplications } from '../../../ui/LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ScholarshipApplications() {
  // Toast context
  const { success, error: toastError, warning, info } = useToastContext();

  // Wrapper functions to match existing usage (title, message)
  const showSuccess = (title, message) => success(message ? `${title}: ${message}` : title);
  const showError = (title, message) => toastError(message ? `${title}: ${message}` : title);
  const showWarning = (title, message) => warning(message ? `${title}: ${message}` : title);
  const showInfo = (title, message) => info(message ? `${title}: ${message}` : title);

  // Notification context
  const { triggerScholarshipNotification } = useNotifications();

  // Core state
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'submitted',
    category: 'all',
    level: 'all',
    school: 'all',
    dateFrom: '',
    dateTo: '',
    minGwa: '',
    maxGwa: '',
    priority: 'all'
  });

  // UI state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [complianceReason, setComplianceReason] = useState('');

  // Bulk action modal state
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(''); // 'reviewed', 'compliance', 'reject'
  const [bulkActionReason, setBulkActionReason] = useState('');

  // Quick action modal state
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState(''); // 'reject', 'compliance'
  const [quickActionReason, setQuickActionReason] = useState('');
  const [quickActionApplication, setQuickActionApplication] = useState(null);
  const [reviewAction, setReviewAction] = useState('reviewed'); // 'reviewed'
  const [reviewedConfirmation, setReviewedConfirmation] = useState('');
  const [docDownloadingId, setDocDownloadingId] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    forCompliance: 0,
    approved: 0,
    rejected: 0
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  });

  // Fetch applications
  useEffect(() => {
    fetchApplications();
  }, [filters, searchTerm, pagination.currentPage, pagination.perPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        ...filters
      };

      // Handle special 'all' cases or specific logic
      if (filters.status === 'all') {
        // If we want to restrict to specific statuses even when 'all' is selected
        // params.status = ['draft', 'submitted', 'for_compliance']; 
        // For now, let's just delete the status param if it's all to let backend decide or fetch everything
        delete params.status;
      }

      if (searchTerm) params.search = searchTerm;

      const resp = await scholarshipApiService.getApplications(params);
      const list = Array.isArray(resp.data) ? resp.data : [];

      if (resp.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: resp.meta.current_page || 1,
          lastPage: resp.meta.last_page || 1,
          total: resp.meta.total || 0,
          from: resp.meta.from || 0,
          to: resp.meta.to || 0
        }));
      }

      const mapped = list.map(a => ({
        // Preserve the full application object for the modal
        ...a,
        // Add computed fields for display
        name: `${a.student?.first_name ?? ''} ${a.student?.last_name ?? ''}`.trim() || 'Unknown',
        studentId: a.student?.student_id_number || a.student_id || '',
        email: a.student?.email_address || '',
        phone: a.student?.contact_number || '',
        scholarIdNumber: a.application_number || '',
        schoolName: a.school?.name || '',
        gradeYearLevel: a.student?.current_academic_record?.year_level || '',
        generalWeightedAverage: a.student?.current_academic_record?.general_weighted_average || a.student?.current_academic_record?.gpa || '',
        scholarshipCategory: a.category?.name || '',
        scholarshipSubCategory: a.subcategory?.name || '',
        currentEducationalLevel: a.student?.current_academic_record?.educational_level || '',
        schoolYear: a.student?.current_academic_record?.school_year || '',
        schoolTerm: a.student?.current_academic_record?.school_term || '',
        submittedDate: a.submitted_at || a.created_at,
        requestedAmount: a.requested_amount || 0,
        approvedAmount: a.approved_amount || 0,
        priority: a.priority || 'normal',
        status: a.status || 'unknown' // Ensure status is never undefined
      }));

      setApplications(mapped);
      updateStats(mapped);
    } catch (e) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (apps) => {
    const newStats = {
      total: apps.length,
      submitted: apps.filter(app => app.status === 'submitted').length,
      forCompliance: apps.filter(app => app.status === 'for_compliance').length,
      approved: apps.filter(app => app.status === 'approved').length,
      rejected: apps.filter(app => app.status === 'rejected').length
    };
    setStats(newStats);
  };

  // Filter and sort applications
  // Note: Most filtering is now done server-side. 
  // We keep the sorting logic here if the current page needs sorting.
  const filteredApplications = applications;

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'gwa':
        aValue = parseFloat(a.generalWeightedAverage || 0);
        bValue = parseFloat(b.generalWeightedAverage || 0);
        break;
      case 'amount':
        aValue = parseFloat(a.requestedAmount || 0);
        bValue = parseFloat(b.requestedAmount || 0);
        break;
      case 'date':
      default:
        aValue = new Date(a.submittedDate);
        bValue = new Date(b.submittedDate);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Status helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      // approved_pending_verification and enrollment_verified statuses removed - automatic verification disabled
      case 'interview_scheduled':
      case 'interview_completed':
      case 'endorsed_to_ssc':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'grants_processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'grants_disbursed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'for_compliance':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'compliance_documents_submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'unknown':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    // Handle null, undefined, or empty status
    if (!status) {
      return 'Unknown';
    }

    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      // approved_pending_verification and enrollment_verified statuses removed - automatic verification disabled
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'interview_completed':
        return 'Interview Completed';
      case 'endorsed_to_ssc':
        return 'Endorsed to SSC';
      case 'approved':
        return 'Approved';
      case 'grants_processing':
        return 'Grants Processing';
      case 'grants_disbursed':
        return 'Grants Disbursed';
      case 'rejected':
        return 'Rejected';
      case 'on_hold':
        return 'On Hold';
      case 'cancelled':
        return 'Cancelled';
      case 'for_compliance':
        return 'For Compliance';
      case 'compliance_documents_submitted':
        return 'Compliance Documents Submitted';
      case 'unknown':
        return 'Unknown Status';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      // approved_pending_verification and enrollment_verified statuses removed - automatic verification disabled
      case 'interview_scheduled':
      case 'interview_completed':
      case 'endorsed_to_ssc':
        return <Users className="w-4 h-4" />;
      case 'grants_processing':
      case 'grants_disbursed':
        return <CheckCircle className="w-4 h-4" />;
      case 'unknown':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Selection handlers
  const handleSelectApplication = (id) => {
    setSelectedApplications(prev =>
      prev.includes(id)
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === sortedApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(sortedApplications.map(app => app.id));
    }
  };

  // Filter handlers
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'submitted', // Reset to default "submitted" which matches initial state
      category: 'all',
      level: 'all',
      school: 'all',
      dateFrom: '',
      dateTo: '',
      minGwa: '',
      maxGwa: '',
      priority: 'all'
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'status') {
        return value !== 'submitted' && value !== 'all';
      }
      return value !== 'all' && value !== '';
    }) || searchTerm;
  };

  // Action handlers
  const openReview = async (app) => {
    try {
      console.log('Opening review modal for application:', app);
      setIsReviewModalOpen(true);
      setReviewAction('reviewed'); // Default to reviewed view

      // Ensure we have a valid application object
      if (!app || !app.id) {
        console.error('Invalid application object:', app);
        setActiveApplication(null);
        return;
      }

      // Fetch detailed application data with documents
      try {
        const detailedApp = await scholarshipApiService.getApplication(app.id);
        setActiveApplication(detailedApp);
      } catch (error) {
        console.error('Failed to fetch detailed application data:', error);
        // Fallback to the application data we already have
        setActiveApplication(app);
      }

      setRejectReason('');
      setComplianceReason('');
      setReviewedConfirmation('');
    } catch (error) {
      console.error('Error opening review modal:', error);
      setActiveApplication(null);
    }
  };

  const handleMarkAsReviewed = async () => {
    if (!activeApplication) return;

    // Validate application status
    if (activeApplication.status !== 'submitted') {
      showError('Invalid Status', 'Application must be in "Submitted" status to be marked as reviewed.');
      return;
    }

    // Validate confirmation text
    if (reviewedConfirmation !== 'REVIEWED') {
      showWarning('Confirmation Required', 'Please type "REVIEWED" to confirm this action.');
      return;
    }

    setReviewLoading(true);
    try {
      // Call API to mark application as reviewed and move to verification stage
      await scholarshipApiService.markAsReviewed(activeApplication.id);
      await fetchApplications();
      setIsReviewModalOpen(false);
      setReviewedConfirmation(''); // Reset confirmation
      showSuccess('Application Reviewed', 'Application has been reviewed and approved. Student is now ready for interview scheduling.');

      // Trigger notification
      triggerScholarshipNotification('application_review', {
        application: activeApplication,
        action: 'reviewed'
      });
    } catch (e) {
      console.error('Mark as reviewed failed', e);
      const errorMessage = e.message || 'Failed to mark as reviewed. Please try again.';
      showError('Review Failed', errorMessage);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeApplication) return;
    if (!rejectReason?.trim()) {
      showWarning('Rejection Reason Required', 'Please enter a rejection reason.');
      return;
    }
    setReviewLoading(true);
    try {
      await scholarshipApiService.rejectApplication(activeApplication.id, rejectReason.trim());
      await fetchApplications();
      setIsReviewModalOpen(false);
      showSuccess('Application Rejected', 'Application has been successfully rejected.');

      // Trigger notification
      triggerScholarshipNotification('application_review', {
        application: activeApplication,
        action: 'rejected'
      });
    } catch (e) {
      console.error('Reject failed', e);
      showError('Rejection Failed', 'Failed to reject application. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleComplianceSubmit = async () => {
    if (!activeApplication) return;
    if (!complianceReason?.trim()) {
      showWarning('Compliance Reason Required', 'Please enter a compliance reason.');
      return;
    }

    setReviewLoading(true);
    try {
      // Call API to flag the application for compliance issues
      await scholarshipApiService.flagForCompliance(
        activeApplication.id,
        complianceReason.trim()
      );

      await fetchApplications();
      setIsReviewModalOpen(false);
      showSuccess('Application Flagged for Compliance', 'Application has been flagged for compliance review. Student will be notified to correct the information.');

      // Trigger notification
      triggerScholarshipNotification('application_review', {
        application: activeApplication,
        action: 'compliance'
      });
    } catch (e) {
      console.error('Compliance flagging failed', e);
      showError('Compliance Flagging Failed', 'Failed to flag application for compliance. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleViewDocument = async (docId, fileName) => {
    try {
      console.log('Viewing document:', docId, fileName);

      // Get the view URL for the document
      const viewUrl = await scholarshipApiService.viewDocument(docId);

      // Open the document in a new tab
      const newWindow = window.open(viewUrl, '_blank');

      if (!newWindow) {
        showWarning('Popup Blocked', 'Please allow popups for this site to view documents.');
        return;
      }

      showInfo('Document Viewer', `Opening document: ${fileName}`);
    } catch (error) {
      console.error('Failed to view document:', error);
      showError('View Failed', `Failed to view document: ${fileName}. ${error.message}`);
    }
  };

  // Quick action handlers for individual applications
  const handleQuickReviewed = async (application) => {
    if (!application) return;

    // Validate application status
    if (application.status !== 'submitted') {
      showError('Invalid Status', `Application must be in "Submitted" status to be marked as reviewed. Current status: ${application.status}`);
      return;
    }

    console.log('Quick review action triggered for application:', application.id);
    const confirmed = confirm(`Mark application ${application.applicationNumber} as reviewed?`);
    if (!confirmed) return;

    setReviewLoading(true);
    try {
      console.log('Calling markAsReviewed API for application:', application.id);
      await scholarshipApiService.markAsReviewed(application.id);
      console.log('API call successful, refreshing applications list');
      await fetchApplications();
      showSuccess('Application Reviewed', 'Application has been successfully marked as reviewed.');
    } catch (e) {
      console.error('Quick review failed', e);
      const errorMessage = e.message || 'Failed to mark as reviewed. Please try again.';
      showError('Review Failed', errorMessage);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleQuickCompliance = async (application) => {
    if (!application) return;

    setQuickActionType('compliance');
    setQuickActionReason('');
    setQuickActionApplication(application);
    setIsQuickActionModalOpen(true);
  };

  const handleQuickReject = async (application) => {
    if (!application) return;

    setQuickActionType('reject');
    setQuickActionReason('');
    setQuickActionApplication(application);
    setIsQuickActionModalOpen(true);
  };

  // Execute the quick action after modal confirmation
  const executeQuickAction = async () => {
    if (!quickActionApplication) return;

    setReviewLoading(true);
    setIsQuickActionModalOpen(false);

    try {
      switch (quickActionType) {
        case 'compliance':
          if (!quickActionReason?.trim()) {
            showWarning('Compliance Reason Required', 'Please enter a compliance reason.');
            setReviewLoading(false);
            return;
          }
          await scholarshipApiService.flagForCompliance(quickActionApplication.id, quickActionReason.trim());
          await fetchApplications();
          showSuccess('Application Flagged for Compliance', 'Application has been flagged for compliance review.');
          break;
        case 'reject':
          if (!quickActionReason?.trim()) {
            showWarning('Rejection Reason Required', 'Please enter a rejection reason.');
            setReviewLoading(false);
            return;
          }
          await scholarshipApiService.rejectApplication(quickActionApplication.id, quickActionReason.trim());
          await fetchApplications();
          showSuccess('Application Rejected', 'Application has been successfully rejected.');
          break;
        default:
          throw new Error('Invalid quick action type');
      }
    } catch (e) {
      console.error('Quick action failed', e);
      const actionName = quickActionType === 'reject' ? 'reject' : 'flag for compliance';
      showError(`${actionName.charAt(0).toUpperCase() + actionName.slice(1)} Failed`, `Failed to ${actionName} application. Please try again.`);
    } finally {
      setReviewLoading(false);
      setQuickActionReason('');
      setQuickActionType('');
      setQuickActionApplication(null);
    }
  };

  // Bulk action handlers
  const handleBulkReviewed = async () => {
    if (selectedApplications.length === 0) return;

    setBulkActionType('reviewed');
    setBulkActionReason('');
    setIsBulkActionModalOpen(true);
  };

  const handleBulkCompliance = async () => {
    if (selectedApplications.length === 0) return;

    setBulkActionType('compliance');
    setBulkActionReason('');
    setIsBulkActionModalOpen(true);
  };

  const handleBulkReject = async () => {
    if (selectedApplications.length === 0) return;

    setBulkActionType('reject');
    setBulkActionReason('');
    setIsBulkActionModalOpen(true);
  };

  // Execute the bulk action after modal confirmation
  const executeBulkAction = async () => {
    if (selectedApplications.length === 0) return;

    const count = selectedApplications.length;
    setReviewLoading(true);
    setIsBulkActionModalOpen(false);

    try {
      let promises = [];

      switch (bulkActionType) {
        case 'reviewed':
          promises = selectedApplications.map(appId =>
            scholarshipApiService.markAsReviewed(appId)
          );
          break;
        case 'compliance':
          if (!bulkActionReason?.trim()) {
            showWarning('Compliance Reason Required', 'Please enter a compliance reason.');
            setReviewLoading(false);
            return;
          }
          promises = selectedApplications.map(appId =>
            scholarshipApiService.flagForCompliance(appId, bulkActionReason.trim())
          );
          break;
        case 'reject':
          if (!bulkActionReason?.trim()) {
            showWarning('Rejection Reason Required', 'Please enter a rejection reason.');
            setReviewLoading(false);
            return;
          }
          promises = selectedApplications.map(appId =>
            scholarshipApiService.rejectApplication(appId, bulkActionReason.trim())
          );
          break;
        default:
          throw new Error('Invalid bulk action type');
      }

      await Promise.all(promises);
      await fetchApplications();
      setSelectedApplications([]);

      // Trigger notification for bulk action
      triggerScholarshipNotification('bulk_action', {
        action: bulkActionType,
        count: count
      });

      // Show success message based on action type
      switch (bulkActionType) {
        case 'reviewed':
          showSuccess('Bulk Review Complete', `${count} application(s) have been marked as reviewed.`);
          break;
        case 'compliance':
          showSuccess('Bulk Compliance Complete', `${count} application(s) have been flagged for compliance.`);
          break;
        case 'reject':
          showSuccess('Bulk Rejection Complete', `${count} application(s) have been rejected.`);
          break;
      }
    } catch (e) {
      console.error('Bulk action failed', e);
      const actionName = bulkActionType === 'reviewed' ? 'review' : bulkActionType;
      showError(`Bulk ${actionName.charAt(0).toUpperCase() + actionName.slice(1)} Failed`, `Failed to ${actionName} applications. Please try again.`);
    } finally {
      setReviewLoading(false);
      setBulkActionReason('');
      setBulkActionType('');
    }
  };

  const handleDownloadDocument = async (docId, fileName) => {
    setDocDownloadingId(docId);
    try {
      console.log('Downloading document:', docId, fileName);

      // Download the document blob
      const blob = await scholarshipApiService.downloadDocument(docId);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Download Complete', `Successfully downloaded: ${fileName}`);
    } catch (error) {
      console.error('Download failed:', error);
      showError('Download Failed', `Failed to download document: ${fileName}. ${error.message}`);
    } finally {
      setDocDownloadingId(null);
    }
  };


  // Application Card Component
  const ApplicationCard = ({ application }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group ${viewMode === 'list' ? 'rounded-lg' : 'rounded-xl'
      }`}>
      <div className={viewMode === 'list' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}>
        {/* Header */}
        <div className={`flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 ${viewMode === 'list' ? 'mb-3' : 'mb-4'}`}>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedApplications.includes(application.id)}
                onChange={() => handleSelectApplication(application.id)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className={`flex-shrink-0 ${viewMode === 'list' ? 'h-8 w-8' : 'h-10 w-10 sm:h-12 sm:w-12'}`}>
              <div className={`${viewMode === 'list' ? 'h-8 w-8' : 'h-10 w-10 sm:h-12 sm:w-12'} rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center`}>
                <User className={`${viewMode === 'list' ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-orange-600 dark:text-orange-400`} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`${viewMode === 'list' ? 'text-sm sm:text-base font-semibold' : 'text-base sm:text-lg font-semibold'} text-gray-900 dark:text-white truncate`}>
                {application.name}
              </h3>
              <p className={`${viewMode === 'list' ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-500 dark:text-gray-400 truncate`}>
                {application.studentId}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
              {getStatusIcon(application.status)}
              <span className="ml-1">{getStatusText(application.status)}</span>
            </span>
            {application.priority !== 'normal' && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                <Star className="w-3 h-3 mr-1" />
                {application.priority}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={viewMode === 'list' ? 'space-y-2' : 'space-y-4'}>
          {/* School Info */}
          <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
            <School className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
            <span className="truncate">{application.schoolName || 'No school specified'}</span>
          </div>

          {/* Academic Info - Responsive Grid */}
          <div className={`grid gap-3 ${viewMode === 'list'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2'
            }`}>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <GraduationCap className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">GWA:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.generalWeightedAverage || 'N/A'}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <BookOpen className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Level:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.currentEducationalLevel || 'N/A'}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <Award className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.scholarshipCategory || 'N/A'}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <PhilippinePeso className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                ₱{parseFloat(application.requestedAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Additional Info for List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Submitted: {new Date(application.submittedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <FileCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{application.documents?.length || 0} documents</span>
              </div>
            </div>
          )}

          {/* Grid View Additional Info */}
          {viewMode === 'grid' && (
            <>
              {/* Submitted Date */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Submitted: {new Date(application.submittedDate).toLocaleDateString()}</span>
              </div>

              {/* Documents Count */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                <FileCheck className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{application.documents?.length || 0} documents uploaded</span>
              </div>
            </>
          )}
        </div>

        {/* Actions - Responsive Layout */}
        <div className={`${viewMode === 'list' ? 'mt-3 pt-3' : 'mt-6 pt-4'} border-t border-gray-200 dark:border-slate-700`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openReview(application)}
                className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <Eye className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span>Review</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Status-specific quick actions */}
              {console.log('Application status for quick actions:', application.status, 'Application ID:', application.id)}
              {application.status === 'submitted' && (
                <button
                  onClick={() => handleQuickReviewed(application)}
                  className={`${viewMode === 'list' ? 'p-2' : 'p-1.5'} bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`}
                  title="Mark as Reviewed"
                >
                  <CheckCircle className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </button>
              )}
              {application.status === 'for_compliance' && (
                <button
                  onClick={() => handleQuickCompliance(application)}
                  className={`${viewMode === 'list' ? 'p-2' : 'p-1.5'} bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`}
                  title="Flag for Compliance"
                >
                  <Flag className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </button>
              )}
              {application.status === 'rejected' && (
                <button
                  onClick={() => openReview(application)}
                  className={`${viewMode === 'list' ? 'p-2' : 'p-1.5'} bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`}
                  title="View Details"
                >
                  <Eye className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </button>
              )}
              {/* Always show reject option for non-rejected applications */}
              {application.status !== 'rejected' && (
                <button
                  onClick={() => handleQuickReject(application)}
                  className={`${viewMode === 'list' ? 'p-2' : 'p-1.5'} bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`}
                  title="Reject"
                >
                  <XCircle className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleExport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Scholarship Applications Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table
    const tableColumn = ["Name", "Student ID", "School", "Program", "Category", "GWA", "Amount", "Status"];
    const tableRows = [];

    // Use filteredApplications to respect current filters
    const appsToExport = filteredApplications.length > 0 ? filteredApplications : applications;

    appsToExport.forEach(app => {
      const appData = [
        app.name,
        app.studentId,
        app.schoolName || 'N/A',
        app.scholarshipSubCategory || 'N/A',
        app.scholarshipCategory || 'N/A',
        app.generalWeightedAverage || 'N/A',
        app.requestedAmount ? `P${app.requestedAmount.toLocaleString()}` : '0',
        getStatusText(app.status)
      ];
      tableRows.push(appData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] }, // Orange color matching theme
    });

    doc.save(`scholarship_applications_${new Date().toISOString().split('T')[0]}.pdf`);
    showSuccess('Export Complete', 'Scholarship applications report has been downloaded as PDF.');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Scholarship Applications
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Review and manage scholarship applications
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base">
            <span className="hidden sm:inline">Review Selected</span>
            <span className="sm:hidden">Review</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">For Compliance</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.forCompliance}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search and Basic Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 w-full sm:min-w-64">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="for_compliance">For Compliance</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm sm:text-base ${showAdvancedFilters
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Filter</span>
            </button>

            <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'} rounded-l-lg transition-colors`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'} rounded-r-lg transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="gwa">Sort by GWA</option>
              <option value="amount">Sort by Amount</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="tertiary">Tertiary Students</option>
                  <option value="senior high">Senior High School</option>
                  <option value="technical">Technical Vocational</option>
                  <option value="als">Alternative Learning System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => updateFilter('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="senior high school">Senior High School</option>
                  <option value="tertiary">Tertiary/College</option>
                  <option value="technical">Technical Vocational</option>
                  <option value="graduate">Graduate School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School</label>
                <select
                  value={filters.school}
                  onChange={(e) => updateFilter('school', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Schools</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="high school">High School</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min GWA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={filters.minGwa}
                  onChange={(e) => updateFilter('minGwa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max GWA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={filters.maxGwa}
                  onChange={(e) => updateFilter('maxGwa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Status: {filters.status}
                <button onClick={() => updateFilter('status', 'all')} className="ml-1 hover:text-orange-600 dark:hover:text-orange-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Category: {filters.category}
                <button onClick={() => updateFilter('category', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.level !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Level: {filters.level}
                <button onClick={() => updateFilter('level', 'all')} className="ml-1 hover:text-green-600 dark:hover:text-green-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-purple-600 dark:hover:text-purple-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {selectedApplications.length} application(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkReviewed}
                  disabled={reviewLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  {reviewLoading ? 'Processing...' : 'Reviewed'}
                </button>
                <button
                  onClick={handleBulkCompliance}
                  disabled={reviewLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  {reviewLoading ? 'Processing...' : 'Compliance'}
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={reviewLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  {reviewLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications Grid/List */}
      {loading ? (
        <LoadingApplications />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : sortedApplications.length === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 sm:p-12 text-center">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
          {sortedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.lastPage, prev.currentPage + 1) }))}
              disabled={pagination.currentPage === pagination.lastPage}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{pagination.from}</span> to <span className="font-medium">{pagination.to}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Simple Page Indicator */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-slate-600 focus:outline-offset-0">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.lastPage, prev.currentPage + 1) }))}
                  disabled={pagination.currentPage === pagination.lastPage}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal - Large Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative z-10 w-full max-w-7xl h-[95vh] sm:h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col lg:flex-row overflow-hidden">
            {/* Left Sidebar - Actions */}
            <div className="w-full lg:w-80 bg-gray-50 dark:bg-slate-900 border-r-0 lg:border-r border-b lg:border-b-0 border-gray-200 dark:border-slate-700 flex flex-col flex-shrink-0 max-h-80 sm:max-h-96 lg:max-h-none overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Application</h3>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 lg:p-6 space-y-2 lg:space-y-3">
                <button
                  onClick={() => setReviewAction('reviewed')}
                  className={`w-full p-3 lg:p-4 rounded-lg border-2 transition-all ${reviewAction === 'reviewed'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    <div className="text-left">
                      <div className="font-semibold text-sm lg:text-base">Reviewed</div>
                      <div className="text-xs lg:text-sm opacity-75">Mark this application as reviewed</div>
                    </div>
                  </div>
                </button>


                <button
                  onClick={() => setReviewAction('compliance')}
                  className={`w-full p-3 lg:p-4 rounded-lg border-2 transition-all ${reviewAction === 'compliance'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-orange-300'
                    }`}
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <Flag className="w-4 h-4 lg:w-5 lg:h-5" />
                    <div className="text-left">
                      <div className="font-semibold text-sm lg:text-base">Compliance</div>
                      <div className="text-xs lg:text-sm opacity-75">Flag for compliance issues</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReviewAction('reject')}
                  className={`w-full p-3 lg:p-4 rounded-lg border-2 transition-all ${reviewAction === 'reject'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <XCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    <div className="text-left">
                      <div className="font-semibold text-sm lg:text-base">Reject</div>
                      <div className="text-xs lg:text-sm opacity-75">Reject this application</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Action Form */}
              <div className="flex-1 p-4 lg:p-6">
                {reviewAction === 'reviewed' && (
                  <div className="space-y-4">
                    {activeApplication?.status !== 'submitted' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                              Invalid Status
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              This application is currently in <span className="font-semibold">{getStatusText(activeApplication?.status)}</span> status.
                              Applications must be in <span className="font-semibold">Submitted</span> status to be marked as reviewed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type "REVIEWED" to confirm
                      </label>
                      <input
                        type="text"
                        value={reviewedConfirmation}
                        onChange={(e) => setReviewedConfirmation(e.target.value)}
                        placeholder="Type REVIEWED to confirm"
                        disabled={activeApplication?.status !== 'submitted'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleMarkAsReviewed}
                      disabled={reviewLoading || reviewedConfirmation !== 'REVIEWED' || activeApplication?.status !== 'submitted'}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Mark as Reviewed'}
                    </button>
                  </div>
                )}

                {reviewAction === 'compliance' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Reason
                      </label>
                      <textarea
                        value={complianceReason}
                        onChange={(e) => setComplianceReason(e.target.value)}
                        placeholder="Please provide specific details about the compliance issue..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleComplianceSubmit}
                      disabled={reviewLoading || !complianceReason.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Flag for Compliance'}
                    </button>
                  </div>
                )}

                {reviewAction === 'reject' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Please provide a detailed reason for rejection..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleReject}
                      disabled={reviewLoading || !rejectReason.trim()}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reviewLoading ? 'Processing...' : 'Reject Application'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Application Details */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 min-h-0">
              <div className="p-4 lg:p-6">
                {reviewLoading && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
                      <div className="text-gray-500">Loading application details...</div>
                    </div>
                  </div>
                )}

                {!reviewLoading && activeApplication ? (
                  <div className="space-y-8">
                    {console.log('Rendering application details for:', activeApplication)}
                    {/* Application Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {activeApplication.student?.first_name || 'N/A'} {activeApplication.student?.last_name || 'N/A'}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {activeApplication.student?.student_id_number || 'N/A'} • {activeApplication.student?.email_address || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Application #{activeApplication.application_number || activeApplication.id || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeApplication.status || 'pending')}`}>
                            {getStatusIcon(activeApplication.status || 'pending')}
                            <span className="ml-2">{getStatusText(activeApplication.status || 'pending')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-500" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.first_name} {activeApplication.student?.middle_name} {activeApplication.student?.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.birth_date ? new Date(activeApplication.student.birth_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Contact Number</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.contact_number || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Address</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.addresses?.[0]?.address_line_1 || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">City</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.addresses?.[0]?.city || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Province</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.addresses?.[0]?.province || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <School className="w-5 h-5 mr-2 text-green-500" />
                        Academic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">School</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.school?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Educational Level</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.current_academic_record?.educational_level || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Year Level</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.current_academic_record?.year_level || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">GWA/GPA</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.current_academic_record?.general_weighted_average || activeApplication.student?.current_academic_record?.gpa || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">School Year</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.current_academic_record?.school_year || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Semester</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.current_academic_record?.school_term || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <PhilippinePeso className="w-5 h-5 mr-2 text-yellow-500" />
                        Financial Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Requested Amount</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ₱{activeApplication.requested_amount ? parseFloat(activeApplication.requested_amount).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Approved Amount</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ₱{activeApplication.approved_amount ? parseFloat(activeApplication.approved_amount).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Family Income</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.financial_information?.family_monthly_income_range || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">Student Employed</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.is_employed ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">4Ps Beneficiary</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.financial_information?.is_4ps_beneficiary ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400">PWD</label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activeApplication.student?.is_pwd ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <FileCheck className="w-5 h-5 mr-2 text-purple-500" />
                        Documents
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {(activeApplication.documents || []).length === 0 && (
                              <tr><td className="px-4 py-3 text-gray-500 dark:text-gray-400" colSpan={4}>No documents uploaded.</td></tr>
                            )}
                            {(activeApplication.documents || []).map(doc => (
                              <tr key={doc.id}>
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{doc.document_type?.name || '—'}</td>
                                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{doc.file_name}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {doc.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleViewDocument(doc.id, doc.file_name)}
                                      className="p-1.5 rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                                      className="p-1.5 rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
                                      disabled={docDownloadingId === doc.id}
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Application Not Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Unable to load application details. Please try again.</p>
                      <button
                        onClick={() => setIsReviewModalOpen(false)}
                        className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Close Modal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {isBulkActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkActionModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {bulkActionType === 'reviewed' && 'Mark as Reviewed'}
                  {bulkActionType === 'compliance' && 'Flag for Compliance'}
                  {bulkActionType === 'reject' && 'Reject Applications'}
                </h3>
                <button
                  onClick={() => setIsBulkActionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action will be applied to <span className="font-semibold text-gray-900 dark:text-white">{selectedApplications.length} application(s)</span>.
                </p>
              </div>

              {/* Reason input for compliance and reject actions */}
              {(bulkActionType === 'compliance' || bulkActionType === 'reject') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {bulkActionType === 'compliance' ? 'Compliance Reason' : 'Rejection Reason'}
                  </label>
                  <textarea
                    value={bulkActionReason}
                    onChange={(e) => setBulkActionReason(e.target.value)}
                    placeholder={`Enter ${bulkActionType === 'compliance' ? 'compliance' : 'rejection'} reason...`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Confirmation for reviewed action */}
              {bulkActionType === 'reviewed' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This will mark all selected applications as reviewed. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsBulkActionModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                disabled={reviewLoading || (bulkActionType !== 'reviewed' && !bulkActionReason?.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${bulkActionType === 'reviewed'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : bulkActionType === 'compliance'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-red-500 hover:bg-red-600'
                  }`}
              >
                {reviewLoading ? 'Processing...' :
                  bulkActionType === 'reviewed' ? 'Mark as Reviewed' :
                    bulkActionType === 'compliance' ? 'Flag for Compliance' :
                      'Reject Applications'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {isQuickActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsQuickActionModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {quickActionType === 'reject' && 'Reject Application'}
                  {quickActionType === 'compliance' && 'Flag for Compliance'}
                </h3>
                <button
                  onClick={() => setIsQuickActionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quickActionType === 'reject' && 'This will reject the application and cannot be undone.'}
                  {quickActionType === 'compliance' && 'This will flag the application for compliance review.'}
                </p>
                {quickActionApplication && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                    Application: {quickActionApplication.applicationNumber || quickActionApplication.id}
                  </p>
                )}
              </div>

              {/* Reason input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {quickActionType === 'reject' ? 'Rejection Reason' : 'Compliance Reason'}
                </label>
                <textarea
                  value={quickActionReason}
                  onChange={(e) => setQuickActionReason(e.target.value)}
                  placeholder={`Enter ${quickActionType === 'reject' ? 'rejection' : 'compliance'} reason...`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsQuickActionModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeQuickAction}
                disabled={reviewLoading || !quickActionReason?.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${quickActionType === 'reject'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
              >
                {reviewLoading ? 'Processing...' :
                  quickActionType === 'reject' ? 'Reject Application' :
                    'Flag for Compliance'
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ScholarshipApplications; 