import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileText,
  Award,
  School,
  DollarSign,
  User,
  X
} from 'lucide-react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';

function DecisionHistory() {
  const { showSuccess, showError } = useToastContext();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    decision: 'all',
    stage: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all SSC review decisions from all stages
      const response = await scholarshipApiService.getAllSscDecisions({
        per_page: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      setDecisions(response.data);
    } catch (e) {
      console.error('Error fetching SSC decision history:', e);
      setError('Failed to load decision history');
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecisions = decisions.filter(decision => {
    const application = decision.application;
    const student = application?.student;
    
    const matchesSearch = 
      student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application?.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.student_id_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDecision = filters.decision === 'all' || decision.status === filters.decision;
    const matchesStage = filters.stage === 'all' || decision.review_stage === filters.stage;

    const decisionDate = decision.approved_at || decision.reviewed_at || decision.created_at;
    const matchesDateFrom = !filters.dateFrom || 
      new Date(decisionDate) >= new Date(filters.dateFrom);

    const matchesDateTo = !filters.dateTo || 
      new Date(decisionDate) <= new Date(filters.dateTo);

    return matchesSearch && matchesDecision && matchesStage && matchesDateFrom && matchesDateTo;
  });

  const getDecisionColor = (status) => {
    return status === 'approved' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getDecisionIcon = (status) => {
    return status === 'approved' 
      ? <CheckCircle className="w-4 h-4" />
      : <XCircle className="w-4 h-4" />;
  };

  const getStageColor = (stage) => {
    const colors = {
      'document_verification': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'financial_review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'academic_review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'final_approval': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getStageLabel = (stage) => {
    const labels = {
      'document_verification': 'Document Verification',
      'financial_review': 'Financial Review',
      'academic_review': 'Academic Review',
      'final_approval': 'Final Approval'
    };
    return labels[stage] || stage;
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      decision: 'all',
      stage: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return filters.decision !== 'all' || 
           filters.stage !== 'all' ||
           filters.dateFrom !== '' || 
           filters.dateTo !== '' || 
           searchTerm !== '';
  };

  const handleViewDetails = (decision) => {
    setSelectedDecision(decision);
    setIsViewModalOpen(true);
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const headers = ['Decision ID', 'Application Number', 'Student Name', 'Review Stage', 'Decision', 'Amount', 'Date', 'Notes/Reason'];
      const rows = filteredDecisions.map(d => {
        const app = d.application;
        const student = app?.student;
        const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
        
        return [
          d.id,
          app?.application_number || '',
          studentName,
          getStageLabel(d.review_stage),
          d.status === 'approved' ? 'Approved' : 'Rejected',
          d.review_data?.recommended_amount ? `₱${d.review_data.recommended_amount.toLocaleString()}` : 'N/A',
          new Date(d.approved_at || d.reviewed_at || d.created_at).toLocaleDateString(),
          d.status === 'approved' ? (d.review_notes || d.approval_notes || '') : (d.review_notes || '')
        ];
      });

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ssc_decision_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Decision history exported successfully!', 'Export Successful');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export decision history.', 'Export Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 min-w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search decisions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.decision}
              onChange={(e) => updateFilter('decision', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Decisions</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filters.stage}
              onChange={(e) => updateFilter('stage', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Stages</option>
              <option value="document_verification">Document Verification</option>
              <option value="financial_review">Financial Review</option>
              <option value="academic_review">Academic Review</option>
              <option value="final_approval">Final Approval</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showAdvancedFilters 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                  : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Advanced</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchDecisions}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.decision !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Decision: {filters.decision}
                <button onClick={() => updateFilter('decision', 'all')} className="ml-1 hover:text-orange-600 dark:hover:text-orange-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.stage !== 'all' && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Stage: {getStageLabel(filters.stage)}
                <button onClick={() => updateFilter('stage', 'all')} className="ml-1 hover:text-blue-600 dark:hover:text-blue-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-purple-600 dark:hover:text-purple-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-sm text-gray-600 dark:text-gray-300 underline hover:text-gray-800 dark:hover:text-gray-100">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading decisions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No decisions found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filteredDecisions.length} Decision{filteredDecisions.length !== 1 ? 's' : ''}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredDecisions.map((decision) => {
                  const app = decision.application;
                  const student = app?.student;
                  const school = app?.school;
                  const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();

                  return (
                    <tr key={decision.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {app?.application_number || `APP-${app?.id}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {app?.category?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {studentName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student?.student_id_number || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <School className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {school?.name || 'Unknown School'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(decision.review_stage)}`}>
                          {getStageLabel(decision.review_stage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDecisionColor(decision.status)}`}>
                          {getDecisionIcon(decision.status)}
                          <span className="ml-1 capitalize">{decision.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {decision.review_data?.recommended_amount 
                              ? `₱${decision.review_data.recommended_amount.toLocaleString()}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(decision.approved_at || decision.reviewed_at || decision.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(decision)}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Decision Details
              </h3>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Decision Summary */}
                <div className={`rounded-lg p-4 ${
                  selectedDecision.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedDecision.status === 'approved' ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                      <div>
                        <h4 className={`text-lg font-semibold ${
                          selectedDecision.status === 'approved'
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}>
                          {getStageLabel(selectedDecision.review_stage)} - {selectedDecision.status === 'approved' ? 'Approved' : 'Rejected'}
                        </h4>
                        <p className={`text-sm ${
                          selectedDecision.status === 'approved'
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          Decision made on {new Date(selectedDecision.approved_at || selectedDecision.reviewed_at || selectedDecision.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedDecision.review_data?.recommended_amount && (
                      <div className="text-right">
                        <p className="text-sm text-green-700 dark:text-green-300">Recommended Amount</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          ₱{selectedDecision.review_data.recommended_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Details */}
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Application Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Application Number:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {selectedDecision.application?.application_number || `APP-${selectedDecision.application_id}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Student:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {`${selectedDecision.application?.student?.first_name || ''} ${selectedDecision.application?.student?.last_name || ''}`.trim() || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">School:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {selectedDecision.application?.school?.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Category:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                        {selectedDecision.application?.category?.name || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">Review Stage:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(selectedDecision.review_stage)}`}>
                        {getStageLabel(selectedDecision.review_stage)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decision Notes/Reason */}
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedDecision.status === 'approved' ? 'Review Notes' : 'Rejection Reason'}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedDecision.status === 'approved'
                      ? selectedDecision.review_notes || selectedDecision.approval_notes || 'No notes provided.'
                      : selectedDecision.review_notes || 'No reason provided.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DecisionHistory;

