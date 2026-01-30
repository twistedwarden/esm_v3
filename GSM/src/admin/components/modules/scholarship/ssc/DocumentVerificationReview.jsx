import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import { CheckCircle, XCircle, AlertCircle, FileText, User, Upload, Link as LinkIcon, Clock } from 'lucide-react';

function DocumentVerificationReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    valid_id_verified: false,
    birth_cert_verified: false,
    barangay_cert_verified: false,
    income_cert_verified: false,
    coe_verified: false,
    good_moral_verified: false,
    academic_records_verified: false,
    verification_notes: '',
    compliance_issues: []
  });
  const { success: showSuccess, error: showError } = useToastContext();

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
      birth_cert_verified: false,
      barangay_cert_verified: false,
      income_cert_verified: false,
      coe_verified: false,
      good_moral_verified: false,
      academic_records_verified: false,
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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCompliance = async () => {
    if (!selectedApplication) return;

    if (reviewForm.compliance_issues.length === 0) {
      showError('Please specify compliance issues');
      return;
    }

    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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
        setSubmitting(true);
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
      } finally {
        setSubmitting(false);
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
      {showReviewModal && selectedApplication && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Document Verification - {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown Applicant'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Application Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Student Name:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Student ID:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.student?.student_id_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Email:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.student?.email_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Contact:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.student?.contact_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">School:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.school?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Category:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {selectedApplication.category?.name || 'N/A'}
                      {selectedApplication.subcategory && ` - ${selectedApplication.subcategory.name}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Requested Amount:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      ₱{selectedApplication.requested_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Status:</span>
                    <p className="text-blue-900 dark:text-blue-100 font-medium capitalize">
                      {selectedApplication.status || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interview Evaluation */}
              {selectedApplication.interview_schedule?.evaluation && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Interview Evaluation</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Interview Date:</span>
                      <p className="text-purple-900 dark:text-purple-100 font-medium">
                        {selectedApplication.interview_schedule.interview_date
                          ? new Date(selectedApplication.interview_schedule.interview_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-purple-700 dark:text-purple-300">Interviewer:</span>
                      <p className="text-purple-900 dark:text-purple-100 font-medium">
                        {selectedApplication.interview_schedule.interviewer_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h5 className="font-medium text-purple-900 dark:text-purple-100 text-sm">Evaluation Scores:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 dark:text-purple-300 text-sm">Academic Motivation:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < (selectedApplication.interview_schedule.evaluation.academic_motivation_score || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-purple-900 dark:text-purple-100 font-medium text-sm">
                            {selectedApplication.interview_schedule.evaluation.academic_motivation_score || 0}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 dark:text-purple-300 text-sm">Leadership:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < (selectedApplication.interview_schedule.evaluation.leadership_involvement_score || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-purple-900 dark:text-purple-100 font-medium text-sm">
                            {selectedApplication.interview_schedule.evaluation.leadership_involvement_score || 0}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 dark:text-purple-300 text-sm">Financial Need:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < (selectedApplication.interview_schedule.evaluation.financial_need_score || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-purple-900 dark:text-purple-100 font-medium text-sm">
                            {selectedApplication.interview_schedule.evaluation.financial_need_score || 0}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 dark:text-purple-300 text-sm">Character & Values:</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < (selectedApplication.interview_schedule.evaluation.character_values_score || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-purple-900 dark:text-purple-100 font-medium text-sm">
                            {selectedApplication.interview_schedule.evaluation.character_values_score || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300 font-medium">Overall Recommendation:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedApplication.interview_schedule.evaluation.overall_recommendation === 'recommended'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : selectedApplication.interview_schedule.evaluation.overall_recommendation === 'needs_followup'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {selectedApplication.interview_schedule.evaluation.overall_recommendation === 'recommended' && '✅ Recommended'}
                        {selectedApplication.interview_schedule.evaluation.overall_recommendation === 'needs_followup' && '⚠️ For Consideration'}
                        {selectedApplication.interview_schedule.evaluation.overall_recommendation === 'not_recommended' && '❌ Not Recommended'}
                      </span>
                    </div>
                    {selectedApplication.interview_schedule.evaluation.remarks && (
                      <div className="mt-3">
                        <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Remarks:</span>
                        <p className="text-purple-900 dark:text-purple-100 text-sm mt-1 bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                          {selectedApplication.interview_schedule.evaluation.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Documents and Checklist - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Uploaded Documents - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" /> Uploaded Documents
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {(() => {
                          // Combine application documents and student documents
                          const appDocs = selectedApplication.documents || [];
                          const studentDocs = selectedApplication.student?.documents || [];
                          const allDocs = [...appDocs];
                          studentDocs.forEach(sDoc => {
                            if (!allDocs.some(aDoc => aDoc.id === sDoc.id)) {
                              allDocs.push(sDoc);
                            }
                          });
                          return `${allDocs.length} file${allDocs.length !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                      {(() => {
                        // Combine application documents and student documents
                        const appDocs = selectedApplication.documents || [];
                        const studentDocs = selectedApplication.student?.documents || [];

                        // Merge and deduplicate by ID
                        const allDocs = [...appDocs];
                        studentDocs.forEach(sDoc => {
                          if (!allDocs.some(aDoc => aDoc.id === sDoc.id)) {
                            allDocs.push(sDoc);
                          }
                        });

                        if (allDocs.length === 0) {
                          return <div className="p-4 text-sm text-gray-600 dark:text-gray-400">No documents uploaded.</div>;
                        }

                        return allDocs.map((doc, idx) => {
                          const label = doc?.documentType?.name || doc?.document_type?.name || doc?.original_name || doc?.filename || `Document ${idx + 1}`;
                          let url = doc?.file_url || doc?.url || doc?.download_url || doc?.view_url || doc?.file_path || '';

                          if (url && !url.startsWith('http')) {
                            const baseUrl = import.meta.env.VITE_SCHOLARSHIP_SERVICE_URL || 'http://localhost:8001';
                            const cleanPath = url.startsWith('/') ? url.substring(1) : url;
                            if (cleanPath.startsWith('documents/') || !cleanPath.includes('/')) {
                              if (!cleanPath.startsWith('storage/')) {
                                url = `/storage/${cleanPath}`;
                              } else {
                                url = `/${cleanPath}`;
                              }
                            } else {
                              url = `/${cleanPath}`;
                            }
                            url = `${baseUrl}${url}`;
                          }

                          return (
                            <div key={doc.id || idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="flex-1">
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
                                  className="inline-flex items-center px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                >
                                  <LinkIcon className="h-4 w-4 mr-2" /> View
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No file link</span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Document Checklist - Takes 1 column */}
                <div className="lg:col-span-1">
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 sticky top-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Required Documents</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'valid_id_verified', label: 'Valid ID' },
                        { key: 'birth_cert_verified', label: 'Birth Certificate' },
                        { key: 'barangay_cert_verified', label: 'Barangay Certificate' },
                        { key: 'income_cert_verified', label: 'Income Certificate' },
                        { key: 'coe_verified', label: 'Certificate of Enrollment' },
                        { key: 'good_moral_verified', label: 'Certificate of Good Moral' },
                        { key: 'academic_records_verified', label: 'Academic Records (TOR/Grades)' }
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
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{submitting ? 'Processing...' : 'Reject'}</span>
              </button>
              <button
                onClick={handleRequestCompliance}
                disabled={submitting}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{submitting ? 'Processing...' : 'Request Compliance'}</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>{submitting ? 'Processing...' : 'Approve & Continue'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DocumentVerificationReview;

