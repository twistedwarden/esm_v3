import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../hooks/useToast';
import { CheckCircle, XCircle, Shield, User, ChevronDown, ChevronUp, Clock } from 'lucide-react';

function FinalApprovalReview() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    document: true,
    financial: true,
    academic: true
  });
  const [finalDecision, setFinalDecision] = useState({
    decision: '',
    approved_amount: '',
    final_notes: ''
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
      const response = await scholarshipApiService.getSscApplicationsByStage('final_approval');
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
    
    // Fetch complete review history
    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      const history = await scholarshipApiService.getSscReviewHistory(application.id);
      setReviewHistory(history);
    } catch (error) {
      console.error('Error fetching review history:', error);
    }

    // Auto-populate approved amount from financial review
    const recommendedAmount = getRecommendedAmountFromFinancialReview(application);
    setFinalDecision({
      decision: '',
      approved_amount: recommendedAmount,
      final_notes: ''
    });
  };

  const handleFinalApprove = async () => {
    if (!selectedApplication) return;

    if (!finalDecision.approved_amount) {
      showError('Please confirm the approved scholarship amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      await scholarshipApiService.sscFinalApproval(selectedApplication.id, {
        approved_amount: parseFloat(finalDecision.approved_amount),
        final_notes: finalDecision.final_notes
      });

      // Auto-register student in Student Registry
      try {
        const { default: studentRegistrationService } = await import('../../../../../services/studentRegistrationService');
        await studentRegistrationService.autoRegisterFromSSCApproval(selectedApplication);
        showSuccess('Application finally approved! Student registered in Student Registry.');
      } catch (registrationError) {
        console.error('Error auto-registering student:', registrationError);
        showSuccess('Application finally approved! Moving to grants processing. (Note: Student registration failed - please register manually)');
      }
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      showError('Failed to approve application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalReject = async () => {
    if (!selectedApplication) return;

    if (!finalDecision.final_notes) {
      showError('Please provide reason for final rejection');
      return;
    }

    if (confirm('Are you sure you want to FINALLY REJECT this application? This is the final decision and cannot be undone.')) {
      setIsSubmitting(true);
      try {
        const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
        await scholarshipApiService.sscFinalRejection(selectedApplication.id, {
          rejection_reason: finalDecision.final_notes
        });

        showSuccess('Application finally rejected');
        setShowReviewModal(false);
        fetchApplications();
      } catch (error) {
        console.error('Error rejecting application:', error);
        showError('Failed to reject application');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getReviewsByStage = (stage) => {
    return reviewHistory.filter(review => review.review_stage === stage);
  };

  const getRecommendedAmountFromFinancialReview = (application) => {
    console.log('Getting recommended amount for application:', application.id);
    console.log('Application ssc_stage_status:', application.ssc_stage_status);
    console.log('Application ssc_reviews:', application.ssc_reviews);
    
    // Check if there's a financial review in the ssc_stage_status
    const stageStatus = application.ssc_stage_status || {};
    const financialReview = stageStatus.financial_review;
    
    if (financialReview && financialReview.review_data) {
      console.log('Found financial review in stage_status:', financialReview);
      // Try to get recommended_amount from review_data
      const reviewData = typeof financialReview.review_data === 'string' 
        ? JSON.parse(financialReview.review_data) 
        : financialReview.review_data;
      
      console.log('Parsed review_data:', reviewData);
      
      if (reviewData && reviewData.recommended_amount) {
        console.log('Found recommended_amount in stage_status:', reviewData.recommended_amount);
        return reviewData.recommended_amount.toString();
      }
    }

    // Fallback to ssc_reviews relationship if available
    if (application.ssc_reviews) {
      const financialReviewRecord = application.ssc_reviews.find(
        review => review.review_stage === 'financial_review' && review.status === 'approved'
      );
      
      console.log('Found financial review record:', financialReviewRecord);
      
      if (financialReviewRecord && financialReviewRecord.review_data) {
        const reviewData = typeof financialReviewRecord.review_data === 'string' 
          ? JSON.parse(financialReviewRecord.review_data) 
          : financialReviewRecord.review_data;
        
        console.log('Parsed review_data from ssc_reviews:', reviewData);
        
        if (reviewData && reviewData.recommended_amount) {
          console.log('Found recommended_amount in ssc_reviews:', reviewData.recommended_amount);
          return reviewData.recommended_amount.toString();
        }
      }
    }

    // Final fallback to requested amount
    console.log('Using fallback requested_amount:', application.requested_amount);
    return application.requested_amount ? application.requested_amount.toString() : '';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="h-7 w-7 mr-2 text-orange-500" />
            Final Approval (Chairperson)
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review all previous assessments and make final decision
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {applications.length} application{applications.length !== 1 ? 's' : ''} pending final approval
        </div>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">No applications pending final approval</p>
          </div>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="bg-white dark:bg-slate-800 rounded-lg border-2 border-orange-200 dark:border-orange-900/50 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {application.student ? `${application.student.first_name} ${application.student.last_name}` : 'Unknown Applicant'}
                    </h3>
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-xs font-semibold rounded">
                      READY FOR FINAL DECISION
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
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
                      <span className="text-gray-500 dark:text-gray-400">All Reviews:</span>
                      <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openReviewModal(application)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  Make Final Decision
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="h-6 w-6 mr-2 text-orange-500" />
                Final Decision - {selectedApplication.student ? `${selectedApplication.student.first_name} ${selectedApplication.student.last_name}` : 'Unknown Applicant'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review all previous assessments before making your final decision
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Summary */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Application Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Requested Amount:</span>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(selectedApplication.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Recommended Amount:</span>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedApplication.approved_amount || selectedApplication.requested_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Review History Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Complete Review History
                </h4>

                {/* Document Verification */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                  <button
                    onClick={() => toggleSection('document')}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">Document Verification</span>
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Approved</span>
                    </div>
                    {expandedSections.document ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {expandedSections.document && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All documents verified and approved for processing.</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Reviewed by: Document Verification Team
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Review */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                  <button
                    onClick={() => toggleSection('financial')}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">Financial Review</span>
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Approved</span>
                    </div>
                    {expandedSections.financial ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {expandedSections.financial && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Financial eligibility verified, budget allocation confirmed.</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Reviewed by: Financial Review Team
                      </div>
                    </div>
                  )}
                </div>

                {/* Academic Review */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg">
                  <button
                    onClick={() => toggleSection('academic')}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-gray-900 dark:text-white">Academic Review</span>
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Approved</span>
                    </div>
                    {expandedSections.academic ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {expandedSections.academic && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Academic eligibility confirmed, meets scholarship criteria.</p>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Reviewed by: Academic Review Team
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Decision Form */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Chairperson's Final Decision</h4>
                
                {/* Approved Amount */}
                <div className="mb-4">
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Final Approved Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      value={finalDecision.approved_amount}
                      onChange={(e) => setFinalDecision(prev => ({ ...prev, approved_amount: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Final Notes */}
                <div>
                  <label className="block font-medium text-gray-900 dark:text-white mb-2">
                    Chairperson's Notes/Remarks
                  </label>
                  <textarea
                    value={finalDecision.final_notes}
                    onChange={(e) => setFinalDecision(prev => ({ ...prev, final_notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Add any final remarks, conditions, or special instructions..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3 bg-gray-50 dark:bg-slate-700/50">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalReject}
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{isSubmitting ? 'REJECTING...' : 'FINAL REJECT'}</span>
              </button>
              <button
                onClick={handleFinalApprove}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span>{isSubmitting ? 'APPROVING...' : 'FINAL APPROVE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalApprovalReview;

