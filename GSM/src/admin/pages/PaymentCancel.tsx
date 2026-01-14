import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { schoolAidService } from '../components/modules/schoolAid/services/schoolAidService';

export const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isReverting, setIsReverting] = useState(true);
  const [revertSuccess, setRevertSuccess] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Revert application status when page loads
  useEffect(() => {
    const revertStatus = async () => {
      try {
        const applicationId = searchParams.get('application_id');
        const checkoutSessionId = searchParams.get('checkout_session_id');
        const transactionId = searchParams.get('transaction_id');

        // Only revert if we have at least one identifier
        if (applicationId || checkoutSessionId || transactionId) {
          const result = await schoolAidService.revertApplicationOnCancel({
            application_id: applicationId || undefined,
            checkout_session_id: checkoutSessionId || undefined,
            transaction_id: transactionId || undefined,
          });

          if (result.success) {
            setRevertSuccess(true);
          }
        }
      } catch (error: any) {
        console.error('Error reverting application status:', error);
        // Don't show error to user if application not found (might already be reverted)
        if (error.message && !error.message.includes('not found')) {
          setRevertError(error.message);
        }
      } finally {
        setIsReverting(false);
      }
    };

    revertStatus();
  }, [searchParams]);

  const handleBackToApplications = () => {
    navigate('/admin', { 
      state: { 
        activeItem: 'school-aid-distribution',
        activeTab: 'applications'
      }
    });
  };

  const handleRetry = () => {
    // Get application ID from URL params if available
    const applicationId = searchParams.get('application_id');
    if (applicationId) {
      navigate('/admin', { 
        state: { 
          activeItem: 'school-aid-distribution',
          activeTab: 'applications',
          retryApplicationId: applicationId
        }
      });
    } else {
      handleBackToApplications();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Payment Cancelled
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The payment process was cancelled. No charges were made.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
          {isReverting ? (
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Reverting application status...</span>
            </div>
          ) : revertSuccess ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your application status has been reverted to <strong>approved</strong>. You can retry the payment process at any time.
            </p>
          ) : revertError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {revertError}
            </p>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You can retry the payment process at any time. Your application status has been reverted to <strong>approved</strong>.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Payment</span>
          </button>
          
          <button
            onClick={handleBackToApplications}
            className="w-full flex items-center justify-center space-x-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Applications</span>
          </button>
        </div>
      </div>
    </div>
  );
};
