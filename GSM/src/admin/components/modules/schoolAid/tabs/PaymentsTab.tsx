import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  PhilippinePeso,
  Calendar,
  User,
  School,
  AlertCircle,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Activity,
  Grid,
  List
} from 'lucide-react';
import {
  ScholarshipApplication,
  ApplicationStatus,
  Priority,
  SubmoduleConfig,
  ModalState,
  PaymentRecord,
  PaymentProcessingState
} from '../types';
import { schoolAidService } from '../services/schoolAidService';

interface PaymentsTabProps {
  submodule: SubmoduleConfig;
  activeTab: string;
  activeSubmodule: string;
  selectedApplications: string[];
  setSelectedApplications: (ids: string[]) => void;
  modalState: ModalState;
  setModalState: (state: ModalState) => void;
  lastUpdated?: number;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({
  submodule,
  activeTab,
  activeSubmodule,
  selectedApplications,
  setSelectedApplications,
  modalState,
  setModalState,
  lastUpdated
}) => {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [processingStates, setProcessingStates] = useState<Record<string, PaymentProcessingState>>({});

  useEffect(() => {
    fetchPaymentData();
  }, [activeSubmodule, lastUpdated]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const filters = {
        status: submodule.statusFilter?.[0],
        submodule: activeSubmodule
      };

      const [applicationsData, paymentRecordsData] = await Promise.all([
        schoolAidService.getApplications(filters),
        schoolAidService.getPaymentRecords(filters)
      ]);

      setApplications(applicationsData);
      setPaymentRecords(paymentRecordsData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 dark:bg-blue-900 text-blue-800',
      grants_processing: 'bg-purple-100 text-purple-800',
      grants_disbursed: 'bg-green-100 dark:bg-green-900 text-green-800',
      disbursed: 'bg-green-100 dark:bg-green-900 text-green-800',
      received: 'bg-green-100 dark:bg-green-900 text-green-800',
      payment_failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      pending_disbursement: 'bg-orange-100 text-orange-800'
    };
    return colors[status];
  };

  const getPaymentStatusColor = (status: PaymentRecord['status']) => {
    const colors = {
      processing: 'bg-blue-100 dark:bg-blue-900 text-blue-800',
      completed: 'bg-green-100 dark:bg-green-900 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'gcash':
        return <PhilippinePeso className="w-4 h-4" />;
      case 'paymaya':
        return <PhilippinePeso className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleSelectApplication = (applicationId: string) => {
    if (selectedApplications.includes(applicationId)) {
      setSelectedApplications(selectedApplications.filter(id => id !== applicationId));
    } else {
      setSelectedApplications([...selectedApplications, applicationId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id));
    }
  };

  const handleViewApplication = (application: ScholarshipApplication) => {
    setModalState({
      isOpen: true,
      application,
      mode: 'view'
    });
  };

  const handleProcessDisbursement = (application: ScholarshipApplication) => {
    setModalState({
      isOpen: true,
      application,
      mode: 'process'
    });
  };

  const handleRetryPayment = async (application: ScholarshipApplication) => {
    const paymentRecord = paymentRecords.find(p => p.applicationId === application.id);
    if (!paymentRecord) return;

    setProcessingStates(prev => ({
      ...prev,
      [application.id]: {
        isProcessing: true,
        progress: 0,
        currentStep: 'Initiating retry...'
      }
    }));

    try {
      // Retry payment through service
      const newPaymentRecord = await schoolAidService.retryPayment(paymentRecord.id);

      // Update processing state
      setProcessingStates(prev => ({
        ...prev,
        [application.id]: {
          isProcessing: false,
          progress: 100,
          currentStep: 'Payment completed successfully',
          success: true
        }
      }));

      // Status is already updated by the retryPayment service, no need to update again

      // Refresh data
      fetchPaymentData();

    } catch (error) {
      setProcessingStates(prev => ({
        ...prev,
        [application.id]: {
          isProcessing: false,
          progress: 100,
          currentStep: 'Payment failed',
          error: 'Payment retry failed. Please try again.'
        }
      }));
    }

    // Clear processing state after 3 seconds
    setTimeout(() => {
      setProcessingStates(prev => {
        const newState = { ...prev };
        delete newState[application.id];
        return newState;
      });
    }, 3000);
  };

  const handleCompletePayment = async (application: ScholarshipApplication) => {
    try {
      await schoolAidService.updateApplicationStatus(application.id, 'grants_disbursed');
      // Refresh data
      fetchPaymentData();
    } catch (error) {
      console.error('Error completing payment:', error);
    }
  };

  const getActionButtons = (application: ScholarshipApplication) => {
    const buttons = [];
    const paymentRecord = paymentRecords.find(p => p.applicationId === application.id);
    const processingState = processingStates[application.id];

    // Always show view button
    buttons.push(
      <button
        key="view"
        onClick={() => handleViewApplication(application)}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View
      </button>
    );

    // Add action buttons based on status and submodule
    switch (activeSubmodule) {
      default:
        // Default case - show process disbursement button for applications ready for disbursement
        if (application.status === 'grants_processing') {
          buttons.push(
            <button
              key="disburse"
              onClick={() => handleProcessDisbursement(application)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <PhilippinePeso className="w-4 h-4" />
              Process Disbursement
            </button>
          );
        }
        break;
      case 'processing':
        buttons.push(
          <button
            key="complete"
            onClick={() => handleCompletePayment(application)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Complete
          </button>
        );
        break;
      case 'failed':
        buttons.push(
          <button
            key="retry"
            onClick={() => handleRetryPayment(application)}
            disabled={processingState?.isProcessing}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 rounded hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingState?.isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {processingState?.isProcessing ? 'Processing...' : 'Retry'}
          </button>
        );
        break;
      case 'disbursed':
        buttons.push(
          <button
            key="receipt"
            onClick={() => {/* TODO: Implement view receipt */ }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Receipt
          </button>
        );
        break;
    }

    return buttons;
  };

  const renderProcessingProgress = (application: ScholarshipApplication) => {
    const processingState = processingStates[application.id];
    // Show processing progress when processing
    if (!processingState?.isProcessing) {
      return null;
    }

    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Processing Payment</span>
          <span className="text-sm text-blue-600 dark:text-blue-400">{Math.round(processingState.progress)}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${processingState.progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400">{processingState.currentStep}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      {activeSubmodule === 'processing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Processing</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <PhilippinePeso className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(applications.reduce((sum, app) => sum + app.amount, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2.5 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name, ID, school, or payment reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-l border-gray-300 dark:border-slate-600 ${viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            {activeSubmodule === 'processing' && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <CheckCircle className="w-4 h-4" />
                Batch Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-slate-400">
          Showing {filteredApplications.length} of {applications.length} payments
          {selectedApplications.length > 0 && (
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
              ({selectedApplications.length} selected)
            </span>
          )}
        </div>
      </div>

      {/* Payments List/Grid View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => {
                  const paymentRecord = paymentRecords.find(p => p.applicationId === application.id);
                  return (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={() => handleSelectApplication(application.id)}
                          className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <School className="w-4 h-4 text-gray-400 dark:text-slate-400 mr-2" />
                          <div className="text-sm text-gray-900 dark:text-white">{application.school}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(application.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(paymentRecord?.method || 'bank_transfer')}
                          <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                            {paymentRecord?.method?.replace('_', ' ') || 'Bank Transfer'}
                          </span>
                        </div>
                        {paymentRecord?.reference && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ref: {paymentRecord.reference}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {paymentRecord && (
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(paymentRecord.status)}`}>
                            {paymentRecord.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(application.processingDate || application.disbursedDate || application.approvalDate || application.submittedDate)}
                        </div>
                        {paymentRecord?.completedAt && (
                          <div className="text-xs text-gray-400 dark:text-slate-400 mt-1">
                            Completed: {formatDateTime(paymentRecord.completedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {getActionButtons(application)}
                          <button className="p-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Processing Progress Overlays */}
          {Object.entries(processingStates).map(([appId, state]) => {
            const application = applications.find(app => app.id === appId);
            if (!application || !state.isProcessing) return null;

            return (
              <div key={appId} className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                  <div className="text-center">
                    <div className="mb-4">
                      <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Processing Payment</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{application.studentName}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{state.currentStep}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((application) => {
            const paymentRecord = paymentRecords.find(p => p.applicationId === application.id);
            return (
              <div key={application.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => handleSelectApplication(application.id)}
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 mt-1"
                    />
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{application.studentName}</h3>
                      <p className="text-xs text-gray-500">{application.studentId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                    <School className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-400" />
                    <span className="truncate">{application.school}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(application.amount)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {paymentRecord && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-slate-400 pt-2 border-t">
                      {getPaymentMethodIcon(paymentRecord.method)}
                      <span className="ml-2 capitalize">{paymentRecord.method.replace('_', ' ')}</span>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-gray-500 pt-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(application.processingDate || application.disbursedDate || application.approvalDate || application.submittedDate)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  {getActionButtons(application)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400">
            <PhilippinePeso className="w-12 h-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No disbursements found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : activeSubmodule === 'processing'
                ? 'No applications are currently being processed. Use "Process Grant" in the Processing Grants tab to move applications here.'
                : 'No disbursements match the current submodule filter.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
