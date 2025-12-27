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
  Users,
  School,
  Calendar,
  DollarSign,
  GraduationCap,
  BookOpen,
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
  Star,
  MessageSquare
} from 'lucide-react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import ConfirmationToast from '../../../../../components/ui/ConfirmationToast';

function EndorseToSSC() {
  const { showSuccess, showError } = useToastContext();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    level: 'all',
    school: 'all',
    endorsementStatus: 'all'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [showConfirmationToast, setShowConfirmationToast] = useState(false);
  const [showBulkEndorseModal, setShowBulkEndorseModal] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all required data
      const [interviewSchedules, readyApplications, endorsedApplications, evaluationsResponse] = await Promise.all([
        scholarshipApiService.getInterviewSchedules().catch(() => []),
        scholarshipApiService.getApplications({ status: 'interview_completed' }).catch(() => ({ data: [] })),
        scholarshipApiService.getApplications({ status: 'endorsed_to_ssc' }).catch(() => ({ data: [] })),
        scholarshipApiService.getInterviewEvaluations().catch(() => [])
      ]);

      // Process interview evaluations
      let interviewEvaluations = evaluationsResponse || [];
      if (!Array.isArray(interviewEvaluations)) {
        console.error('Invalid interview evaluations response format');
        interviewEvaluations = [];
      }

      // Combine both ready and endorsed applications
      const allApplications = {
        data: [
          ...(readyApplications?.data || []),
          ...(endorsedApplications?.data || [])
        ]
      };

      // Filter for completed interviews
      const completedInterviews = (interviewSchedules || []).filter(schedule => 
        schedule.status === 'completed' && 
        schedule.application
      );

      // Get applications that are ready for SSC endorsement or already endorsed
      const processedApplications = (allApplications?.data || []).filter(app => {
        // Include applications that are already endorsed to SSC
        if (app.status === 'endorsed_to_ssc') {
          return true;
        }
        // Include applications that have completed interviews
        if (app.status === 'interview_completed') {
          const hasCompletedInterview = completedInterviews.some(interview => interview.application_id === app.id);
          const hasEvaluation = interviewEvaluations.some(evaluation => evaluation.application_id === app.id);
          return hasCompletedInterview && hasEvaluation;
        }
        return false;
      });

      // Combine interview data with application data
      console.log('Processed applications:', processedApplications.length);
      console.log('Interview evaluations found:', interviewEvaluations.length);
      
      const applicationsWithInterviews = processedApplications.map(app => {
        const interview = (completedInterviews || []).find(int => int.application_id === app.id);
        const evaluation = (interviewEvaluations || []).find(evaluation => evaluation.application_id === app.id);
        
        console.log(`Processing application ${app.id}:`, {
          status: app.status,
          hasInterview: !!interview,
          hasEvaluation: !!evaluation,
          evaluation: evaluation ? {
            id: evaluation.id,
            academic: evaluation.academic_motivation_score,
            leadership: evaluation.leadership_involvement_score,
            financial: evaluation.financial_need_score,
            character: evaluation.character_values_score
          } : null
        });
        const student = app.student;
        const school = app.school;
        const category = app.category;
        const subcategory = app.subcategory;

        // Use the actual evaluation from the database
        const finalEvaluation = evaluation;

        return {
          id: app.id,
          name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
          studentId: student?.student_id_number || `APP-${app.id}`,
          email: student?.email_address || '',
          phone: student?.contact_number || '',
          schoolName: school?.name || 'Unknown School',
          schoolType: school?.classification || 'Unknown',
          educationalLevel: app.student?.academic_records?.[0]?.educational_level || 'Tertiary',
          yearLevel: app.student?.academic_records?.[0]?.year_level || 'Unknown',
          course: app.student?.academic_records?.[0]?.program || 'Unknown Program',
          gwa: app.student?.academic_records?.[0]?.general_weighted_average?.toString() || 'N/A',
          scholarshipCategory: category?.name || 'Unknown Category',
          scholarshipSubCategory: subcategory?.name || 'Unknown Subcategory',
          requestedAmount: app.requested_amount || 0,
          approvedAmount: app.approved_amount || app.requested_amount || 0,
          endorsementStatus: app.status === 'endorsed_to_ssc' ? 'endorsed' : 
            (finalEvaluation?.overall_recommendation === 'needs_followup' ? 'conditional' : 
             (finalEvaluation?.overall_recommendation === 'recommended' ? 'ready' : 'pending')),
          interviewCompleted: true,
          verificationCompleted: true,
          documentsVerified: true,
          submittedDate: app.submitted_at || app.created_at,
          approvedDate: app.approved_at || app.reviewed_at,
          endorsedDate: app.status === 'endorsed_to_ssc' ? app.updated_at : null,
          documents: 8, // This would need to be fetched from documents API
          priority: 'normal', // This could be calculated based on GWA, category, etc.
          
          // Interview-specific data (only if interview exists)
          interview: interview ? {
            id: interview.id,
            date: interview.interview_date,
            time: interview.interview_time,
            interviewer: interview.interviewer_name,
            result: interview.interview_result,
            notes: interview.interview_notes,
            completedAt: interview.completed_at,
            evaluation: finalEvaluation ? {
              academicMotivationScore: finalEvaluation.academic_motivation_score || 0,
              leadershipInvolvementScore: finalEvaluation.leadership_involvement_score || 0,
              financialNeedScore: finalEvaluation.financial_need_score || 0,
              characterValuesScore: finalEvaluation.character_values_score || 0,
              overallRecommendation: finalEvaluation.overall_recommendation || 'not_recommended',
              remarks: finalEvaluation.remarks || '',
              strengths: finalEvaluation.strengths || '',
              areasForImprovement: finalEvaluation.areas_for_improvement || '',
              additionalNotes: finalEvaluation.additional_notes || ''
            } : null
          } : null
        };
      });

      setApplications(applicationsWithInterviews);
    } catch (e) {
      console.error('Error fetching applications for SSC endorsement:', e);
      setError('Failed to load applications ready for SSC endorsement');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getEndorsementStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'conditional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'endorsed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getEndorsementStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'conditional':
        return <AlertTriangle className="w-4 h-4" />;
      case 'endorsed':
        return <Award className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.scholarshipCategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || app.endorsementStatus === filters.status;
    const matchesCategory = filters.category === 'all' || app.scholarshipCategory === filters.category;
    const matchesLevel = filters.level === 'all' || app.educationalLevel === filters.level;
    const matchesSchool = filters.school === 'all' || app.schoolType === filters.school;
    
    // Handle endorsement status filtering including conditional recommendations
    let matchesEndorsement = true;
    if (filters.endorsementStatus !== 'all') {
      if (filters.endorsementStatus === 'conditional') {
        matchesEndorsement = app.interview?.evaluation?.overallRecommendation === 'needs_followup';
      } else {
        matchesEndorsement = app.endorsementStatus === filters.endorsementStatus;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesLevel && matchesSchool && matchesEndorsement;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'gwa':
        aValue = parseFloat(a.gwa);
        bValue = parseFloat(b.gwa);
        break;
      case 'amount':
        aValue = a.approvedAmount;
        bValue = b.approvedAmount;
        break;
      case 'date':
      default:
        aValue = new Date(a.approvedDate);
        bValue = new Date(b.approvedDate);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const ApplicationCard = ({ application }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group ${
      viewMode === 'list' ? 'rounded-lg' : 'rounded-xl'
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
                <Award className={`${viewMode === 'list' ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-orange-600 dark:text-orange-400`} />
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
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEndorsementStatusColor(application.endorsementStatus)}`}>
              {getEndorsementStatusIcon(application.endorsementStatus)}
              <span className="ml-1 capitalize">
                {application.endorsementStatus === 'conditional' ? 'For Consideration' : 
                 application.endorsementStatus === 'ready' ? 'Ready for SSC Endorsement' :
                 application.endorsementStatus}
              </span>
            </span>
            {application.priority !== 'normal' && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
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
            <span className="truncate">{application.schoolName}</span>
          </div>

          {/* Academic Info */}
          <div className={`grid gap-2 sm:gap-3 ${
            viewMode === 'list' 
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
              <DollarSign className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400 flex-shrink-0`} />
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white truncate">
                ₱{application.approvedAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Additional Info for List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Approved: {new Date(application.approvedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                <FileCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{application.documents} documents</span>
              </div>
            </div>
          )}

          {/* Interview Evaluation Details */}
          {application.interview && (
            <div className={`${viewMode === 'list' ? 'space-y-2' : 'space-y-3'}`}>
              {/* Interview Info */}
              <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 ${viewMode === 'list' ? 'p-2' : 'p-3'}`}>
                <div className={`flex items-center space-x-2 mb-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                  <MessageSquare className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600`} />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Interview Completed</span>
                  <span className="text-blue-700 dark:text-blue-300">•</span>
                  <span className="text-blue-700 dark:text-blue-300">{new Date(application.interview.date).toLocaleDateString()}</span>
                </div>
                
                {/* Evaluation Scores */}
                {application.interview.evaluation ? (
                  <div className={`grid ${viewMode === 'list' ? 'grid-cols-1 gap-1' : 'grid-cols-1 gap-2'} ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Academic:</span>
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => {
                          const score = application.interview.evaluation.academicMotivationScore || 0;
                          return (
                            <Star 
                              key={i} 
                              className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${
                                i < score
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          );
                        })}
                        <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                          {application.interview.evaluation.academicMotivationScore || 0}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Leadership:</span>
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => {
                          const score = application.interview.evaluation.leadershipInvolvementScore || 0;
                          return (
                            <Star 
                              key={i} 
                              className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${
                                i < score
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          );
                        })}
                        <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                          {application.interview.evaluation.leadershipInvolvementScore || 0}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Financial:</span>
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => {
                          const score = application.interview.evaluation.financialNeedScore || 0;
                          return (
                            <Star 
                              key={i} 
                              className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${
                                i < score
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          );
                        })}
                        <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                          {application.interview.evaluation.financialNeedScore || 0}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-blue-700 dark:text-blue-300 flex-shrink-0 w-20">Character:</span>
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => {
                          const score = application.interview.evaluation.characterValuesScore || 0;
                          return (
                            <Star 
                              key={i} 
                              className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-3'} ${
                                i < score
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          );
                        })}
                        <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium text-xs">
                          {application.interview.evaluation.characterValuesScore || 0}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Evaluation scores not available
                  </div>
                )}
                
                {/* Interviewer */}
                <div className={`mt-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'} text-blue-700 dark:text-blue-300`}>
                  Interviewer: <span className="font-medium">{application.interview.interviewer}</span>
                </div>
              </div>
              
              {/* Recommendation Status */}
              {application.interview.evaluation && (
                <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                  <span className="text-gray-600 dark:text-gray-400">Recommendation:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    application.interview.evaluation.overallRecommendation === 'recommended'
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
              )}
            </div>
          )}

          {/* Verification Status */}
          <div className={`flex items-center space-x-4 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center space-x-1">
              <CheckCircle className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
              <span className="text-gray-600 dark:text-gray-400">Interview</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
              <span className="text-gray-600 dark:text-gray-400">Verification</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'} text-green-500`} />
              <span className="text-gray-600 dark:text-gray-400">Documents</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`${viewMode === 'list' ? 'mt-3 pt-3' : 'mt-4 sm:mt-6 pt-3 sm:pt-4'} border-t border-gray-200 dark:border-slate-700`}>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => openEndorseModal(application)}
                className={`flex items-center justify-center space-x-2 ${viewMode === 'list' ? 'px-3 sm:px-4 py-2 text-sm font-semibold' : 'px-3 py-2 text-sm'} ${
                  application.endorsementStatus === 'conditional'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <Send className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span className="hidden sm:inline">
                  Endorse to SSC
                </span>
                <span className="sm:hidden">
                  Endorse
                </span>
              </button>
              <button
                onClick={() => openRejectModal(application)}
                className={`flex items-center justify-center space-x-2 ${viewMode === 'list' ? 'px-3 sm:px-4 py-2 text-sm font-semibold' : 'px-3 py-2 text-sm'} bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md flex-shrink-0`}
              >
                <XCircle className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-4 h-4'}`} />
                <span>
                  Reject
                </span>
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2 flex-shrink-0">
              <button 
                onClick={() => openViewModal(application)}
                className={`${viewMode === 'list' ? 'p-2' : 'p-2'} bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm hover:shadow-md`} 
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

  const openEndorseModal = (application) => {
    setActiveApplication(application);
    setIsEndorseModalOpen(true);
  };

  const openViewModal = (application) => {
    setActiveApplication(application);
    setIsViewModalOpen(true);
  };

  const openRejectModal = (application) => {
    setActiveApplication(application);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleEndorseToSSC = async () => {
    if (!activeApplication) return;
    
    try {
      // Use the dedicated endorseToSSC endpoint
      await scholarshipApiService.endorseToSSC(activeApplication.id, `Application endorsed to SSC on ${new Date().toISOString()}`);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === activeApplication.id 
          ? { ...app, endorsementStatus: 'endorsed', endorsedDate: new Date().toISOString() }
          : app
      ));
      
      setIsEndorseModalOpen(false);
      showSuccess('Application successfully endorsed to SSC!', 'Endorsement Successful');
    } catch (error) {
      console.error('Endorsement failed:', error);
      showError('Failed to endorse application. Please try again.', 'Endorsement Failed');
    }
  };

  const handleRejectApplication = async () => {
    if (!activeApplication || !rejectReason.trim()) {
      showError('Please provide a reason for rejection.', 'Rejection Reason Required');
      return;
    }
    
    try {
      // Use the existing rejectApplication endpoint
      await scholarshipApiService.rejectApplication(activeApplication.id, rejectReason.trim());
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === activeApplication.id 
          ? { ...app, endorsementStatus: 'rejected', rejectedDate: new Date().toISOString() }
          : app
      ));
      
      setIsRejectModalOpen(false);
      setRejectReason('');
      showSuccess('Application successfully rejected.', 'Rejection Successful');
    } catch (error) {
      console.error('Rejection failed:', error);
      showError('Failed to reject application. Please try again.', 'Rejection Failed');
    }
  };

  const handleBulkEndorseToSSC = () => {
    setShowBulkEndorseModal(true);
  };

  const handleEndorseSelected = () => {
    if (selectedApplications.length === 0) return;
    setShowConfirmationToast(true);
  };

  const handleBulkEndorseReady = async () => {
    try {
      // Filter applications that are ready (recommended/passed)
      const readyApplications = sortedApplications.filter(app => 
        selectedApplications.includes(app.id) && 
        app.interview?.evaluation?.overallRecommendation === 'recommended'
      );

      if (readyApplications.length === 0) {
        showError('No applications with "recommended" status found in your selection.', 'No Ready Applications');
        setShowBulkEndorseModal(false);
        return;
      }

      const readyIds = readyApplications.map(app => app.id);
      const notes = `Bulk endorsed ready applications to SSC on ${new Date().toISOString()}`;
      
      // Use the bulk endorse endpoint for ready applications
      const result = await scholarshipApiService.bulkEndorseToSSC(
        readyIds, 
        'all', 
        notes
      );
      
      // Update local state for endorsed applications
      setApplications(prev => prev.map(app => {
        if (readyIds.includes(app.id) && result.endorsed_count > 0) {
          return { ...app, endorsementStatus: 'endorsed', endorsedDate: new Date().toISOString() };
        }
        return app;
      }));
      
      // Clear selections
      setSelectedApplications([]);
      setShowBulkEndorseModal(false);
      
      // Show success message with details
      showSuccess(
        `Successfully endorsed ${result.endorsed_count} ready application(s) to SSC!`, 
        'Bulk Endorsement Successful'
      );
      
      // Refresh applications to get updated data
      fetchApplications();
      
    } catch (error) {
      console.error('Bulk endorsement failed:', error);
      setShowBulkEndorseModal(false);
      showError('Failed to bulk endorse ready applications. Please try again.', 'Bulk Endorsement Failed');
    }
  };

  const handleBulkEndorseConsideration = async () => {
    try {
      // Filter applications that need follow-up (conditional)
      const considerationApplications = sortedApplications.filter(app => 
        selectedApplications.includes(app.id) && 
        app.interview?.evaluation?.overallRecommendation === 'needs_followup'
      );

      if (considerationApplications.length === 0) {
        showError('No applications with "needs_followup" status found in your selection.', 'No Applications for Consideration');
        setShowBulkEndorseModal(false);
        return;
      }

      const considerationIds = considerationApplications.map(app => app.id);
      const notes = `Bulk endorsed consideration applications to SSC on ${new Date().toISOString()}`;
      
      // Use the bulk endorse endpoint for consideration applications
      const result = await scholarshipApiService.bulkEndorseToSSC(
        considerationIds, 
        'all', 
        notes
      );
      
      // Update local state for endorsed applications
      setApplications(prev => prev.map(app => {
        if (considerationIds.includes(app.id) && result.endorsed_count > 0) {
          return { ...app, endorsementStatus: 'endorsed', endorsedDate: new Date().toISOString() };
        }
        return app;
      }));
      
      // Clear selections
      setSelectedApplications([]);
      setShowBulkEndorseModal(false);
      
      // Show success message with details
      showSuccess(
        `Successfully endorsed ${result.endorsed_count} application(s) for consideration to SSC!`, 
        'Bulk Endorsement Successful'
      );
      
      // Refresh applications to get updated data
      fetchApplications();
      
    } catch (error) {
      console.error('Bulk endorsement failed:', error);
      setShowBulkEndorseModal(false);
      showError('Failed to bulk endorse applications for consideration. Please try again.', 'Bulk Endorsement Failed');
    }
  };

  const confirmBulkEndorse = async () => {
    try {
      const notes = `Bulk endorsed to SSC on ${new Date().toISOString()}`;
      
      // Use the bulk endorse endpoint with 'all' filter to endorse all selected applications
      const result = await scholarshipApiService.bulkEndorseToSSC(
        selectedApplications, 
        'all', // Endorse all selected applications
        notes
      );
      
      // Update local state for endorsed applications
      setApplications(prev => prev.map(app => {
        if (selectedApplications.includes(app.id) && result.endorsed_count > 0) {
          return { ...app, endorsementStatus: 'endorsed', endorsedDate: new Date().toISOString() };
        }
        return app;
      }));
      
      // Clear selections
      setSelectedApplications([]);
      setShowConfirmationToast(false);
      
      // Show success message with details
      showSuccess(
        `Successfully endorsed ${result.endorsed_count} out of ${result.total_processed} selected applications to SSC!`, 
        'Bulk Endorsement Successful'
      );
      
      // Refresh applications to get updated data
      fetchApplications();
      
    } catch (error) {
      console.error('Bulk endorsement failed:', error);
      setShowConfirmationToast(false);
      showError('Failed to bulk endorse applications. Please try again.', 'Bulk Endorsement Failed');
    }
  };

  const cancelBulkEndorse = () => {
    setShowConfirmationToast(false);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      level: 'all',
      school: 'all',
      endorsementStatus: 'all'
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== 'all') || searchTerm;
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Endorse to SSC
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Forward applications with completed interviews to Scholarship Selection Committee
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button 
            onClick={handleBulkEndorseToSSC}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Bulk Endorse</span>
            <span className="sm:hidden">Bulk Endorse</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search and Basic Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 w-full sm:min-w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <select
              value={filters.endorsementStatus}
              onChange={(e) => updateFilter('endorsementStatus', e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready for SSC Endorsement</option>
              <option value="conditional">Needs Review (Conditional)</option>
              <option value="endorsed">Already Endorsed to SSC</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm sm:text-base ${
                showAdvancedFilters 
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
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => updateFilter('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="Senior High School">Senior High School</option>
                  <option value="Tertiary">Tertiary</option>
                  <option value="Graduate">Graduate</option>
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
            {filters.endorsementStatus !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Status: {filters.endorsementStatus}
                <button onClick={() => updateFilter('endorsementStatus', 'all')} className="ml-1 hover:text-orange-600 dark:hover:text-orange-200">
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
        {selectedApplications.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {selectedApplications.length} application(s) selected
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={handleEndorseSelected}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Endorse Selected
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : sortedApplications.length === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 sm:p-12 text-center">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'space-y-3'}>
          {sortedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Endorse Modal */}
      {isEndorseModalOpen && activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEndorseModalOpen(false)} />
          <div className="relative z-10 w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col my-4 sm:my-8">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {activeApplication.endorsementStatus === 'conditional'
                  ? 'Suggest to SSC'
                  : 'Endorse to SSC'
                }
              </h3>
              <button 
                onClick={() => setIsEndorseModalOpen(false)} 
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ minHeight: 0 }}>
              <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Student:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">{activeApplication.name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Student ID:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">{activeApplication.studentId}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">School:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">{activeApplication.schoolName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                    <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">₱{activeApplication.approvedAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Verification Status</h4>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">Interview Completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">Verification Completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">Documents Verified</span>
                  </div>
                </div>
              </div>

              {/* Interview Details */}
              {activeApplication.interview && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Interview Evaluation</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
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
                  <div className="space-y-2">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100">Evaluation Scores:</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 dark:text-blue-300">Academic Motivation:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${
                                i < (activeApplication.interview.evaluation?.academicMotivationScore || 0)
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
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
                              className={`w-3 h-3 ${
                                i < (activeApplication.interview.evaluation?.leadershipInvolvementScore || 0)
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
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
                              className={`w-3 h-3 ${
                                i < (activeApplication.interview.evaluation?.financialNeedScore || 0)
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
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
                              className={`w-3 h-3 ${
                                i < (activeApplication.interview.evaluation?.characterValuesScore || 0)
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="ml-1 text-blue-900 dark:text-blue-100 font-medium">
                            {activeApplication.interview.evaluation?.characterValuesScore || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>
                      
                    {/* Overall Recommendation */}
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">Overall Recommendation:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          activeApplication.interview.evaluation?.overallRecommendation === 'recommended'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {activeApplication.interview.evaluation?.overallRecommendation === 'recommended' && '✅ Recommended for SSC Review'}
                          {activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup' && '⚠️ For Consideration'}
                          {activeApplication.interview.evaluation?.overallRecommendation === 'not_recommended' && '❌ Not Recommended'}
                        </span>
                      </div>
                    </div>

                    {/* Interview Notes */}
                    {(activeApplication.interview.notes || activeApplication.interview.evaluation?.remarks) && (
                      <div className="mt-3">
                        <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Interview Notes:</h6>
                        <p className="text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                          {activeApplication.interview.evaluation?.remarks || activeApplication.interview.notes || 'No notes available'}
                        </p>
                      </div>
                    )}

                    {/* Additional Evaluation Details */}
                    {(activeApplication.interview.evaluation?.strengths || activeApplication.interview.evaluation?.areasForImprovement) && (
                      <div className="mt-3 space-y-2">
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
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {activeApplication.endorsementStatus === 'conditional'
                  ? 'This application has completed the interview and is marked "For Consideration". The SSC should review the interview evaluation and make a final decision.'
                  : 'This application has completed all required verification steps and is ready for SSC review. Click "Endorse to SSC" to forward this application to the Scholarship Selection Committee.'
                }
              </p>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
              <button
                onClick={() => setIsEndorseModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEndorseToSSC}
                className={`px-4 py-2 ${
                  activeApplication.endorsementStatus === 'conditional'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white rounded-lg transition-colors flex items-center`}
              >
                <Send className="w-4 h-4 mr-2" />
                Endorse to SSC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && activeApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col my-4 sm:my-8">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
              <div className="space-y-6">
                {/* Application Details */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Application Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Student:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                        {activeApplication.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Student ID:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                        {activeApplication.studentId}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">School:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                        {activeApplication.schoolName}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                      <span className="ml-2 text-blue-900 dark:text-blue-100 font-medium">
                        ₱{activeApplication.approvedAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Verification Status</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 dark:text-green-200">Interview Completed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 dark:text-green-200">Verification Completed</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 dark:text-green-200">Documents Verified</span>
                    </div>
                  </div>
                </div>

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
                      <span className="text-gray-700 dark:text-gray-300">School Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.schoolType || 'N/A'}
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
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Approved Amount:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium">
                        ₱{activeApplication.approvedAmount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Application Status:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium capitalize">
                        {activeApplication.status || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Endorsement Status:</span>
                      <span className="ml-2 text-purple-900 dark:text-purple-100 font-medium capitalize">
                        {activeApplication.endorsementStatus || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interview Evaluation */}
                {activeApplication.interview && (
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
                                className={`w-3 h-3 ${
                                  i < (activeApplication.interview.evaluation?.academicMotivationScore || 0)
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
                                className={`w-3 h-3 ${
                                  i < (activeApplication.interview.evaluation?.leadershipInvolvementScore || 0)
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
                                className={`w-3 h-3 ${
                                  i < (activeApplication.interview.evaluation?.financialNeedScore || 0)
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
                                className={`w-3 h-3 ${
                                  i < (activeApplication.interview.evaluation?.characterValuesScore || 0)
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
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        activeApplication.interview.evaluation?.overallRecommendation === 'recommended'
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
                        {activeApplication.interview.evaluation?.overallRecommendation === 'recommended' && 'Recommended for SSC Review'}
                        {activeApplication.interview.evaluation?.overallRecommendation === 'needs_followup' && 'For Consideration'}
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

                {/* Additional Information */}
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Application Date:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(activeApplication.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Last Updated:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(activeApplication.updatedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Application ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Notes:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {activeApplication.notes || 'No additional notes'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
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
                  openEndorseModal(activeApplication);
                }}
                className={`px-4 py-2 ${
                  activeApplication.endorsementStatus === 'conditional'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                } text-white rounded-lg transition-colors flex items-center`}
              >
                <Send className="w-4 h-4 mr-2" />
                Endorse to SSC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Endorse Modal */}
      {showBulkEndorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBulkEndorseModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl my-4 sm:my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk Endorse to SSC
              </h3>
              <button 
                onClick={() => setShowBulkEndorseModal(false)} 
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have {selectedApplications.length} application(s) selected. Choose how you want to endorse them:
              </p>
              
              <div className="space-y-4">
                {/* Ready Applications Option */}
                <button
                  onClick={handleBulkEndorseReady}
                  className="w-full p-4 text-left bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        Endorse All Ready Applications
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Endorse applications with "recommended" status (passed interviews)
                      </p>
                    </div>
                  </div>
                </button>

                {/* Consideration Applications Option */}
                <button
                  onClick={handleBulkEndorseConsideration}
                  className="w-full p-4 text-left bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Endorse All for Consideration
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Endorse applications with "needs_followup" status (for consideration)
                      </p>
                    </div>
                  </div>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowBulkEndorseModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsRejectModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl my-4 sm:my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
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
            
            {/* Modal Content */}
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

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectApplication}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      <ConfirmationToast
        isVisible={showConfirmationToast}
        title="Confirm Bulk Endorsement"
        message={`Are you sure you want to endorse ${selectedApplications.length} selected application(s) to SSC?\n\nThis action will change the status of all selected applications to "Endorsed to SSC".`}
        confirmText="Endorse to SSC"
        cancelText="Cancel"
        type="warning"
        onConfirm={confirmBulkEndorse}
        onCancel={cancelBulkEndorse}
      />

    </div>
  );
}

export default EndorseToSSC;
