import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PhilippinePeso, 
  Calendar, 
  User, 
  School,
  CreditCard,
  RefreshCw,
  Download,
  Mail,
  Bell
} from 'lucide-react';
import { 
  ScholarshipApplication, 
  PaymentProcessingState,
  ModalState 
} from '../types';

interface PaymentModalProps {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  onProcessPayment: (application: ScholarshipApplication) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  modalState,
  setModalState,
  onProcessPayment
}) => {
  const [processingState, setProcessingState] = useState<PaymentProcessingState | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [showSuccess, setShowSuccess] = useState(false);

  const { isOpen, application, mode } = modalState;

  useEffect(() => {
    if (mode === 'process' && application) {
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentStep: 'Ready to process'
      });
    }
  }, [mode, application]);

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
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      grants_processing: 'bg-purple-100 text-purple-800',
      grants_disbursed: 'bg-green-100 text-green-800',
      payment_failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };


  const handleProcessPayment = async () => {
    if (!application) return;

    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: 'Validating application...'
    });

    try {
      await onProcessPayment(application);
      
      // Simulate processing steps
      const steps = [
        { progress: 25, step: 'Calculating amount...' },
        { progress: 50, step: 'Initiating transfer...' },
        { progress: 75, step: 'Processing payment...' },
        { progress: 90, step: 'Confirming transaction...' },
        { progress: 100, step: 'Payment completed successfully!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProcessingState(prev => ({
          ...prev!,
          progress: step.progress,
          currentStep: step.step
        }));
      }

      setProcessingState(prev => ({
        ...prev!,
        isProcessing: false,
        success: true
      }));

      setShowSuccess(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (error) {
      setProcessingState(prev => ({
        ...prev!,
        isProcessing: false,
        error: 'Payment processing failed. Please try again.'
      }));
    }
  };

  const handleClose = () => {
    setModalState({
      isOpen: false,
      application: undefined,
      mode: 'view'
    });
    setProcessingState(null);
    setShowSuccess(false);
  };

  const renderTimeline = () => {
    // Show timeline when application is available
    if (!application) {
      return null;
    }

    const timelineEvents = [
      {
        id: 1,
        action: 'Application Submitted',
        description: 'Student submitted scholarship application',
        timestamp: application.submittedDate,
        status: 'completed' as const,
        icon: CheckCircle
      },
      {
        id: 2,
        action: 'Application Approved',
        description: 'Application reviewed and approved',
        timestamp: application.approvalDate,
        status: 'completed' as const,
        icon: CheckCircle
      },
      ...(application.processingDate ? [{
        id: 3,
        action: 'Payment Processing',
        description: 'Payment initiated and being processed',
        timestamp: application.processingDate,
        status: 'completed' as const,
        icon: Clock
      }] : []),
      ...(application.disbursedDate ? [{
        id: 4,
        action: 'Payment Disbursed',
        description: 'Payment completed successfully',
        timestamp: application.disbursedDate,
        status: 'completed' as const,
        icon: CheckCircle
      }] : [{
        id: 4,
        action: 'Awaiting Disbursement',
        description: 'Ready for payment processing',
        timestamp: new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        icon: Clock
      }])
    ];

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Timeline</h4>
        {timelineEvents.map((event) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                event.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <Icon className={`w-4 h-4 ${
                  event.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{event.action}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPaymentDetails = () => {
    // Show payment details when application is available and mode is process
    if (!application || mode !== 'process') {
      return null;
    }

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Payment Details</h4>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bank_transfer">Direct Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(application.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {processingState && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Processing Progress</span>
                <span className="text-sm text-blue-600">{Math.round(processingState.progress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingState.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600">{processingState.currentStep}</p>
            </div>

            {processingState.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{processingState.error}</p>
                </div>
              </div>
            )}

            {processingState.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">Payment processed successfully!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Show modal when open and application is available
  if (!isOpen || !application) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">School Aid Distribution - Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'view' ? 'Application Details' : 'Process Payment'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Application Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester/Term</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">1st Semester 2024</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">
                    {application.approvalDate ? formatDate(application.approvalDate) : 'Pending'}
                  </span>
                </div>
              </div>

            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{application.studentName}</span>
                    <p className="text-xs text-gray-500">{application.studentId}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <School className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{application.school}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <PhilippinePeso className="w-4 h-4 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(application.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank/Wallet Details */}
          {(application.digitalWallets || application.walletAccountNumber) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.digitalWallets && application.digitalWallets.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Digital Wallets</label>
                    <div className="flex flex-wrap gap-2">
                      {application.digitalWallets.map((wallet: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {wallet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {application.walletAccountNumber && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg">
                      <span className="text-sm font-mono text-gray-900">{application.walletAccountNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {renderTimeline()}

          {/* Payment Details */}
          {renderPaymentDetails()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {application.status === 'grants_disbursed' && (
              <>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  View Receipt
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Mail className="w-4 h-4" />
                  Send Notification
                </button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            
            {mode === 'process' && application.status === 'approved' && !processingState?.isProcessing && (
              <button
                onClick={handleProcessPayment}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Process Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
