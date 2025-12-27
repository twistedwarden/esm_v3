import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../hooks/useToast';
import { CheckCircle, XCircle, GraduationCap, User, Clock, FileText, Link as LinkIcon } from 'lucide-react';

function AcademicReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    academic_standing_verified: false,
    program_eligibility: false,
    school_accreditation: false,
    academic_assessment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      const response = await scholarshipApiService.getSscApplicationsByStage('academic_review');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load applications';
      const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
      showError(`Failed to load applications: ${errorMessage}${debugInfo}`);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
    // Reset form
    setReviewForm({
      academic_standing_verified: false,
      program_eligibility: false,
      school_accreditation: false,
      academic_assessment: ''
    });
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    if (!reviewForm.academic_standing_verified || !reviewForm.program_eligibility || !reviewForm.school_accreditation) {
      showError('Please complete all verification checks');
      return;
    }


    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      await scholarshipApiService.sscSubmitAcademicReview(selectedApplication.id, {
        approved: true,
        notes: reviewForm.academic_assessment
      });

      showSuccess('Application approved and moved to final approval');
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to approve application';
      const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
      showError(`Failed to approve application: ${errorMessage}${debugInfo}`);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    if (!reviewForm.academic_assessment) {
      showError('Please provide rejection reason');
      return;
    }

    if (confirm('Are you sure you want to reject this application based on academic criteria?')) {
      try {
        const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
        await scholarshipApiService.sscSubmitAcademicReview(selectedApplication.id, {
          approved: false,
          notes: reviewForm.academic_assessment
        });

        showSuccess('Application rejected due to academic criteria');
        setShowReviewModal(false);
        fetchApplications();
      } catch (error) {
        console.error('Error rejecting application:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to reject application';
        const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
        showError(`Failed to reject application: ${errorMessage}${debugInfo}`);
      }
    }
  };


  const getSscStageStatus = (application) => {
    const stageStatus = application.ssc_stage_status || {};
    
    return {
      document_verification: {
        label: 'Document Verification',
        completed: stageStatus.document_verification?.status === 'approved',
        reviewedAt: stageStatus.document_verification?.reviewed_at
      },
      financial_review: {
        label: 'Financial Review',
        completed: stageStatus.financial_review?.status === 'approved',
        reviewedAt: stageStatus.financial_review?.reviewed_at
      },
      academic_review: {
        label: 'Academic Review',
        completed: stageStatus.academic_review?.status === 'approved',
        reviewedAt: stageStatus.academic_review?.reviewed_at
      },
      final_approval: {
        label: 'Final Approval',
        completed: application.status === 'approved' || application.status === 'rejected',
        reviewedAt: application.latest_ssc_decision?.created_at
      }
    };
  };

  const getAcademicDocuments = (application) => {
    if (!application.documents) return [];
    
    // Filter for academic-related documents
    const academicKeywords = ['transcript', 'grade', 'gpa', 'academic', 'record', 'certificate', 'diploma', 'degree'];
    
    return application.documents.filter(doc => {
      const docName = (doc?.documentType?.name || doc?.document_type?.name || doc?.original_name || doc?.filename || '').toLowerCase();
      return academicKeywords.some(keyword => docName.includes(keyword));
    });
  };

  const getDocumentUrl = (doc) => {
    return doc?.file_url || doc?.url || doc?.download_url || doc?.view_url || doc?.file_path || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Review</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Assess academic eligibility and merit
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {applications.length} application{applications.length !== 1 ? 's' : ''} pending academic review
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">No applications pending academic review</p>
          </div>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {application.student ? `${application.student.first_name} ${application.student.last_name}` : 'Unknown Applicant'}
                    </h3>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">School:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.school?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Program:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.student?.current_academic_record?.program || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">GWA:</span>
                      <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                        {application.student?.current_academic_record?.general_weighted_average || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openReviewModal(application)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Review Academics
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Academic Review - {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown Applicant'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* SSC Stage Status - Parallel Workflow */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white">SSC Review Stages (Parallel Process)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All stages can be reviewed simultaneously. Checkmarks indicate completed stages.
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(getSscStageStatus(selectedApplication)).map(([stageKey, stage]) => (
                    <div key={stageKey} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex items-center space-x-3">
                        {stage.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <span className={`font-medium ${stage.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {stage.label}
                          </span>
                          {stage.completed && stage.reviewedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Completed on {new Date(stage.reviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {stage.completed && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                          ✓ Approved
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Documents */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" /> Academic Documents
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getAcademicDocuments(selectedApplication).length} file{getAcademicDocuments(selectedApplication).length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {getAcademicDocuments(selectedApplication).length === 0 ? (
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">No academic documents uploaded.</div>
                  ) : (
                    getAcademicDocuments(selectedApplication).map((doc, idx) => {
                      const label = doc?.documentType?.name || doc?.document_type?.name || doc?.original_name || doc?.filename || `Document ${idx + 1}`;
                      const url = getDocumentUrl(doc);
                      return (
                        <div key={doc.id || idx} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium">{label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {doc?.uploaded_at || doc?.created_at ? new Date(doc.uploaded_at || doc.created_at).toLocaleString() : 'Upload date unavailable'}
                            </p>
                          </div>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                              <LinkIcon className="h-4 w-4 mr-2" /> View
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">No file link</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>


              {/* Academic Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">General Weighted Average:</span>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {selectedApplication.student?.current_academic_record?.general_weighted_average || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Year Level:</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedApplication.student?.current_academic_record?.year_level || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Course/Program:</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedApplication.student?.current_academic_record?.program || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">School:</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedApplication.school?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Criteria Checklist */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Verification</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.academic_standing_verified}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, academic_standing_verified: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">GWA/Academic standing meets scholarship requirements</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.program_eligibility}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, program_eligibility: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Course/Program is eligible for this scholarship category</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.school_accreditation}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, school_accreditation: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">School is accredited and recognized</span>
                  </label>
                </div>
              </div>

              {/* Academic Assessment */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Academic Assessment
                </label>
                <textarea
                  value={reviewForm.academic_assessment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, academic_assessment: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Provide academic merit assessment, program alignment, potential for success..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Rejecting...' : 'Reject'}</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Approving...' : 'Approve Stage'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcademicReview;

