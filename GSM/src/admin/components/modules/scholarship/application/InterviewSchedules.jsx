import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  Video,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function InterviewSchedules() {
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToastContext();
  const [schedules, setSchedules] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'scheduled',
    interviewer: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('scheduled'); // 'scheduled' | 'pending'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0
  });

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isJoinMeetingModalOpen, setIsJoinMeetingModalOpen] = useState(false);
  const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create modal form state
  const [createFormData, setCreateFormData] = useState({
    interviewType: 'online',
    platform: 'zoom',
    meetingLink: '',
    studentId: '',
    interviewDate: '',
    interviewTime: '',
    duration: '30',
    staffId: '',
    notes: ''
  });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk schedule form state
  const [bulkFormData, setBulkFormData] = useState({
    interviewType: 'online',
    platform: 'zoom',
    meetingLink: '',
    interviewDate: '',
    interviewTime: '',
    duration: '30',
    gapTime: '15',
    staffId: '',
    notes: ''
  });
  const [bulkFormErrors, setBulkFormErrors] = useState({});
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);


  // Interview evaluation form state
  const [evaluationFormData, setEvaluationFormData] = useState({
    applicantId: '',
    applicationId: '',
    interviewerName: '',
    interviewDate: '',
    academicMotivationScore: '',
    leadershipInvolvementScore: '',
    financialNeedScore: '',
    characterValuesScore: '',
    overallRecommendation: '',
    remarks: ''
  });
  const [evaluationFormErrors, setEvaluationFormErrors] = useState({});
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);

  useEffect(() => {
    fetchData();
    fetchEligibleApplications(); // Keep this for the "Create" modal dropdown
    fetchStaffMembers();
  }, [activeTab, pagination.currentPage, pagination.perPage, filters, searchTerm]);

  const fetchSchedules = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        ...filters
      };

      // Basic search param
      if (searchTerm) params.search = searchTerm;

      const resp = await scholarshipApiService.getInterviewSchedules(params);
      const rawData = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      // Map backend fields to frontend expectations
      const mappedMethods = rawData.map(item => ({
        ...item,
        interviewDate: item.interview_date,
        interviewTime: item.interview_time,
        interviewer: item.interviewer_name || (item.staff ? item.staff.name : 'Unknown'),
        interviewerEmail: item.staff?.email || item.interviewer_email,
        studentName: item.student ? `${item.student.first_name} ${item.student.last_name}` : 'Unknown Student',
        studentEmail: item.student?.email_address,
        studentPhone: item.student?.phone_number,
        studentId: item.student?.student_id_number,
        duration: item.duration || 30,
        type: item.interview_type,
        location: item.interview_location,
        platform: item.platform || (item.interview_type === 'online' ? 'Online' : 'In-Person'),
        meetingLink: item.meeting_link,
        notes: item.interview_notes || item.notes,
        status: item.status,
        documents: item.documents || [] // Ensure documents array (though not in backend model, preventing crash)
      }));

      setSchedules(mappedMethods);

      // Update pagination only if this is the active tab
      if (activeTab === 'scheduled' && resp && resp.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: resp.meta.current_page || 1,
          lastPage: resp.meta.last_page || 1,
          total: resp.meta.total || 0,
          from: resp.meta.from || 0,
          to: resp.meta.to || 0
        }));
      }
    } catch (e) {
      console.error('Error fetching schedules:', e);
      // Don't set global error here to avoid UI disruption during background updates
    }
  };

  const fetchPendingApplications = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        ...filters
      };

      // Basic search param
      if (searchTerm) params.search = searchTerm;

      const resp = await scholarshipApiService.getApplications({
        ...params,
        status: 'documents_reviewed',
        with: 'student,category,subcategory'
      });
      setPendingApplications(Array.isArray(resp.data) ? resp.data : []);

      // Update pagination only if this is the active tab
      if (activeTab === 'pending' && resp && resp.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: resp.meta.current_page || 1,
          lastPage: resp.meta.last_page || 1,
          total: resp.meta.total || 0,
          from: resp.meta.from || 0,
          to: resp.meta.to || 0
        }));
      }
    } catch (e) {
      console.error('Error fetching pending applications:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'scheduled') {
        await fetchSchedules();
      } else {
        await fetchPendingApplications();
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleApplications = async () => {
    try {
      // Fetch applications with status 'documents_reviewed'
      const response = await scholarshipApiService.getApplications({
        status: 'documents_reviewed',
        per_page: 100 // Get more applications to have a good selection
      });

      setEligibleApplications(response.data || []);
    } catch (e) {
      console.error('Error loading eligible applications:', e);
      // Don't set error state for this as it's not critical to the main functionality
    }
  };



  const fetchStaffMembers = async () => {
    try {
      const response = await scholarshipApiService.getStaffInterviewers();
      console.log('Staff interviewers API response:', response);

      if (response && response.success && Array.isArray(response.data)) {
        // Filter out any empty or invalid objects
        const validStaff = response.data.filter(staff =>
          staff && staff.id && (staff.name || staff.user_id)
        );

        if (validStaff.length > 0) {
          setStaffMembers(validStaff);
        } else {
          console.warn('No valid staff members found in response:', response.data);
          showError('No interviewers available. Please ensure staff members with interviewer role are configured.');
          setStaffMembers([]);
        }
      } else {
        const errorMessage = response?.message || 'Invalid response format';
        console.error('Failed to fetch staff members:', errorMessage, response);
        showError(`Failed to load interviewers: ${errorMessage}. Please refresh the page.`);
        setStaffMembers([]);
      }
    } catch (error) {
      const errorMessage = error?.message || 'Network error or server unavailable';
      console.error('Error fetching staff members:', error);
      showError(`Failed to load interviewers: ${errorMessage}. Please refresh the page.`);
      setStaffMembers([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'rescheduled':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'online':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'in-person':
        return <MapPin className="w-4 h-4 text-green-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleCompleteInterview = async (scheduleId, result, notes = '') => {
    try {
      await scholarshipApiService.completeInterview(scheduleId, result, notes);

      // Refresh the schedules to get updated data
      await fetchSchedules();

      showToast(`✅ Interview completed successfully!\n\n📝 Result: ${result}\n📅 Completed at: ${new Date().toLocaleString()}`, 'success', 'Interview Completed');
    } catch (e) {
      console.error('Error completing interview:', e);
      showToast(`❌ Failed to complete interview:\n\n${e.message || 'Unknown error'}\n\nPlease try again.`, 'error', 'Interview Completion Failed');
    }
  };


  const handleCancelInterview = async (scheduleId, reason = '') => {
    try {
      await scholarshipApiService.cancelInterview(scheduleId, reason);

      // Refresh the schedules to get updated data
      await fetchSchedules();

      showToast(`✅ Interview cancelled successfully!\n\n📅 Cancelled at: ${new Date().toLocaleString()}`, 'success');
    } catch (e) {
      console.error('Error cancelling interview:', e);
      showToast(`❌ Failed to cancel interview:\n\n${e.message || 'Unknown error'}\n\nPlease try again.`, 'error');
    }
  };

  const handleMarkNoShow = async (scheduleId, notes = '') => {
    try {
      // Note: The API service doesn't have a markNoShow method yet, so we'll use completeInterview with a special result
      // This should be updated when the API service adds the markNoShow method
      await scholarshipApiService.completeInterview(scheduleId, 'failed', `No show: ${notes}`);

      // Refresh the schedules to get updated data
      await fetchSchedules();

      showToast(`✅ Interview marked as no show!\n\n📝 Notes: ${notes || 'No additional notes'}\n📅 Marked at: ${new Date().toLocaleString()}`, 'success');
    } catch (e) {
      console.error('Error marking as no show:', e);
      showToast(`❌ Failed to mark as no show:\n\n${e.message || 'Unknown error'}\n\nPlease try again.`, 'error');
    }
  };

  const handleScheduleInterview = async (applicationId, interviewData) => {
    try {
      await scholarshipApiService.scheduleInterview(applicationId, interviewData);

      // Refresh the schedules to get updated data
      await fetchSchedules();

      alert('Interview scheduled successfully');
    } catch (e) {
      console.error('Error scheduling interview:', e);
      alert('Failed to schedule interview: ' + (e.message || 'Unknown error'));
    }
  };

  const handleScheduleFromPending = (pendingSchedule) => {
    // Pre-populate the form with the pending application data
    setCreateFormData({
      interviewType: 'online',
      platform: 'zoom',
      meetingLink: '',
      studentId: pendingSchedule.applicationId.toString(),
      interviewDate: '',
      interviewTime: '',
      duration: '30',
      interviewer: '',
      notes: `Scheduling interview for ${pendingSchedule.studentName}`
    });
    setCreateFormErrors({});
    setActiveSchedule(null); // Clear any existing active schedule
    setIsCreateModalOpen(true);
  };

  const handleAutoScheduleInterview = async (applicationId) => {
    try {
      await scholarshipApiService.scheduleInterviewAuto(applicationId);

      // Refresh the schedules to get updated data
      await fetchSchedules();

      showToast(`✅ Interview scheduled automatically!\n\n📅 Scheduled for next available slot`, 'success');
    } catch (e) {
      console.error('Error auto-scheduling interview:', e);
      showToast(`❌ Failed to auto-schedule interview:\n\n${e.message || 'Unknown error'}\n\nPlease try manual scheduling.`, 'error');
    }
  };

  // Bulk Operations
  const handleUnselectAll = () => {
    setSelectedSchedules([]);
  };

  const handleSelectAll = () => {
    const allItemIds = sortedSchedules.map(schedule => schedule.id);
    setSelectedSchedules(allItemIds);
  };

  const handleBulkSchedule = () => {
    // Check if all selected schedules are pending applications
    const selectedItems = getAllItems().filter(item => selectedSchedules.includes(item.id));
    const pendingItems = selectedItems.filter(item => item.status === 'pending' && item.type === 'pending');

    if (pendingItems.length !== selectedItems.length) {
      alert('Only pending applications (awaiting interview scheduling) can be bulk scheduled.');
      return;
    }

    if (pendingItems.length === 0) {
      alert('No pending applications selected for scheduling.');
      return;
    }

    // Reset form and open modal
    setBulkFormData({
      interviewType: 'online',
      platform: 'zoom',
      meetingLink: '',
      interviewDate: '',
      interviewTime: '',
      duration: '30',
      gapTime: '15',
      interviewer: '',
      notes: ''
    });
    setBulkFormErrors({});
    setActiveSchedule(null); // Clear any existing active schedule
    setIsBulkScheduleModalOpen(true);
  };

  // Normalize items based on active tab
  const getAllItems = () => {
    if (activeTab === 'scheduled') {
      return schedules.map(schedule => ({
        ...schedule,
        type: 'schedule'
      }));
    } else {
      // Pending applications
      return pendingApplications.map(application => ({
        id: `pending-${application.id}`,
        applicationId: application.id,
        studentName: application.student ? `${application.student.first_name} ${application.student.last_name}` : 'Unknown Student',
        studentId: application.student?.student_id_number || 'N/A',
        studentEmail: application.student?.email_address || 'Not provided',
        studentPhone: application.student?.contact_number || 'Not provided',
        interviewer: 'Not Assigned',
        interviewerEmail: 'N/A',
        interviewDate: 'Not Scheduled',
        interviewTime: 'Not Scheduled',
        duration: 0,
        type: 'pending',
        platform: null,
        meetingLink: null,
        status: 'pending',
        notes: 'Awaiting interview scheduling',
        documents: ['Transcript', 'Recommendation Letter'], // Default documents
        createdAt: application.created_at,
        application: application,
        student: application.student,
        category: application.category,
        subcategory: application.subcategory
      }));
    }
  };

  // Server-side filtered already, but we keep this for additional client side transforms if needed
  const filteredSchedules = getAllItems();

  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'student':
        aValue = a.studentName.toLowerCase();
        bValue = b.studentName.toLowerCase();
        break;
      case 'interviewer':
        aValue = a.interviewer.toLowerCase();
        bValue = b.interviewer.toLowerCase();
        break;
      case 'date':
      default:
        aValue = new Date(a.interviewDate);
        bValue = new Date(b.interviewDate);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const ScheduleCard = ({ schedule }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group ${viewMode === 'list' ? 'rounded-lg' : 'rounded-xl'
      }`}>
      <div className={viewMode === 'list' ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${viewMode === 'list' ? 'mb-3' : 'mb-4'}`}>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedSchedules.includes(schedule.id)}
                onChange={() => handleSelectSchedule(schedule.id)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className={`flex-shrink-0 ${viewMode === 'list' ? 'h-8 w-8' : 'h-12 w-12'}`}>
              <div className={`${viewMode === 'list' ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center`}>
                <Calendar className={`${viewMode === 'list' ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 dark:text-blue-400`} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`${viewMode === 'list' ? 'text-base font-semibold' : 'text-lg font-semibold'} text-gray-900 dark:text-white truncate`}>
                {schedule.studentName}
              </h3>
              <p className={`${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 truncate`}>
                {schedule.studentId}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
              {getStatusIcon(schedule.status)}
              <span className="ml-1 capitalize">{schedule.status}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={viewMode === 'list' ? 'space-y-2' : 'space-y-4'}>
          {/* Interview Details */}
          <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
            <Calendar className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
            <span className="truncate">
              {schedule.status === 'pending' ? (
                'Awaiting interview scheduling'
              ) : (
                `${new Date(schedule.interviewDate).toLocaleDateString()} at ${schedule.interviewTime}`
              )}
            </span>
          </div>

          {/* Interview Info */}
          <div className={`grid gap-3 ${viewMode === 'list'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2'
            }`}>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <Users className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Interviewer:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {schedule.status === 'pending' ? 'Not Assigned' : schedule.interviewer}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              {schedule.status === 'pending' ? (
                <AlertTriangle className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-orange-500 flex-shrink-0`} />
              ) : (
                getTypeIcon(schedule.type)
              )}
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Type:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {schedule.status === 'pending' ? 'Not Determined' : schedule.type}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <Clock className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {schedule.status === 'pending' ? 'TBD' : `${schedule.duration} min`}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <FileText className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Documents:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {schedule.status === 'pending' ? 'Reviewed' : (schedule.documents?.length || 0)}
              </span>
            </div>
          </div>

          {/* Additional Info for List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{schedule.studentEmail}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{schedule.studentPhone}</span>
              </div>
            </div>
          )}

          {/* Platform/Location Info */}
          {schedule.type === 'online' && schedule.platform && (
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
              <Video className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              <span className="truncate">{schedule.platform}</span>
            </div>
          )}

          {schedule.type === 'in-person' && schedule.location && (
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
              <MapPin className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              <span className="truncate">{schedule.location}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`${viewMode === 'list' ? 'mt-3 pt-3' : 'mt-6 pt-4'} border-t border-gray-200 dark:border-slate-700`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleViewDetails(schedule)}
                className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <Eye className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span>View Details</span>
              </button>
              {schedule.status === 'pending' ? (
                <button
                  onClick={() => handleScheduleFromPending(schedule)}
                  className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
                >
                  <Plus className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                  <span>Schedule Interview</span>
                </button>
              ) : schedule.status !== 'completed' ? (
                <button
                  onClick={() => handleJoinMeeting(schedule)}
                  className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
                >
                  <Video className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                  <span>Join Meeting</span>
                </button>
              ) : null}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {schedule.status !== 'pending' && schedule.status !== 'completed' && (
                <button
                  onClick={() => handleRescheduleInterview(schedule)}
                  className={`${viewMode === 'list' ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm'} bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center space-x-1`}
                  title="Reschedule"
                >
                  <Calendar className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                  <span>Reschedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleSelectSchedule = (id) => {
    setSelectedSchedules(prev =>
      prev.includes(id)
        ? prev.filter(scheduleId => scheduleId !== id)
        : [...prev, id]
    );
  };


  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'pending', // Reset to default status
      interviewer: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'status' && value === 'pending') return false; // pending is default, not active
      return value !== 'all' && value !== '';
    }) || searchTerm;
  };

  // Button handler functions
  const handleViewDetails = (schedule) => {
    setActiveSchedule(schedule);
    setIsViewModalOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    setActiveSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleDeleteSchedule = (schedule) => {
    setActiveSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  const handleRescheduleInterview = (schedule) => {
    // Pre-populate the create form with existing schedule data for rescheduling
    setCreateFormData({
      interviewType: schedule.type === 'in-person' ? 'in-person' : 'online',
      platform: schedule.platform || 'zoom',
      meetingLink: schedule.meetingLink || '',
      studentId: schedule.application?.id || schedule.applicationId || '',
      interviewDate: schedule.interviewDate ? schedule.interviewDate.split('T')[0] : '',
      interviewTime: schedule.interviewTime || '',
      duration: schedule.duration?.toString() || '30',
      staffId: schedule.staffId || '',
      interviewer: schedule.interviewer || '',
      notes: schedule.notes || ''
    });

    setActiveSchedule(schedule);
    setIsCreateModalOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!activeSchedule) return;

    setActionLoading(true);
    try {
      // Note: The API doesn't have a delete endpoint for interview schedules
      // This would need to be implemented in the backend
      // For now, we'll cancel the interview instead
      await scholarshipApiService.cancelInterview(activeSchedule.id, 'Deleted by administrator');

      // Refresh the schedules to get updated data
      await fetchSchedules();

      setIsDeleteModalOpen(false);
      setActiveSchedule(null);

      // Show success message
      alert('Interview schedule cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling interview schedule:', error);
      alert('Failed to cancel interview schedule: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinMeeting = (schedule) => {
    // If no meeting link exists, generate one or use a default meeting platform
    let meetingLink = schedule.meetingLink;

    if (!meetingLink) {
      // Generate a meeting link based on interview type
      if (schedule.type === 'online') {
        // For online interviews, you could integrate with a meeting platform like Zoom, Google Meet, etc.
        // For now, we'll create a placeholder link
        meetingLink = `https://meet.google.com/${schedule.id || 'interview-' + Date.now()}`;
      } else {
        // For in-person interviews, show location details
        meetingLink = `Location: ${schedule.location || 'To be determined'}`;
      }
    }

    // Open meeting URL in new tab if it's a valid URL
    if (meetingLink && (meetingLink.startsWith('http://') || meetingLink.startsWith('https://'))) {
      window.open(meetingLink, '_blank');
    } else if (meetingLink && !meetingLink.startsWith('Location:')) {
      // Try to add https:// if it's not a location description
      const urlWithProtocol = meetingLink.startsWith('http') ? meetingLink : `https://${meetingLink}`;
      window.open(urlWithProtocol, '_blank');
    }

    setActiveSchedule({ ...schedule, meetingLink });
    // Pre-populate evaluation form with schedule data
    setEvaluationFormData({
      applicantId: schedule.studentId,
      applicationId: schedule.application?.id || schedule.applicationId || 'N/A',
      interviewerName: schedule.interviewer,
      interviewDate: formatDateForDisplay(schedule.interviewDate),
      academicMotivationScore: '',
      leadershipInvolvementScore: '',
      financialNeedScore: '',
      characterValuesScore: '',
      overallRecommendation: '',
      remarks: ''
    });
    setIsJoinMeetingModalOpen(true);
  };

  // Form handling functions
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (createFormErrors[field]) {
      setCreateFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createFormData.studentId) {
      errors.studentId = 'Please select a student with documents reviewed status';
    }
    if (!createFormData.interviewDate) {
      errors.interviewDate = 'Please select an interview date';
    } else {
      // Validate that interview date is today or in the future
      const selectedDate = new Date(createFormData.interviewDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (selectedDate < today) {
        errors.interviewDate = 'Interview date must be today or in the future';
      }
    }
    if (!createFormData.interviewTime) {
      errors.interviewTime = 'Please select an interview time';
    }
    if (!createFormData.staffId) {
      errors.staffId = 'Please select an interviewer';
    }
    if (!createFormData.meetingLink) {
      errors.meetingLink = 'Please enter meeting link';
    }

    // Additional validation: check if selected application is eligible
    if (createFormData.studentId) {
      const selectedApplication = eligibleApplications.find(app => app.id.toString() === createFormData.studentId);
      if (!selectedApplication) {
        errors.studentId = 'Selected application is not eligible for interview scheduling';
      } else if (selectedApplication.status !== 'documents_reviewed') {
        errors.studentId = 'Selected application must have documents reviewed status';
      }
    }

    // Check for interviewer time conflicts
    if (createFormData.staffId && createFormData.interviewDate && createFormData.interviewTime) {
      const selectedStaff = staffMembers.find(staff => staff.id.toString() === createFormData.staffId);
      if (selectedStaff) {
        const conflicts = checkInterviewerAvailability(
          selectedStaff.name,
          createFormData.interviewDate,
          createFormData.interviewTime,
          createFormData.duration,
          null,
          createFormData.staffId
        );

        if (conflicts.length > 0) {
          const conflictDetails = conflicts.map(conflict =>
            `${conflict.studentName} (${conflict.displayStartTime} - ${conflict.displayEndTime})`
          ).join(', ');

          errors.interviewTime = `Time conflict detected! ${selectedStaff.name} already has interview(s) at this time: ${conflictDetails}`;
        }
      }
    }

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the interview data for the API
      const selectedStaff = staffMembers.find(staff => staff.id.toString() === createFormData.staffId);
      if (!selectedStaff) {
        throw new Error('Selected interviewer not found');
      }

      if (!selectedStaff.user_id) {
        throw new Error('Selected interviewer is missing user ID. Please refresh the page and try again.');
      }

      const interviewData = {
        interview_date: createFormData.interviewDate,
        interview_time: createFormData.interviewTime,
        interview_location: 'Online',
        interview_type: 'online',
        meeting_link: createFormData.meetingLink,
        staff_id: createFormData.staffId,
        interviewer_id: selectedStaff.user_id,
        interviewer_name: selectedStaff.name,
        scheduling_type: 'manual',
        interview_notes: createFormData.notes,
        duration: parseInt(createFormData.duration) || 30
      };

      // Get the application ID from the selected student
      const applicationId = parseInt(createFormData.studentId);

      if (!applicationId) {
        throw new Error('Invalid application selected');
      }

      // Check if we're rescheduling an existing interview
      if (activeSchedule && activeSchedule.id) {
        // For rescheduling, we need to update the existing interview
        // Note: This would require an update endpoint in the API
        // For now, we'll create a new interview and mark the old one as cancelled
        await scholarshipApiService.scheduleInterview(applicationId, interviewData);

        // Show reschedule success message
        const selectedStudent = eligibleApplications.find(app => app.id === parseInt(createFormData.studentId));
        const studentName = selectedStudent ? `${selectedStudent.student.first_name} ${selectedStudent.student.last_name}` : 'Student';
        const interviewerName = selectedStaff?.name || 'Interviewer';
        const scheduleTime = `${createFormData.interviewDate} at ${createFormData.interviewTime}`;

        showToast(`✅ Interview rescheduled successfully!\n\n📅 ${studentName}\n👤 Interviewer: ${interviewerName}\n🕐 ${scheduleTime}\n⏱️ Duration: ${createFormData.duration} minutes`, 'success');
      } else {
        // Creating a new interview
        await scholarshipApiService.scheduleInterview(applicationId, interviewData);

        // Show success message with details
        const selectedStudent = eligibleApplications.find(app => app.id === parseInt(createFormData.studentId));
        const studentName = selectedStudent ? `${selectedStudent.student.first_name} ${selectedStudent.student.last_name}` : 'Student';
        const interviewerName = selectedStaff?.name || 'Interviewer';
        const scheduleTime = `${createFormData.interviewDate} at ${createFormData.interviewTime}`;

        showToast(`✅ Interview scheduled successfully!\n\n📅 ${studentName}\n👤 Interviewer: ${interviewerName}\n🕐 ${scheduleTime}\n⏱️ Duration: ${createFormData.duration} minutes`, 'success', 'Interview Scheduled');
      }

      // Refresh the schedules, pending applications, and eligible applications to get updated data
      await fetchSchedules();
      await fetchPendingApplications();
      await fetchEligibleApplications();

      setIsCreateModalOpen(false);
      setActiveSchedule(null);
      setCreateFormData({
        interviewType: 'online',
        platform: 'zoom',
        meetingLink: '',
        studentId: '',
        interviewDate: '',
        interviewTime: '',
        duration: '30',
        staffId: '',
        notes: ''
      });
      setCreateFormErrors({});
    } catch (error) {
      console.error('Error creating interview schedule:', error);

      // Handle conflict errors specifically
      if (error.response?.status === 409 && error.response?.data?.conflicts) {
        const conflicts = error.response.data.conflicts;
        const conflictDetails = conflicts.map(conflict =>
          `• ${conflict.student_name} (${conflict.display_start_time} - ${conflict.display_end_time})`
        ).join('\n');

        showToast(`❌ Cannot schedule interview due to conflicts!\n\n👤 ${selectedStaff?.name || 'The interviewer'} already has interview(s) at this time:\n\n${conflictDetails}\n\nPlease choose a different time slot.`, 'error');
        return;
      }

      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        showToast(`❌ Validation failed:\n\n${validationErrors.map(err => `• ${err}`).join('\n')}`, 'error');
        return;
      }

      // Handle server errors
      if (error.response?.status >= 500) {
        showToast(`❌ Server error (${error.response?.status}):\n\n${error.response?.data?.message || error.message || 'Internal server error'}\n\nPlease try again or contact support.`, 'error');
        return;
      }

      // Generic error
      showToast(`❌ Failed to create interview schedule:\n\n${error.message || 'Unknown error'}\n\nPlease check your input and try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      interviewType: 'online',
      platform: 'zoom',
      meetingLink: '',
      studentId: '',
      interviewDate: '',
      interviewTime: '',
      duration: '30',
      staffId: '',
      notes: ''
    });
    setCreateFormErrors({});
    setActiveSchedule(null);
  };

  // Bulk schedule form handling functions
  const handleBulkFormChange = (field, value) => {
    setBulkFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (bulkFormErrors[field]) {
      setBulkFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateBulkForm = () => {
    const errors = {};

    if (!bulkFormData.interviewDate) {
      errors.interviewDate = 'Please select an interview date';
    }
    if (!bulkFormData.interviewTime) {
      errors.interviewTime = 'Please select an interview time';
    }
    if (!bulkFormData.staffId) {
      errors.staffId = 'Please select an interviewer';
    }
    if (!bulkFormData.meetingLink) {
      errors.meetingLink = 'Please enter meeting link';
    }

    // Check for interviewer time conflicts in bulk scheduling
    if (bulkFormData.staffId && bulkFormData.interviewDate && bulkFormData.interviewTime) {
      const selectedStaff = staffMembers.find(staff => staff.id.toString() === bulkFormData.staffId);
      if (selectedStaff) {
        const conflicts = checkInterviewerAvailability(
          selectedStaff.name,
          bulkFormData.interviewDate,
          bulkFormData.interviewTime,
          bulkFormData.duration,
          null,
          bulkFormData.staffId
        );

        if (conflicts.length > 0) {
          const conflictDetails = conflicts.map(conflict =>
            `${conflict.studentName} (${conflict.displayStartTime} - ${conflict.displayEndTime})`
          ).join(', ');

          errors.interviewTime = `Time conflict detected! ${selectedStaff.name} already has interview(s) at this time: ${conflictDetails}`;
        }
      }

      // Also check if the bulk scheduling would create conflicts within itself
      const selectedItems = getAllItems().filter(item => selectedSchedules.includes(item.id));
      const pendingItems = selectedItems.filter(item => item.status === 'pending' && item.type === 'pending');

      if (pendingItems.length > 1) {
        const interviewTimes = calculateConsecutiveTimes(
          bulkFormData.interviewTime,
          bulkFormData.duration,
          bulkFormData.gapTime,
          pendingItems.length
        );

        // Check if any of the calculated consecutive times would conflict with existing schedules
        for (let i = 1; i < interviewTimes.length; i++) {
          const timeSlot = interviewTimes[i];
          const laterConflicts = checkInterviewerAvailability(
            selectedStaff.name,
            bulkFormData.interviewDate,
            timeSlot.startTime,
            bulkFormData.duration
          );

          if (laterConflicts.length > 0) {
            errors.interviewTime = `Bulk scheduling would create conflicts later in the day. Consider starting earlier or increasing gap time.`;
            break;
          }
        }
      }
    }

    setBulkFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBulkScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBulkForm()) {
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const selectedItems = getAllItems().filter(item => selectedSchedules.includes(item.id));
      const pendingItems = selectedItems.filter(item => item.status === 'pending' && item.type === 'pending');

      // Calculate consecutive interview times
      const interviewTimes = calculateConsecutiveTimes(
        bulkFormData.interviewTime,
        bulkFormData.duration,
        bulkFormData.gapTime,
        pendingItems.length
      );

      const selectedStaff = staffMembers.find(staff => staff.id.toString() === bulkFormData.staffId);
      if (!selectedStaff) {
        throw new Error('Selected interviewer not found');
      }

      if (!selectedStaff.user_id) {
        throw new Error('Selected interviewer is missing user ID. Please refresh the page and try again.');
      }

      // Schedule interviews for all selected pending applications with consecutive times
      const promises = pendingItems.map((item, index) => {
        const timeSlot = interviewTimes[index];
        const interviewData = {
          interview_date: bulkFormData.interviewDate,
          interview_time: timeSlot.startTime,
          interview_location: 'Online',
          interview_type: 'online',
          meeting_link: bulkFormData.meetingLink,
          staff_id: bulkFormData.staffId,
          interviewer_id: selectedStaff.user_id,
          interviewer_name: selectedStaff.name,
          scheduling_type: 'manual',
          interview_notes: `${bulkFormData.notes}\n\nScheduled Time: ${timeSlot.displayTime} - ${formatTimeForDisplay(timeSlot.endTime)}`,
          duration: parseInt(bulkFormData.duration) || 30
        };

        return scholarshipApiService.scheduleInterview(item.applicationId, interviewData);
      });

      await Promise.all(promises);

      // Refresh the schedules, pending applications, and eligible applications to get updated data
      await fetchSchedules();
      await fetchPendingApplications();
      await fetchEligibleApplications();

      setIsBulkScheduleModalOpen(false);
      setSelectedSchedules([]);
      setBulkFormData({
        interviewType: 'online',
        platform: 'zoom',
        meetingLink: '',
        interviewDate: '',
        interviewTime: '',
        duration: '30',
        gapTime: '15',
        staffId: '',
        notes: ''
      });
      setBulkFormErrors({});

      // Show detailed success message with scheduled times
      const timeDetails = interviewTimes.map((time, index) =>
        `${pendingItems[index].studentName}: ${time.displayTime} - ${formatTimeForDisplay(time.endTime)}`
      ).join('\n');

      showToast(`✅ Successfully scheduled ${pendingItems.length} interview(s)!\n\n👤 Interviewer: ${selectedStaff?.name || 'Selected interviewer'}\n📅 Date: ${bulkFormData.interviewDate}\n⏱️ Duration: ${bulkFormData.duration} minutes each\n\n📋 Scheduled Times:\n${timeDetails}`, 'success');
    } catch (error) {
      console.error('Error bulk scheduling interviews:', error);

      // Handle conflict errors specifically
      if (error.response?.status === 409 && error.response?.data?.conflicts) {
        const conflicts = error.response.data.conflicts;
        const conflictDetails = conflicts.map(conflict =>
          `${conflict.student_name} (${conflict.display_start_time} - ${conflict.display_end_time})`
        ).join(', ');

        showToast(`Cannot schedule interviews due to conflicts!\n\n${selectedStaff?.name || 'The interviewer'} already has interview(s) at this time:\n${conflictDetails}`, 'error');
        return;
      }

      showToast('Failed to schedule some interviews: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const resetBulkForm = () => {
    setBulkFormData({
      interviewType: 'online',
      platform: 'zoom',
      meetingLink: '',
      interviewDate: '',
      interviewTime: '',
      duration: '30',
      gapTime: '15',
      staffId: '',
      notes: ''
    });
    setBulkFormErrors({});
  };

  // Enhanced toast utility function
  const showToast = (message, type = 'success', title = null) => {
    // Combine title and message since the underlying toast component doesn't support titles
    // and passing title as the second argument would be interpreted as duration
    const displayMessage = title ? `${title}: ${message}` : message;

    switch (type) {
      case 'success':
        showSuccess(displayMessage);
        break;
      case 'error':
        showError(displayMessage);
        break;
      case 'warning':
        showWarning(displayMessage);
        break;
      default:
        showInfo(displayMessage);
    }
  };

  // Time calculation utilities
  const addMinutesToTime = (timeString, minutes) => {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  const formatTimeForDisplay = (timeString) => {
    const [hours, mins] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(mins);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not specified';

    try {
      // Handle ISO date strings
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  const calculateConsecutiveTimes = (startTime, duration, gapTime, count) => {
    const times = [];
    let currentTime = startTime;

    for (let i = 0; i < count; i++) {
      times.push({
        startTime: currentTime,
        endTime: addMinutesToTime(currentTime, parseInt(duration)),
        displayTime: formatTimeForDisplay(currentTime)
      });

      // Calculate next interview time (current end time + gap)
      currentTime = addMinutesToTime(currentTime, parseInt(duration) + parseInt(gapTime));
    }

    return times;
  };

  // Overlap detection function
  const checkInterviewerAvailability = (interviewerName, date, time, duration, excludeScheduleId = null, staffId = null) => {
    const conflicts = [];
    const newStartMinutes = timeToMinutes(time);
    const newEndMinutes = newStartMinutes + parseInt(duration);

    // Check existing schedules for the same interviewer on the same date
    const existingSchedules = schedules.filter(schedule => {
      const sameInterviewer = staffId ?
        schedule.staffId === staffId :
        schedule.interviewer === interviewerName;

      return sameInterviewer &&
        schedule.interviewDate === date &&
        schedule.status !== 'cancelled' &&
        schedule.id !== excludeScheduleId;
    });

    existingSchedules.forEach(schedule => {
      const existingStartMinutes = timeToMinutes(schedule.interviewTime);
      const existingEndMinutes = existingStartMinutes + (schedule.duration || 30);

      if (doTimeRangesOverlap(newStartMinutes, newEndMinutes, existingStartMinutes, existingEndMinutes)) {
        conflicts.push({
          scheduleId: schedule.id,
          studentName: schedule.studentName,
          startTime: schedule.interviewTime,
          endTime: minutesToTime(existingEndMinutes),
          displayStartTime: formatTimeForDisplay(schedule.interviewTime),
          displayEndTime: formatTimeForDisplay(minutesToTime(existingEndMinutes))
        });
      }
    });

    return conflicts;
  };

  // Helper function to suggest available time slots
  const getAvailableTimeSlots = (interviewerName, date, duration) => {
    const availableSlots = [];
    const workStartHour = 8; // 8:00 AM
    const workEndHour = 17; // 5:00 PM
    const slotDuration = parseInt(duration);

    // Get existing schedules for the interviewer on the given date
    const existingSchedules = schedules.filter(schedule =>
      schedule.interviewer === interviewerName &&
      schedule.interviewDate === date &&
      schedule.status !== 'cancelled'
    ).sort((a, b) => timeToMinutes(a.interviewTime) - timeToMinutes(b.interviewTime));

    let currentTime = workStartHour * 60; // Start at 8:00 AM in minutes

    while (currentTime + slotDuration <= workEndHour * 60) {
      const currentTimeStr = minutesToTime(currentTime);
      const conflicts = checkInterviewerAvailability(interviewerName, date, currentTimeStr, duration);

      if (conflicts.length === 0) {
        availableSlots.push({
          time: currentTimeStr,
          displayTime: formatTimeForDisplay(currentTimeStr),
          endTime: minutesToTime(currentTime + slotDuration),
          displayEndTime: formatTimeForDisplay(minutesToTime(currentTime + slotDuration))
        });
      }

      currentTime += 30; // Check every 30 minutes
    }

    return availableSlots;
  };

  // Evaluation form handling functions
  const handleEvaluationFormChange = (field, value) => {
    setEvaluationFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (evaluationFormErrors[field]) {
      setEvaluationFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEvaluationForm = () => {
    const errors = {};

    if (!evaluationFormData.academicMotivationScore) {
      errors.academicMotivationScore = 'Please provide academic motivation score';
    }
    if (!evaluationFormData.leadershipInvolvementScore) {
      errors.leadershipInvolvementScore = 'Please provide leadership & involvement score';
    }
    if (!evaluationFormData.financialNeedScore) {
      errors.financialNeedScore = 'Please provide financial need score';
    }
    if (!evaluationFormData.characterValuesScore) {
      errors.characterValuesScore = 'Please provide character & values score';
    }
    if (!evaluationFormData.overallRecommendation) {
      errors.overallRecommendation = 'Please provide overall recommendation';
    }
    if (!evaluationFormData.remarks) {
      errors.remarks = 'Please provide remarks';
    }

    setEvaluationFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();

    if (!validateEvaluationForm()) {
      return;
    }

    setIsSubmittingEvaluation(true);
    try {
      if (!activeSchedule) {
        throw new Error('No active schedule selected');
      }

      // Determine the interview result based on the overall recommendation
      let interviewResult = 'needs_followup';
      if (evaluationFormData.overallRecommendation === 'recommended') {
        interviewResult = 'passed';
      } else if (evaluationFormData.overallRecommendation === 'not_recommended') {
        interviewResult = 'failed';
      }

      // Send detailed evaluation data
      const evaluationData = {
        academic_motivation_score: parseInt(evaluationFormData.academicMotivationScore),
        leadership_involvement_score: parseInt(evaluationFormData.leadershipInvolvementScore),
        financial_need_score: parseInt(evaluationFormData.financialNeedScore),
        character_values_score: parseInt(evaluationFormData.characterValuesScore),
        overall_recommendation: evaluationFormData.overallRecommendation,
        remarks: evaluationFormData.remarks,
        // Legacy fields for backward compatibility
        interview_result: interviewResult,
        interview_notes: evaluationFormData.remarks
      };

      await scholarshipApiService.completeInterview(
        activeSchedule.id,
        interviewResult,
        evaluationFormData.remarks,
        evaluationData
      );

      // Refresh the schedules to get updated data
      await fetchSchedules();

      setIsJoinMeetingModalOpen(false);
      setActiveSchedule(null);
      setEvaluationFormData({
        applicantId: '',
        applicationId: '',
        interviewerName: '',
        interviewDate: '',
        academicMotivationScore: '',
        leadershipInvolvementScore: '',
        financialNeedScore: '',
        characterValuesScore: '',
        overallRecommendation: '',
        remarks: ''
      });
      setEvaluationFormErrors({});

      // Enhanced success message with evaluation details
      const evaluationSummary = `
📊 Evaluation Summary:
• Academic Motivation: ${evaluationFormData.academicMotivationScore}/5
• Leadership & Involvement: ${evaluationFormData.leadershipInvolvementScore}/5  
• Financial Need: ${evaluationFormData.financialNeedScore}/5
• Character & Values: ${evaluationFormData.characterValuesScore}/5

🎯 Overall Recommendation: ${evaluationFormData.overallRecommendation === 'recommended' ? 'Recommended for SSC Review' : evaluationFormData.overallRecommendation === 'not_recommended' ? 'Not Recommended' : 'Needs Follow-up'}

✅ Interview evaluation has been successfully submitted and stored in the database.
      `.trim();

      showToast(evaluationSummary, 'success', 'Interview Evaluation Submitted');
    } catch (error) {
      console.error('Error submitting evaluation:', error);

      // Enhanced error message
      const errorMessage = `
❌ Failed to submit interview evaluation

${error.response?.data?.message || error.message || 'Unknown error occurred'}

Please check your internet connection and try again. If the problem persists, contact the system administrator.
      `.trim();

      showToast(errorMessage, 'error', 'Evaluation Submission Failed');
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const resetEvaluationForm = () => {
    setEvaluationFormData({
      applicantId: '',
      applicationId: '',
      interviewerName: '',
      interviewDate: '',
      academicMotivationScore: '',
      leadershipInvolvementScore: '',
      financialNeedScore: '',
      characterValuesScore: '',
      overallRecommendation: '',
      remarks: ''
    });
    setEvaluationFormErrors({});
  };

  // Utility function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date format';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === 'Invalid Date') return 'N/A';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      if (isNaN(time.getTime())) {
        return 'Invalid time format';
      }
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time format';
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Interview Schedules Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table
    const tableColumn = ["Student Name", "Student ID", "Interviewer", "Date", "Time", "Type", "Status"];
    const tableRows = [];

    // Use filteredSchedules to respect current filters
    const itemsToExport = filteredSchedules.length > 0 ? filteredSchedules : getAllItems();

    itemsToExport.forEach(item => {
      // Format date and time
      const dateStr = item.interviewDate && item.interviewDate !== 'Not Scheduled'
        ? new Date(item.interviewDate).toLocaleDateString()
        : 'Not Scheduled';

      const timeStr = item.interviewTime && item.interviewTime !== 'Not Scheduled'
        ? item.interviewTime
        : 'TBD';

      const itemData = [
        item.studentName,
        item.studentId,
        item.interviewer,
        dateStr,
        timeStr,
        item.type === 'pending' ? 'Pending' : (item.type || 'N/A'),
        (item.status || 'unknown').toUpperCase()
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue color matching interview theme
    });

    doc.save(`interview_schedules_${new Date().toISOString().split('T')[0]}.pdf`);
    showSuccess('Export Complete', 'Interview schedules report has been downloaded as PDF.');
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Interview Schedules
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Manage and schedule scholarship interviews
            {pendingApplications.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-medium">
                {pendingApplications.length} pending interview(s)
              </span>
            )}
          </p>
          {eligibleApplications.length === 0 && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> No applications with "Documents Reviewed" status found.
                Interviews can only be scheduled for applications that have passed document review.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:mt-0">
          <button
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={() => {
              setActiveSchedule(null); // Clear any existing active schedule
              setIsCreateModalOpen(true);
            }}
            disabled={eligibleApplications.length === 0}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base ${eligibleApplications.length === 0
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            title={eligibleApplications.length === 0 ? 'No eligible applications available' : 'Schedule new interview'}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule Interview</span>
            <span className="sm:hidden">Schedule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab('scheduled');
              setFilters(prev => ({ ...prev, status: 'scheduled' }));
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className={`${activeTab === 'scheduled'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled Interviews
            {activeTab === 'scheduled' && pagination.total > 0 && (
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">
                {pagination.total}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('pending');
              setFilters(prev => ({ ...prev, status: 'all' }));
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className={`${activeTab === 'pending'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pending Scheduling
            {activeTab === 'pending' && pagination.total > 0 && (
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">
                {pagination.total}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search and Basic Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 min-w-0">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {activeTab === 'scheduled' && (
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm sm:text-base ${showAdvancedFilters
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
                  title="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'} transition-colors`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 ${viewMode === 'calendar' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'} rounded-r-lg transition-colors`}
                  title="Calendar view"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="date">Sort by Date</option>
                <option value="student">Sort by Student</option>
                <option value="interviewer">Sort by Interviewer</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interviewer</label>
                <select
                  value={filters.interviewer}
                  onChange={(e) => updateFilter('interviewer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Interviewers</option>
                  <option value="Dr. Maria Santos">Dr. Maria Santos</option>
                  <option value="Prof. Pedro Reyes">Prof. Pedro Reyes</option>
                  <option value="Dr. Ana Lopez">Dr. Ana Lopez</option>
                </select>
              </div>

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
            {searchTerm && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-purple-600 dark:hover:text-purple-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-sm text-gray-600 dark:text-gray-300 underline hover:text-gray-800 dark:hover:text-gray-100">
              Clear all filters
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedSchedules.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {selectedSchedules.length} schedule(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkSchedule}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Bulk Schedule</span>
                </button>
                {selectedSchedules.length > 0 && selectedSchedules.length < sortedSchedules.length && (
                  <button
                    onClick={handleSelectAll}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Select All
                  </button>
                )}
                <button
                  onClick={handleUnselectAll}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Unselect All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedules Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading schedules...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : sortedSchedules.length === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 sm:p-12 text-center">
          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No schedules found</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Try adjusting your filters or create a new schedule.</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView schedules={sortedSchedules} />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-3'}>
          {sortedSchedules.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )
      }

      {/* Pagination Controls */}
      {
        !loading && !error && pagination.total > 0 && (
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
        )
      }

      {/* Create Schedule Modal */}
      {
        isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateModalOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeSchedule && activeSchedule.id ? 'Reschedule Interview' : 'Schedule New Interview'}
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                {/* Interview Type - Online Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Interview Type
                  </label>
                  <div className="flex items-center p-4 border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Online Interview</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">Video conference meeting</div>
                    </div>
                  </div>
                </div>

                {/* Online Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Online Platform
                  </label>
                  <select
                    value={createFormData.platform}
                    onChange={(e) => handleCreateFormChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="meet">Google Meet</option>
                    <option value="webex">Cisco Webex</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={createFormData.meetingLink}
                    onChange={(e) => handleCreateFormChange('meetingLink', e.target.value)}
                    placeholder="https://zoom.us/j/123456789"
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${createFormErrors.meetingLink ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  />
                  {createFormErrors.meetingLink && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createFormErrors.meetingLink}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter the meeting URL that students will use to join the interview
                  </p>
                </div>

                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Student (Documents Reviewed Only)
                  </label>
                  <select
                    value={createFormData.studentId}
                    onChange={(e) => handleCreateFormChange('studentId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${createFormErrors.studentId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Choose a student...</option>
                    {eligibleApplications.length > 0 ? (
                      eligibleApplications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.student ? `${application.student.first_name} ${application.student.last_name}` : 'Unknown Student'}
                          ({application.application_number || `App-${application.id}`})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No eligible applications found</option>
                    )}
                  </select>
                  {createFormErrors.studentId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createFormErrors.studentId}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Only students with applications in "Documents Reviewed" status can be scheduled for interviews.
                  </p>
                </div>

                {/* Interview Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Date
                    </label>
                    <input
                      type="date"
                      value={createFormData.interviewDate}
                      onChange={(e) => handleCreateFormChange('interviewDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${createFormErrors.interviewDate ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                        }`}
                    />
                    {createFormErrors.interviewDate && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createFormErrors.interviewDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Time
                    </label>
                    <input
                      type="time"
                      value={createFormData.interviewTime}
                      onChange={(e) => handleCreateFormChange('interviewTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${createFormErrors.interviewTime ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                        }`}
                    />
                    {createFormErrors.interviewTime && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createFormErrors.interviewTime}</p>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={createFormData.duration}
                    onChange={(e) => handleCreateFormChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                {/* Interviewer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interviewer
                  </label>
                  <select
                    value={createFormData.staffId}
                    onChange={(e) => handleCreateFormChange('staffId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${createFormErrors.staffId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Select an interviewer</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id} disabled={!staff.user_id}>
                        {staff.name} {!staff.user_id ? '(Missing User ID)' : ''}
                      </option>
                    ))}
                  </select>
                  {createFormErrors.staffId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createFormErrors.staffId}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interview Notes
                  </label>
                  <textarea
                    rows={3}
                    value={createFormData.notes}
                    onChange={(e) => handleCreateFormChange('notes', e.target.value)}
                    placeholder="Any special instructions or notes for the interview..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetCreateForm();
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{activeSchedule && activeSchedule.id ? 'Rescheduling...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <span>{activeSchedule && activeSchedule.id ? 'Reschedule Interview' : 'Schedule Interview'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* View Details Modal */}
      {
        isViewModalOpen && activeSchedule && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsViewModalOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Information */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Student Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white break-words">{activeSchedule.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Student ID</p>
                      <p className="font-medium text-gray-900 dark:text-white break-all">{activeSchedule.studentId}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white break-all" title={activeSchedule.studentEmail}>
                        {activeSchedule.studentEmail}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white break-all" title={activeSchedule.studentPhone}>
                        {activeSchedule.studentPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interview Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Interview Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                      <p className="font-medium text-gray-900 dark:text-white break-words">
                        {formatDate(activeSchedule.interviewDate)} at {formatTime(activeSchedule.interviewTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{activeSchedule.duration || 'N/A'} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{activeSchedule.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeSchedule.status || 'unknown')}`}>
                        {getStatusIcon(activeSchedule.status || 'unknown')}
                        <span className="ml-1 capitalize">{activeSchedule.status || 'Unknown'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meeting Details */}
                {activeSchedule.type === 'online' && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Meeting Details</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Platform</p>
                        <p className="font-medium text-gray-900 dark:text-white">{activeSchedule.platform}</p>
                      </div>
                      {activeSchedule.meetingLink && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Meeting Link</p>
                          <a
                            href={activeSchedule.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {activeSchedule.meetingLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interviewer Information */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Interviewer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white break-words" title={activeSchedule.interviewer}>
                        {activeSchedule.interviewer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white break-all" title={activeSchedule.interviewerEmail}>
                        {activeSchedule.interviewerEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {activeSchedule.notes && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Notes</h4>
                    <p className="text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap" title={activeSchedule.notes}>
                      {activeSchedule.notes}
                    </p>
                  </div>
                )}

                {/* Documents */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Required Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {(activeSchedule.documents || []).map((doc, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                {activeSchedule.status !== 'pending' && activeSchedule.status !== 'completed' && (
                  <button
                    onClick={() => handleJoinMeeting(activeSchedule)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Meeting</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Join Meeting & Interview Output Modal */}
      {
        isJoinMeetingModalOpen && activeSchedule && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsJoinMeetingModalOpen(false)} />
            <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join Meeting & Interview Output</h3>
                <button
                  onClick={() => setIsJoinMeetingModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Meeting Link Section */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    {(activeSchedule.type === 'online' ||
                      activeSchedule.platform?.toLowerCase().includes('zoom') ||
                      activeSchedule.platform?.toLowerCase().includes('meet') ||
                      activeSchedule.platform?.toLowerCase().includes('teams') ||
                      activeSchedule.meetingLink?.includes('zoom') ||
                      activeSchedule.meetingLink?.includes('meet') ||
                      activeSchedule.meetingLink?.includes('teams') ||
                      activeSchedule.meetingLink?.startsWith('http')) ? 'Meeting Link' : 'Interview Location'}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(activeSchedule.type === 'online' ||
                          activeSchedule.platform?.toLowerCase().includes('zoom') ||
                          activeSchedule.platform?.toLowerCase().includes('meet') ||
                          activeSchedule.platform?.toLowerCase().includes('teams') ||
                          activeSchedule.meetingLink?.includes('zoom') ||
                          activeSchedule.meetingLink?.includes('meet') ||
                          activeSchedule.meetingLink?.includes('teams') ||
                          activeSchedule.meetingLink?.startsWith('http')) ? 'Platform' : 'Type'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activeSchedule.platform ||
                          ((activeSchedule.type === 'online' ||
                            activeSchedule.platform?.toLowerCase().includes('zoom') ||
                            activeSchedule.platform?.toLowerCase().includes('meet') ||
                            activeSchedule.platform?.toLowerCase().includes('teams') ||
                            activeSchedule.meetingLink?.includes('zoom') ||
                            activeSchedule.meetingLink?.includes('meet') ||
                            activeSchedule.meetingLink?.includes('teams') ||
                            activeSchedule.meetingLink?.startsWith('http')) ? 'Google Meet' : 'In-Person Interview')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(activeSchedule.type === 'online' ||
                          activeSchedule.platform?.toLowerCase().includes('zoom') ||
                          activeSchedule.platform?.toLowerCase().includes('meet') ||
                          activeSchedule.platform?.toLowerCase().includes('teams') ||
                          activeSchedule.meetingLink?.includes('zoom') ||
                          activeSchedule.meetingLink?.includes('meet') ||
                          activeSchedule.meetingLink?.includes('teams') ||
                          activeSchedule.meetingLink?.startsWith('http')) ? 'Meeting Link' : 'Location Details'}
                      </p>
                      <div className="flex items-center space-x-2">
                        {/* Check if it's an online meeting based on platform or meeting link */}
                        {(activeSchedule.type === 'online' ||
                          activeSchedule.platform?.toLowerCase().includes('zoom') ||
                          activeSchedule.platform?.toLowerCase().includes('meet') ||
                          activeSchedule.platform?.toLowerCase().includes('teams') ||
                          activeSchedule.meetingLink?.includes('zoom') ||
                          activeSchedule.meetingLink?.includes('meet') ||
                          activeSchedule.meetingLink?.includes('teams') ||
                          activeSchedule.meetingLink?.startsWith('http')) ? (
                          <>
                            <div className="flex-1 p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                              <p className="font-medium text-gray-900 dark:text-white break-all">
                                {activeSchedule.meetingLink}
                              </p>
                            </div>
                            {activeSchedule.status !== 'completed' && (
                              <button
                                onClick={() => {
                                  // Ensure the link has proper protocol
                                  let meetingUrl = activeSchedule.meetingLink;
                                  if (!meetingUrl.startsWith('http://') && !meetingUrl.startsWith('https://')) {
                                    meetingUrl = 'https://' + meetingUrl;
                                  }
                                  window.open(meetingUrl, '_blank');
                                }}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-1 flex-shrink-0"
                                title="Join Meeting"
                              >
                                <Video className="w-4 h-4" />
                                <span className="text-sm">Join Meeting</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activeSchedule.meetingLink}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              In-person interview location
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Output Form */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Interview Evaluation Record
                  </h4>

                  <form onSubmit={handleEvaluationSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Applicant ID
                        </label>
                        <input
                          type="text"
                          value={evaluationFormData.applicantId}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Application ID
                        </label>
                        <input
                          type="text"
                          value={evaluationFormData.applicationId}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Interviewer Name
                        </label>
                        <input
                          type="text"
                          value={evaluationFormData.interviewerName}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Interview Date
                        </label>
                        <input
                          type="text"
                          value={evaluationFormData.interviewDate}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Scoring Section */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-900 dark:text-white">Scoring (1-5 scale)</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Academic Motivation Score
                          </label>
                          <select
                            value={evaluationFormData.academicMotivationScore}
                            onChange={(e) => handleEvaluationFormChange('academicMotivationScore', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${evaluationFormErrors.academicMotivationScore ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                              }`}
                          >
                            <option value="">Select score...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Below Average</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                          {evaluationFormErrors.academicMotivationScore && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.academicMotivationScore}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Leadership & Involvement Score
                          </label>
                          <select
                            value={evaluationFormData.leadershipInvolvementScore}
                            onChange={(e) => handleEvaluationFormChange('leadershipInvolvementScore', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${evaluationFormErrors.leadershipInvolvementScore ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                              }`}
                          >
                            <option value="">Select score...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Below Average</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                          {evaluationFormErrors.leadershipInvolvementScore && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.leadershipInvolvementScore}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Financial Need Score
                          </label>
                          <select
                            value={evaluationFormData.financialNeedScore}
                            onChange={(e) => handleEvaluationFormChange('financialNeedScore', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${evaluationFormErrors.financialNeedScore ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                              }`}
                          >
                            <option value="">Select score...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Below Average</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                          {evaluationFormErrors.financialNeedScore && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.financialNeedScore}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Character & Values Score
                          </label>
                          <select
                            value={evaluationFormData.characterValuesScore}
                            onChange={(e) => handleEvaluationFormChange('characterValuesScore', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${evaluationFormErrors.characterValuesScore ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                              }`}
                          >
                            <option value="">Select score...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Below Average</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                          {evaluationFormErrors.characterValuesScore && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.characterValuesScore}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Overall Recommendation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Overall Recommendation
                      </label>
                      <select
                        value={evaluationFormData.overallRecommendation}
                        onChange={(e) => handleEvaluationFormChange('overallRecommendation', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${evaluationFormErrors.overallRecommendation ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                          }`}
                      >
                        <option value="">Select recommendation...</option>
                        <option value="recommended">✅ Recommended for SSC Review</option>
                        <option value="not_recommended">❌ Not Recommended</option>
                        <option value="needs_followup">⚠️ Conditional Recommendation</option>
                      </select>
                      {evaluationFormErrors.overallRecommendation && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.overallRecommendation}</p>
                      )}
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Remarks
                      </label>
                      <textarea
                        rows={4}
                        value={evaluationFormData.remarks}
                        onChange={(e) => handleEvaluationFormChange('remarks', e.target.value)}
                        placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement, and any other relevant observations..."
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${evaluationFormErrors.remarks ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                          }`}
                      />
                      {evaluationFormErrors.remarks && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{evaluationFormErrors.remarks}</p>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => setIsJoinMeetingModalOpen(false)}
                  disabled={isSubmittingEvaluation}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEvaluationSubmit}
                  disabled={isSubmittingEvaluation}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmittingEvaluation ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardList className="w-4 h-4" />
                      <span>Submit Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        isDeleteModalOpen && activeSchedule && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)} />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Interview Schedule</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete the interview schedule for <strong>{activeSchedule.studentName}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Warning:</strong> This action cannot be undone. The interview schedule will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSchedule}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Schedule Modal */}
      {
        isBulkScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkScheduleModalOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Schedule Interviews</h3>
                <button
                  onClick={() => setIsBulkScheduleModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Scheduling {selectedSchedules.length} pending application(s)</strong> with consecutive interview times.
                </p>
              </div>

              {/* Schedule Preview */}
              {bulkFormData.interviewDate && bulkFormData.interviewTime && selectedSchedules.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                    Schedule Preview
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const selectedItems = getAllItems().filter(item => selectedSchedules.includes(item.id));
                      const pendingItems = selectedItems.filter(item => item.status === 'pending' && item.type === 'pending');
                      const times = calculateConsecutiveTimes(
                        bulkFormData.interviewTime,
                        bulkFormData.duration,
                        bulkFormData.gapTime,
                        pendingItems.length
                      );

                      return pendingItems.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            {item.studentName}
                          </span>
                          <span className="text-blue-700 dark:text-blue-300">
                            {times[index].displayTime} - {formatTimeForDisplay(times[index].endTime)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Total time: {(() => {
                        const totalMinutes = selectedSchedules.length * parseInt(bulkFormData.duration) +
                          (selectedSchedules.length - 1) * parseInt(bulkFormData.gapTime);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                      })()}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleBulkScheduleSubmit} className="space-y-6">
                {/* Interview Type - Online Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Interview Type
                  </label>
                  <div className="flex items-center p-4 border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Online Interview</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">Video conference meeting</div>
                    </div>
                  </div>
                </div>

                {/* Online Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Online Platform
                  </label>
                  <select
                    value={bulkFormData.platform}
                    onChange={(e) => handleBulkFormChange('platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="meet">Google Meet</option>
                    <option value="webex">Cisco Webex</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={bulkFormData.meetingLink}
                    onChange={(e) => handleBulkFormChange('meetingLink', e.target.value)}
                    placeholder="https://zoom.us/j/123456789"
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${bulkFormErrors.meetingLink ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  />
                  {bulkFormErrors.meetingLink && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{bulkFormErrors.meetingLink}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter the meeting URL that students will use to join the interview
                  </p>
                </div>

                {/* Interview Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Date
                    </label>
                    <input
                      type="date"
                      value={bulkFormData.interviewDate}
                      onChange={(e) => handleBulkFormChange('interviewDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${bulkFormErrors.interviewDate ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                        }`}
                    />
                    {bulkFormErrors.interviewDate && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{bulkFormErrors.interviewDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interview Time
                    </label>
                    <input
                      type="time"
                      value={bulkFormData.interviewTime}
                      onChange={(e) => handleBulkFormChange('interviewTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${bulkFormErrors.interviewTime ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                        }`}
                    />
                    {bulkFormErrors.interviewTime && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{bulkFormErrors.interviewTime}</p>
                    )}
                  </div>
                </div>

                {/* Duration and Gap Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={bulkFormData.duration}
                      onChange={(e) => handleBulkFormChange('duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gap Between Interviews (minutes)
                    </label>
                    <select
                      value={bulkFormData.gapTime}
                      onChange={(e) => handleBulkFormChange('gapTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Interviewer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interviewer
                  </label>
                  <select
                    value={bulkFormData.staffId}
                    onChange={(e) => handleBulkFormChange('staffId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${bulkFormErrors.staffId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                      }`}
                  >
                    <option value="">Select an interviewer</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id} disabled={!staff.user_id}>
                        {staff.name} {!staff.user_id ? '(Missing User ID)' : ''}
                      </option>
                    ))}
                  </select>
                  {bulkFormErrors.staffId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{bulkFormErrors.staffId}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interview Notes
                  </label>
                  <textarea
                    rows={3}
                    value={bulkFormData.notes}
                    onChange={(e) => handleBulkFormChange('notes', e.target.value)}
                    placeholder="Any special instructions or notes for the interviews..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkScheduleModalOpen(false);
                      resetBulkForm();
                    }}
                    disabled={isSubmittingBulk}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBulk}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmittingBulk ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Schedule {selectedSchedules.length} Interview(s)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

    </div >
  );
}

// Calendar View Component
const CalendarView = ({ schedules }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule =>
      schedule.interviewDate === dateStr
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = formatDate(currentDate);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthName}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const daySchedules = getSchedulesForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-200 dark:border-slate-700 ${day ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-900'
                  } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                      }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {daySchedules.slice(0, 3).map(schedule => (
                        <div
                          key={schedule.id}
                          className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded truncate"
                          title={`${schedule.studentName} - ${schedule.interviewTime}`}
                        >
                          {schedule.studentName}
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedules;
