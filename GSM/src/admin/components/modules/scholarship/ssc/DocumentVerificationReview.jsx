import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../hooks/useToast';
import { CheckCircle, XCircle, AlertCircle, FileText, User, Upload, Link as LinkIcon, Clock } from 'lucide-react';

function DocumentVerificationReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    valid_id_verified: false,
    indigency_cert_verified: false,
    residency_proof_verified: false,
    academic_records_verified: false,
    other_docs_verified: false,
    verification_notes: '',
    compliance_issues: []
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      const response = await scholarshipApiService.getSscApplicationsByStage('document_verification');
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
    // Reset form
    setReviewForm({
      valid_id_verified: false,
      indigency_cert_verified: false,
      residency_proof_verified: false,
      academic_records_verified: false,
      other_docs_verified: false,
      verification_notes: '',
      compliance_issues: []
    });
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    // Validate all documents are checked
    const allDocsVerified = Object.keys(reviewForm)
      .filter(key => key.endsWith('_verified'))
      .every(key => reviewForm[key]);

    if (!allDocsVerified) {
      showError('Please verify all required documents');
      return;
    }

    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      await scholarshipApiService.sscSubmitDocumentVerification(selectedApplication.id, {
        verified: true,
        notes: reviewForm.verification_notes,
        document_issues: reviewForm.compliance_issues
      });

      showSuccess('Document verification approved successfully');
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to approve application';
      const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
      showError(`Failed to approve document verification: ${errorMessage}${debugInfo}`);
    }
  };

  const handleRequestCompliance = async () => {
    if (!selectedApplication) return;

    if (reviewForm.compliance_issues.length === 0) {
      showError('Please specify compliance issues');
      return;
    }

    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      await scholarshipApiService.sscSubmitDocumentVerification(selectedApplication.id, {
        verified: false,
        notes: reviewForm.verification_notes,
        document_issues: reviewForm.compliance_issues
      });

      showSuccess('Document verification marked as needing revision');
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error requesting compliance:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to request compliance';
      const debugInfo = error.response?.data?.debug ? ` (Debug: ${JSON.stringify(error.response.data.debug)})` : '';
      showError(`Failed to mark document verification for revision: ${errorMessage}${debugInfo}`);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    if (!reviewForm.verification_notes) {
      showError('Please provide rejection reason');
      return;
    }

    if (confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
      try {
        const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
        await scholarshipApiService.sscSubmitDocumentVerification(selectedApplication.id, {
          verified: false,
          notes: reviewForm.verification_notes,
          document_issues: ['Application rejected']
        });

        showSuccess('Application rejected');
        setShowReviewModal(false);
        fetchApplications();
      } catch (error) {
        console.error('Error rejecting application:', error);
        showError('Failed to reject application');
      }
    }
  };

  const toggleComplianceIssue = (issue) => {
    setReviewForm(prev => ({
      ...prev,
      compliance_issues: prev.compliance_issues.includes(issue)
        ? prev.compliance_issues.filter(i => i !== issue)
        : [...prev.compliance_issues, issue]
    }));
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Verification</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and verify applicant documents
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {applications.length} application{applications.length !== 1 ? 's' : ''} pending verification
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">No applications pending document verification</p>
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
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Application ID:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{application.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">School:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.school?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {application.category?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(application.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openReviewModal(application)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Review Documents
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
                Document Verification - {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown Applicant'}
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

              {/* Uploaded Documents */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" /> Uploaded Documents
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedApplication.documents?.length || 0)} file{(selectedApplication.documents?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {(!selectedApplication.documents || selectedApplication.documents.length === 0) ? (
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">No documents uploaded.</div>
                  ) : (
                    selectedApplication.documents.map((doc, idx) => {
                      const label = doc?.documentType?.name || doc?.document_type?.name || doc?.original_name || doc?.filename || `Document ${idx + 1}`;
                      const url = doc?.file_url || doc?.url || doc?.download_url || doc?.view_url || doc?.file_path || '';
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
              {/* Document Checklist */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Required Documents</h4>
                <div className="space-y-3">
                  {[
                    { key: 'valid_id_verified', label: 'Valid ID' },
                    { key: 'indigency_cert_verified', label: 'Certificate of Indigency' },
                    { key: 'residency_proof_verified', label: 'Proof of Residency' },
                    { key: 'academic_records_verified', label: 'Academic Records' },
                    { key: 'other_docs_verified', label: 'Other Required Documents' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reviewForm[key]}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compliance Issues */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Compliance Issues (if any)</h4>
                <div className="space-y-2">
                  {['Missing ID', 'Incomplete Documents', 'Invalid Residency Proof', 'Expired Documents'].map(issue => (
                    <label key={issue} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reviewForm.compliance_issues.includes(issue)}
                        onChange={() => toggleComplianceIssue(issue)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={reviewForm.verification_notes}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, verification_notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Add any additional notes or observations..."
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
                onClick={handleRequestCompliance}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Request Compliance</span>
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve & Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentVerificationReview;

