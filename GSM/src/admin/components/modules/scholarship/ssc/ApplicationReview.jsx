import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Send,
  RefreshCw,
  AlertTriangle,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  School,
  Calendar,
  PhilippinePeso,
  GraduationCap,
  BookOpen,
  Star,
  MessageSquare
} from 'lucide-react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';

function ApplicationReview() {
  const { success: showSuccess, error: showError } = useToastContext();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    school: 'all'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await scholarshipApiService.getSscPendingApplications({
        per_page: 100,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const applicationsData = response.data.map(app => {
        const student = app.student;
        const school = app.school;
        const category = app.category;
        const subcategory = app.subcategory;
        const interview = app.interview_schedule;
        const evaluation = interview?.interview_evaluation;

        return {
          id: app.id,
          applicationNumber: app.application_number,
          name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
          studentId: student?.student_id_number || `APP-${app.id}`,
          email: student?.email_address || '',
          phone: student?.contact_number || '',
          schoolName: school?.name || 'Unknown School',
          schoolType: school?.classification || 'Unknown',
          educationalLevel: student?.academic_records?.[0]?.educational_level || 'Tertiary',
          yearLevel: student?.academic_records?.[0]?.year_level || 'Unknown',
          course: student?.academic_records?.[0]?.program || 'Unknown Program',
          gwa: student?.academic_records?.[0]?.general_weighted_average?.toString() || 'N/A',
          scholarshipCategory: category?.name || 'Unknown Category',
          scholarshipSubCategory: subcategory?.name || 'Unknown Subcategory',
          requestedAmount: app.requested_amount || 0,
          approvedAmount: app.approved_amount || app.requested_amount || 0,
          endorsedDate: app.updated_at,
          submittedDate: app.submitted_at || app.created_at,
          financialNeed: app.financial_need_description || '',

          // Interview-specific data
          interview: interview ? {
            id: interview.id,
            date: interview.interview_date,
            time: interview.interview_time,
            interviewer: interview.interviewer_name || 'Unknown',
            result: interview.interview_result,
            notes: interview.interview_notes,
            evaluation: evaluation ? {
              academicMotivationScore: evaluation.academic_motivation_score || 0,
              leadershipInvolvementScore: evaluation.leadership_involvement_score || 0,
              financialNeedScore: evaluation.financial_need_score || 0,
              characterValuesScore: evaluation.character_values_score || 0,
              overallRecommendation: evaluation.overall_recommendation || 'not_recommended',
              remarks: evaluation.remarks || '',
              strengths: evaluation.strengths || '',
              areasForImprovement: evaluation.areas_for_improvement || '',
              additionalNotes: evaluation.additional_notes || ''
            } : null
          } : null
        };
      });

      setApplications(applicationsData);
    } catch (e) {
      console.error('Error fetching SSC pending applications:', e);
      setError('Failed to load applications ready for SSC review');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.scholarshipCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || app.scholarshipCategory === filters.category;
    const matchesSchool = filters.school === 'all' || app.schoolType === filters.school;

    return matchesSearch && matchesCategory && matchesSchool;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'gwa':
        aValue = parseFloat(a.gwa) || 0;
        bValue = parseFloat(b.gwa) || 0;
        break;
      case 'requestedAmount':
        aValue = a.requestedAmount;
        bValue = b.requestedAmount;
        break;
      case 'updated_at':
      default:
        aValue = new Date(a.endorsedDate);
        bValue = new Date(b.endorsedDate);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const ApplicationCard = ({ application }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 ${viewMode === 'list' ? 'rounded-lg' : 'rounded-xl'
      }`}>
      <div className={viewMode === 'list' ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${viewMode === 'list' ? 'mb-3' : 'mb-4'}`}>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedApplications.includes(application.id)}
                onChange={() => handleSelectApplication(application.id)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className={`flex-shrink-0 ${viewMode === 'list' ? 'h-8 w-8' : 'h-12 w-12'}`}>
              <div className={`${viewMode === 'list' ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center`}>
                <Award className={`${viewMode === 'list' ? 'h-4 w-4' : 'h-6 w-6'} text-orange-600 dark:text-orange-400`} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`${viewMode === 'list' ? 'text-base font-semibold' : 'text-lg font-semibold'} text-gray-900 dark:text-white truncate`}>
                {application.name}
              </h3>
              <p className={`${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 truncate`}>
                {application.studentId}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={viewMode === 'list' ? 'space-y-2' : 'space-y-4'}>
          {/* School Info */}
          <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
            <School className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
            <span className="truncate">{application.schoolName}</span>
          </div>

          {/* Academic Info */}
          <div className={`grid gap-3 ${viewMode === 'list'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2'
            }`}>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <GraduationCap className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">GWA:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.gwa}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <BookOpen className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Level:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.educationalLevel}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <Award className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {application.scholarshipCategory}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} min-w-0`}>
              <PhilippinePeso className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                ₱{application.requestedAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Interview Evaluation Details */}
          {application.interview && application.interview.evaluation && (
            <div className={`${viewMode === 'list' ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 ${viewMode === 'list' ? 'p-2' : 'p-3'}`}>
                <div className={`flex items-center space-x-2 mb-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                  <MessageSquare className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600`} />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Interview Evaluation</span>
                </div>

                {/* Evaluation Scores */}
                <div className={`grid ${viewMode === 'list' ? 'grid-cols-1 gap-1' : 'grid-cols-1 gap-2'} ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Academic:</span>
                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${i < (application.interview.evaluation.academicMotivationScore || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                        {application.interview.evaluation.academicMotivationScore || 0}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Leadership:</span>
                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${i < (application.interview.evaluation.leadershipInvolvementScore || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                        {application.interview.evaluation.leadershipInvolvementScore || 0}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Financial:</span>
                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${i < (application.interview.evaluation.financialNeedScore || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                        {application.interview.evaluation.financialNeedScore || 0}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Character:</span>
                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${i < (application.interview.evaluation.characterValuesScore || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                      <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                        {application.interview.evaluation.characterValuesScore || 0}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Status */}
              <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                <span className="text-gray-600 dark:text-gray-400">Recommendation:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${application.interview.evaluation.overallRecommendation === 'recommended'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : application.interview.evaluation.overallRecommendation === 'needs_followup'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                  {application.interview.evaluation.overallRecommendation === 'recommended' && '✅ Recommended'}
                  {application.interview.evaluation.overallRecommendation === 'needs_followup' && '⚠️ Conditional'}
                  {application.interview.evaluation.overallRecommendation === 'not_recommended' && '❌ Not Recommended'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`${viewMode === 'list' ? 'mt-3 pt-3' : 'mt-6 pt-4'} border-t border-gray-200 dark:border-slate-700`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => openApproveModal(application)}
                className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <CheckCircle className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span>Approve</span>
              </button>
              <button
                onClick={() => openRejectModal(application)}
                className={`flex items-center space-x-2 ${viewMode === 'list' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-sm'} bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <XCircle className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span>Reject</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => openViewModal(application)}
                className={`${viewMode === 'list' ? 'p-2' : 'p-1.5'} bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`}
                title="View Details"
              >
                <Eye className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

  const openViewModal = (application) => {
    setActiveApplication(application);
    setIsViewModalOpen(true);
  };

  const openApproveModal = (application) => {
    setActiveApplication(application);
    setApproveAmount(application.requestedAmount.toString());
    setApproveNotes('');
    setIsApproveModalOpen(true);
  };

  const openRejectModal = (application) => {
    setActiveApplication(application);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!activeApplication) return;

    if (!approveAmount || parseFloat(approveAmount) <= 0) {
      showError('Please enter a valid approved amount.', 'Invalid Amount');
      return;
    }

    try {
      await scholarshipApiService.sscApproveApplication(
        activeApplication.id,
        parseFloat(approveAmount),
        approveNotes
      );

      setApplications(prev => prev.filter(app => app.id !== activeApplication.id));
      setIsApproveModalOpen(false);
      showSuccess('Application approved successfully!', 'Approval Successful');
    } catch (error) {
      console.error('Approval failed:', error);
      showError('Failed to approve application. Please try again.', 'Approval Failed');
    }
  };

  const handleReject = async () => {
    if (!activeApplication || !rejectReason.trim()) {
      showError('Please provide a reason for rejection.', 'Rejection Reason Required');
      return;
    }

    try {
      await scholarshipApiService.sscRejectApplication(
        activeApplication.id,
        rejectReason.trim()
      );

      setApplications(prev => prev.filter(app => app.id !== activeApplication.id));
      setIsRejectModalOpen(false);
      setRejectReason('');
      showSuccess('Application rejected successfully.', 'Rejection Successful');
    } catch (error) {
      console.error('Rejection failed:', error);
      showError('Failed to reject application. Please try again.', 'Rejection Failed');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return;

    try {
      const result = await scholarshipApiService.sscBulkApprove(
        selectedApplications,
        bulkNotes
      );

      setApplications(prev => prev.filter(app => !selectedApplications.includes(app.id)));
      setSelectedApplications([]);
      setIsBulkApproveModalOpen(false);
      setBulkNotes('');
      showSuccess(
        `Successfully approved ${result.approved_count} application(s)!`,
        'Bulk Approval Successful'
      );
    } catch (error) {
      console.error('Bulk approval failed:', error);
      showError('Failed to bulk approve applications. Please try again.', 'Bulk Approval Failed');
    }
  };

  const handleBulkReject = async () => {
    if (selectedApplications.length === 0) return;

    if (!bulkRejectReason.trim()) {
      showError('Please provide a reason for bulk rejection.', 'Rejection Reason Required');
      return;
    }

    try {
      const result = await scholarshipApiService.sscBulkReject(
        selectedApplications,
        bulkRejectReason.trim()
      );

      setApplications(prev => prev.filter(app => !selectedApplications.includes(app.id)));
      setSelectedApplications([]);
      setIsBulkRejectModalOpen(false);
      setBulkRejectReason('');
      showSuccess(
        `Successfully rejected ${result.rejected_count} application(s)!`,
        'Bulk Rejection Successful'
      );
    } catch (error) {
      console.error('Bulk rejection failed:', error);
      showError('Failed to bulk reject applications. Please try again.', 'Bulk Rejection Failed');
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      school: 'all'
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== 'all') || searchTerm;
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Basic Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 min-w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${showAdvancedFilters
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                  : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>Advanced</span>
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
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="updated_at">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="gwa">Sort by GWA</option>
              <option value="requestedAmount">Sort by Amount</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Financial Need">Financial Need</option>
                  <option value="Special Programs">Special Programs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School Type</label>
                <select
                  value={filters.school}
                  onChange={(e) => updateFilter('school', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Schools</option>
                  <option value="State University">State University</option>
                  <option value="Private University">Private University</option>
                  <option value="College">College</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
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
        {selectedApplications.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {selectedApplications.length} application(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsBulkApproveModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => setIsBulkRejectModalOpen(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Bulk Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : sortedApplications.length === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
          <p className="text-gray-600 dark:text-gray-400">No applications are pending SSC review at this time.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sortedApplications.length} Application{sortedApplications.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
            >
              {selectedApplications.length === sortedApplications.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}>
            {sortedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        </div>
      )}

      {/* View Details Modal - (Truncated for length, continues with modals...) */}
      {/* Approve Modal */}
      {isApproveModalOpen && activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsApproveModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Approve Application
              </h3>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You are about to approve the application for:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activeApplication.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeApplication.studentId} • {activeApplication.schoolName}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Approved Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Requested: ₱{activeApplication.requestedAmount.toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsRejectModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reject Application
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You are about to reject the application for:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {activeApplication.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeApplication.studentId} • {activeApplication.schoolName}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this application..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This reason will be recorded and may be shared with the applicant.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {isBulkApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkApproveModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk Approve Applications
              </h3>
              <button
                onClick={() => setIsBulkApproveModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are about to approve {selectedApplications.length} application(s). Each will be approved with their requested amount.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add any notes for these approvals..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsBulkApproveModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve {selectedApplications.length} Application(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {isBulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBulkRejectModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk Reject Applications
              </h3>
              <button
                onClick={() => setIsBulkRejectModalOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are about to reject {selectedApplications.length} application(s).
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting these applications..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This reason will be recorded for all rejected applications.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsBulkRejectModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject {selectedApplications.length} Application(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Similar to EndorseToSSC.jsx */}
      {isViewModalOpen && activeApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Application Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {activeApplication.name} - {activeApplication.studentId}
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
              <div className="space-y-6">
                {/* Student Information */}
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Student Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Full Name:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Student ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.studentId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Email:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Phone:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.phone || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">GWA:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.gwa}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Educational Level:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.educationalLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Course:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.course || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">School:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.schoolName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scholarship Information */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Scholarship Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Category:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium">
                        {activeApplication.scholarshipCategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Subcategory:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium">
                        {activeApplication.scholarshipSubCategory || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Requested Amount:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium">
                        ₱{activeApplication.requestedAmount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interview Evaluation */}
                {activeApplication.interview && activeApplication.interview.evaluation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Interview Evaluation</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Interview Date:</span>
                        <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                          {new Date(activeApplication.interview.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Interviewer:</span>
                        <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                          {activeApplication.interview.interviewer}
                        </span>
                      </div>
                    </div>

                    {/* Evaluation Scores */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-blue-900 dark:text-blue-100">Evaluation Scores:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Academic Motivation:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < (activeApplication.interview.evaluation?.academicMotivationScore || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium">
                              {activeApplication.interview.evaluation?.academicMotivationScore || 0}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Leadership & Involvement:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < (activeApplication.interview.evaluation?.leadershipInvolvementScore || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium">
                              {activeApplication.interview.evaluation?.leadershipInvolvementScore || 0}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Financial Need:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < (activeApplication.interview.evaluation?.financialNeedScore || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium">
                              {activeApplication.interview.evaluation?.financialNeedScore || 0}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Character & Values:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < (activeApplication.interview.evaluation?.characterValuesScore || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium">
                              {activeApplication.interview.evaluation?.characterValuesScore || 0}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Recommendation */}
                    <div className="mt-4">
                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Overall Recommendation:</h5>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${activeApplication.interview.evaluation?.overallRecommendation === 'recommended'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {activeApplication.interview.evaluation?.overallRecommendation === 'recommended' && (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup' && (
                          <AlertTriangle className="w-4 h-4 mr-1" />
                        )}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'not_recommended' && (
                          <X className="w-4 h-4 mr-1" />
                        )}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'recommended' && 'Recommended for SSC Approval'}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup' && 'Conditional Recommendation'}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'not_recommended' && 'Not Recommended'}
                      </div>
                    </div>

                    {/* Interview Notes and Details */}
                    {activeApplication.interview.evaluation && (
                      <div className="mt-4 space-y-3">
                        {activeApplication.interview.evaluation?.remarks && (
                          <div>
                            <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Interview Notes:</h6>
                            <p className="text-sm text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              {activeApplication.interview.evaluation.remarks}
                            </p>
                          </div>
                        )}
                        {activeApplication.interview.evaluation?.strengths && (
                          <div>
                            <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Strengths:</h6>
                            <p className="text-sm text-blue-800 dark:text-blue-200 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              {activeApplication.interview.evaluation.strengths}
                            </p>
                          </div>
                        )}
                        {activeApplication.interview.evaluation?.areasForImprovement && (
                          <div>
                            <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Areas for Improvement:</h6>
                            <p className="text-sm text-blue-800 dark:text-blue-200 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              {activeApplication.interview.evaluation.areasForImprovement}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openApproveModal(activeApplication);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openRejectModal(activeApplication);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationReview;
