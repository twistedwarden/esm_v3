import React from 'react';
import { X, User, School, DollarSign, Calendar, FileText, Eye, EyeOff } from 'lucide-react';
import { ScholarshipApplication } from '../types';

interface ApplicationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ScholarshipApplication | null;
}

const ApplicationViewModal: React.FC<ApplicationViewModalProps> = ({
  isOpen,
  onClose,
  application
}) => {
  const [showAccountDetails, setShowAccountDetails] = React.useState(false);

  if (!isOpen || !application) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      pending_disbursement: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      grants_processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      grants_disbursed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      disbursed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      received: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      payment_failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };


  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return '****';
    if (accountNumber.length <= 4) return '****';
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application Details</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              View scholarship application information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Student Information */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Student Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{application.studentName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Student ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{application.studentId}</p>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <School className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">School</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{application.school}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Grant Amount</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(application.amount)}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-slate-400">Student Account</p>
                  <button
                    type="button"
                    onClick={() => setShowAccountDetails(!showAccountDetails)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showAccountDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {application.paymentMethod ? application.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}
                </p>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                  {showAccountDetails 
                    ? (application.walletAccountNumber || 'Not provided') 
                    : maskAccountNumber(application.walletAccountNumber)}
                </p>
              </div>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
              Application Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Submitted Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(application.submittedDate)}</p>
                </div>
              </div>
              {application.approvalDate && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-200 dark:bg-green-900 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Approval Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(application.approvalDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {application.notes && (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h3>
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{application.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationViewModal;
