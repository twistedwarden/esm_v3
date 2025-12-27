import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  School,
  AlertCircle,
  FileText,
  Gift
} from 'lucide-react';
import { 
  ScholarshipApplication, 
  ApplicationStatus, 
  Priority, 
  SubmoduleConfig,
  ModalState 
} from '../types';
import { schoolAidService } from '../services/schoolAidService';

interface ApplicationsTabProps {
  submodule: SubmoduleConfig;
  activeTab: string;
  activeSubmodule: string;
  selectedApplications: string[];
  setSelectedApplications: (ids: string[]) => void;
  modalState: ModalState;
  setModalState: (state: ModalState) => void;
  onProcessPayment?: (application: ScholarshipApplication) => Promise<void>;
  onProcessGrant?: (application: ScholarshipApplication) => Promise<void>;
  onBatchProcessPayments?: (applicationIds: string[]) => Promise<void>;
  onApproveApplication?: (applicationId: string) => Promise<void>;
  onRejectApplication?: (applicationId: string, reason: string) => Promise<void>;
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  submodule,
  activeSubmodule,
  selectedApplications,
  setSelectedApplications,
  setModalState,
  onProcessPayment,
  onProcessGrant,
  onBatchProcessPayments,
  onApproveApplication,
  onRejectApplication
}) => {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    fetchApplications();
  }, [activeSubmodule]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, priorityFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const filters = {
        status: submodule.statusFilter?.[0],
        submodule: activeSubmodule
      };
      
      const data = await schoolAidService.getApplications(filters);
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
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
        app.school.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(app => app.priority === priorityFilter);
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

  const getStatusColor = (status: ApplicationStatus) => {
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      grants_processing: 'bg-purple-100 text-purple-800',
      grants_disbursed: 'bg-green-100 text-green-800',
      payment_failed: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
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

  const handleProcessPayment = (application: ScholarshipApplication) => {
    // Note: onProcessPayment is available but we're using modal state instead
    // This allows for future enhancement where the parent component handles payment processing
    setModalState({
      isOpen: true,
      application,
      mode: 'process'
    });
  };

  const handleProcessGrant = async (application: ScholarshipApplication) => {
    if (onProcessGrant) {
      try {
        await onProcessGrant(application);
        fetchApplications();
      } catch (error) {
        console.error('Error processing grant:', error);
      }
    }
  };

  const handleApproveApplicationClick = async (application: ScholarshipApplication) => {
    if (onApproveApplication) {
      try {
        await onApproveApplication(application.id);
        fetchApplications();
      } catch (error) {
        console.error('Error approving application:', error);
      }
    }
  };

  const handleRejectApplicationClick = async (application: ScholarshipApplication) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && onRejectApplication) {
      try {
        await onRejectApplication(application.id, reason);
        fetchApplications();
      } catch (error) {
        console.error('Error rejecting application:', error);
      }
    }
  };

  const handleBatchProcessPaymentsClick = async () => {
    if (selectedApplications.length === 0) {
      alert('Please select applications to process');
      return;
    }

    if (confirm(`Process payments for ${selectedApplications.length} applications?`)) {
      if (onBatchProcessPayments) {
        try {
          await onBatchProcessPayments(selectedApplications);
          setSelectedApplications([]);
          fetchApplications();
        } catch (error) {
          console.error('Error batch processing payments:', error);
        }
      }
    }
  };

  const getActionButtons = (application: ScholarshipApplication) => {
    const buttons = [];

    // Always show view button
    buttons.push(
      <button
        key="view"
        onClick={() => handleViewApplication(application)}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View
      </button>
    );

    // Add action buttons based on application status
    if (application.status === 'approved') {
      buttons.push(
        <button
          key="process-grant"
          onClick={() => handleProcessGrant(application)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
        >
          <Gift className="w-4 h-4" />
          Process Grant
        </button>
      );
    }

    // Add action buttons based on status and submodule
    switch (activeSubmodule) {
      case 'under_review':
        buttons.push(
          <button
            key="approve"
            onClick={() => handleApproveApplicationClick(application)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>,
          <button
            key="reject"
            onClick={() => handleRejectApplicationClick(application)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        );
        break;
      case 'processing':
        buttons.push(
          <button
            key="complete"
            onClick={() => {/* TODO: Implement complete */}}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
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
            onClick={() => {/* TODO: Implement retry */}}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Retry
          </button>
        );
        break;
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by student name, ID, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm sm:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:gap-3 lg:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm sm:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="grants_processing">Processing</option>
              <option value="grants_disbursed">Disbursed</option>
              <option value="payment_failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm sm:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <div className="flex border border-gray-300 dark:border-slate-600 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r border-gray-300 dark:border-slate-600'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
          Showing {filteredApplications.length} of {applications.length} applications
          {selectedApplications.length > 0 && (
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
              ({selectedApplications.length} selected)
            </span>
          )}
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2">
          <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-slate-300">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          {activeSubmodule === 'approved' && selectedApplications.length > 0 && (
            <button 
              onClick={handleBatchProcessPaymentsClick}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Process Selected ({selectedApplications.length})</span>
              <span className="sm:hidden">Process ({selectedApplications.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Student</span>
                    <span className="sm:hidden">STUDENT</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">School</span>
                    <span className="sm:hidden">SCHOOL</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Amount</span>
                    <span className="sm:hidden">AMOUNT</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Status</span>
                    <span className="sm:hidden">STATUS</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Priority</span>
                    <span className="sm:hidden">PRIORITY</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Date</span>
                    <span className="sm:hidden">DATE</span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="hidden sm:inline">Actions</span>
                    <span className="sm:hidden">ACTIONS</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-2 sm:ml-4 min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {application.studentName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {application.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <School className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                        <div className="text-xs sm:text-sm text-gray-900 truncate">{application.school}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">
                        {formatCurrency(application.amount)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        <span className="hidden sm:inline">{application.status.replace('_', ' ').toUpperCase()}</span>
                        <span className="sm:hidden">{application.status.replace('_', ' ').charAt(0).toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
                        <span className="hidden sm:inline">{application.priority.toUpperCase()}</span>
                        <span className="sm:hidden">{application.priority.charAt(0).toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDate(application.approvalDate || application.submittedDate)}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {getActionButtons(application)}
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => handleSelectApplication(application.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-1">
                  {getActionButtons(application)}
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{application.studentName}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{application.studentId}</p>
                </div>
                
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <School className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{application.school}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(application.amount)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
                      {application.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{formatDate(application.approvalDate || application.submittedDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No applications found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search criteria.'
              : 'No applications match the current submodule filter.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationsTab;
