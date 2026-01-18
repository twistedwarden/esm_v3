import React, { useState, useEffect } from 'react';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import { CheckCircle, XCircle, PhilippinePeso, TrendingUp, User, ChevronDown, ChevronUp, FileText, Link as LinkIcon, Clock } from 'lucide-react';

function FinancialReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    income_verified: false,
    budget_available: false,
    recommended_amount: '',
    financial_assessment: ''
  });
  const { success: showSuccess, error: showError } = useToastContext();

  // Helper to safely extract an income-related documents list
  const getIncomeDocuments = (application) => {
    if (!application || !application.documents) return [];

    const docs = Array.isArray(application.documents) ? application.documents : [];
    return docs.filter((doc) => {
      const typeName = (
        doc?.documentType?.name ||
        doc?.document_type?.name ||
        doc?.type ||
        ''
      ).toString().toLowerCase();

      // Match common income-related document types
      return (
        typeName.includes('income') ||
        typeName.includes('payslip') ||
        typeName.includes('pay slip') ||
        typeName.includes('certificate of indigency') ||
        typeName.includes('financial')
      );
    });
  };

  // Helper to resolve a document URL
  const getDocumentUrl = (doc) => {
    return (
      doc?.file_url ||
      doc?.url ||
      doc?.download_url ||
      doc?.view_url ||
      doc?.file_path ||
      ''
    );
  };

  // Helper to get SSC stage status for parallel workflow
  const getSscStageStatus = (application) => {
    const stageStatus = application.ssc_stage_status || {};

    return {
      document_verification: {
        label: 'Document Verification',
        completed: stageStatus.document_verification?.status === 'approved',
        reviewedBy: stageStatus.document_verification?.reviewed_by,
        reviewedAt: stageStatus.document_verification?.reviewed_at,
        notes: stageStatus.document_verification?.notes
      },
      financial_review: {
        label: 'Financial Review',
        completed: stageStatus.financial_review?.status === 'approved',
        reviewedBy: stageStatus.financial_review?.reviewed_by,
        reviewedAt: stageStatus.financial_review?.reviewed_at,
        notes: stageStatus.financial_review?.notes
      },
      academic_review: {
        label: 'Academic Review',
        completed: stageStatus.academic_review?.status === 'approved',
        reviewedBy: stageStatus.academic_review?.reviewed_by,
        reviewedAt: stageStatus.academic_review?.reviewed_at,
        notes: stageStatus.academic_review?.notes
      },
      final_approval: {
        label: 'Final Approval',
        completed: application.status === 'approved' || application.status === 'rejected',
        reviewedBy: application.approved_by || application.rejected_by,
        reviewedAt: application.approved_at || application.rejected_at,
        notes: application.notes
      }
    };
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      const response = await scholarshipApiService.getSscApplicationsByStage('financial_review');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = async (application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);

    // Pre-fill with requested amount
    setReviewForm({
      income_verified: false,
      budget_available: false,
      recommended_amount: application.requested_amount || '',
      financial_assessment: ''
    });
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    if (!reviewForm.income_verified || !reviewForm.budget_available) {
      showError('Please complete all verification checks');
      return;
    }

    if (!reviewForm.recommended_amount) {
      showError('Please specify the recommended scholarship amount');
      return;
    }

    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      await scholarshipApiService.approveStage(
        selectedApplication.id,
        'financial_review',
        reviewForm.financial_assessment,
        {
          ...reviewForm,
          recommended_amount: parseFloat(reviewForm.recommended_amount)
        }
      );

      showSuccess('Financial review approved successfully');
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving stage:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to approve financial review stage';
      const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
      showError(`Failed to approve financial review: ${errorMessage}${debugInfo}`);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    if (!reviewForm.financial_assessment) {
      showError('Please provide rejection reason');
      return;
    }

    if (confirm('Are you sure you want to reject this application due to financial constraints?')) {
      try {
        const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
        await scholarshipApiService.sscSubmitFinancialReview(selectedApplication.id, {
          status: 'rejected',
          review_data: reviewForm,
          review_notes: reviewForm.financial_assessment
        });

        showSuccess('Financial review rejected');
        setShowReviewModal(false);
        fetchApplications();
      } catch (error) {
        console.error('Error rejecting application:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to reject application';
        const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
        showError(`Failed to reject financial review: ${errorMessage}${debugInfo}`);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Review</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Assess financial eligibility and budget allocation
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {applications.length} application{applications.length !== 1 ? 's' : ''} pending financial review
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <PhilippinePeso className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">No applications pending financial review</p>
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
                      <span className="text-gray-500 dark:text-gray-400">Requested Amount:</span>
                      <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                        {formatCurrency(application.requested_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">School:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.school?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Family Income:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.student?.financial_information?.family_monthly_income_range
                          ? application.student.financial_information.family_monthly_income_range
                          : 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openReviewModal(application)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Review Finances
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
                Financial Review - {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown Applicant'}
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

              {/* Financial Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Financial Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Requested Amount:</span>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(selectedApplication.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Family Income:</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedApplication.student?.financial_information?.family_monthly_income_range
                        ? selectedApplication.student.financial_information.family_monthly_income_range
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Income Certificates */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="p-4 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Income Certificates
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {(getIncomeDocuments(selectedApplication).length || 0)} file{getIncomeDocuments(selectedApplication).length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700">
                  {getIncomeDocuments(selectedApplication).length === 0 ? (
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      No income-related documents uploaded.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                      {getIncomeDocuments(selectedApplication).map((doc, idx) => {
                        const url = getDocumentUrl(doc);
                        const label = doc?.documentType?.name || doc?.document_type?.name || doc?.original_name || doc?.filename || `Document ${idx + 1}`;
                        return (
                          <li key={doc.id || idx} className="p-4 flex items-center justify-between">
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
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Financial Assessment Checklist */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Financial Verification</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.income_verified}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, income_verified: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Family income verified and documented</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewForm.budget_available}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, budget_available: e.target.checked }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Budget allocation available for this scholarship</span>
                  </label>
                </div>
              </div>

              {/* Recommended Amount */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Recommended Scholarship Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    value={reviewForm.recommended_amount}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, recommended_amount: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Financial Assessment Notes */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Financial Assessment Notes
                </label>
                <textarea
                  value={reviewForm.financial_assessment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, financial_assessment: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Provide financial analysis, budget impact, sustainability assessment..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialReview;

