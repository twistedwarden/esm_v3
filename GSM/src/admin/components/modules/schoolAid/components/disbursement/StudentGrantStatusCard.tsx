import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { ScholarshipApplication } from '../../types';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import { DISBURSEMENT_STATUS } from './statusLogic';

interface StudentGrantStatusCardProps {
  application: ScholarshipApplication;
  onConfirmReceipt: (applicationId: string) => Promise<void>;
}

const StudentGrantStatusCard: React.FC<StudentGrantStatusCardProps> = ({
  application,
  onConfirmReceipt
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleConfirm = async () => {
    if (confirm('Are you sure you have received the full amount? This action cannot be undone.')) {
      setIsConfirming(true);
      try {
        await onConfirmReceipt(application.id);
      } catch (error) {
        console.error('Error confirming receipt:', error);
        alert('Failed to confirm receipt. Please try again.');
      } finally {
        setIsConfirming(false);
      }
    }
  };

  if (!application) return null;

  const isDisbursed = application.status === DISBURSEMENT_STATUS.DISBURSED;
  const isReceived = application.status === DISBURSEMENT_STATUS.RECEIVED;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Grant Disbursement Status
        </h3>
      </div>

      <div className="p-6">
        {/* Status Banner */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Status</p>
            <div className="flex items-center mt-1">
              {isReceived ? (
                <span className="flex items-center text-green-600 dark:text-green-400 font-bold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Funds Received
                </span>
              ) : isDisbursed ? (
                <span className="flex items-center text-blue-600 dark:text-blue-400 font-bold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Funds Disbursed
                </span>
              ) : (
                <span className="flex items-center text-yellow-600 dark:text-yellow-400 font-bold">
                  <Clock className="w-5 h-5 mr-2" />
                  Processing
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-slate-400">Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(application.amount)}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        {(isDisbursed || isReceived) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-900/30 rounded-lg p-4 mb-6">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Payment Method
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {application.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Provider
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {application.transactionReference ? 'External Provider' : 'N/A'} 
                {/* Note: Provider name might need to be added to types if not available */}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Reference Number
              </p>
              <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                {application.transactionReference || application.paymentReference || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Date Disbursed
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(application.disbursedDate)}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          {(isDisbursed || isReceived) && application.proofOfTransferUrl ? (
            <button
              onClick={() => setShowReceipt(true)}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Proof of Transfer
            </button>
          ) : (
            <div className="flex items-center text-gray-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              No receipt available
            </div>
          )}

          {isDisbursed && !isReceived && (
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Receipt
                </>
              )}
            </button>
          )}

          {isReceived && (
            <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Receipt Confirmed
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptPreviewModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        application={application}
      />
    </div>
  );
};

export default StudentGrantStatusCard;
