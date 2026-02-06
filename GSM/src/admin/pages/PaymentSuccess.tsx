import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { schoolAidService } from '../components/modules/schoolAid/services/schoolAidService';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const applicationId = searchParams.get('application_id');
      const sessionId = searchParams.get('checkout_session_id');

      if (applicationId) {
        try {
          const data = await schoolAidService.verifyPayment({
            application_id: applicationId,
            session_id: sessionId || undefined
          });
          setPaymentData(data);
        } catch (error) {
          console.error('Payment verification failed:', error);
        }
      }

      // Ensure loading state is cleared even if verification fails or no app ID
      setLoading(false);
    };

    verifyPayment();
  }, [searchParams]);

  const handleBackToApplications = () => {
    navigate('/admin', {
      state: {
        activeItem: 'school-aid-distribution',
        activeTab: 'applications'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Processing your payment...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Payment Successful!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your scholarship grant payment has been processed successfully.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
              <p className="font-semibold text-green-600 dark:text-green-400">Payment Completed</p>

              {(paymentData?.reference || searchParams.get('reference')) && (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 mb-1">Reference Number</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-white">
                    {paymentData?.reference || searchParams.get('reference')}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your application status will be updated automatically. You will receive a confirmation once the disbursement is processed.
              </p>

              <button
                onClick={handleBackToApplications}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Applications</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
