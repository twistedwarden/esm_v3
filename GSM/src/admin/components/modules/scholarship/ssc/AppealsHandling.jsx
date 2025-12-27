import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  MessageSquare,
  Eye,
  Edit,
  Calendar,
  Star,
  RotateCcw
} from 'lucide-react';

function AppealsHandling() {
  const [appeals, setAppeals] = useState([]);
  const [filteredAppeals, setFilteredAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  useEffect(() => {
    const loadAppeals = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Mock data - replace with actual API calls
        const mockAppeals = [
          {
            id: 'APL-2024-001',
            applicationId: 'APP-2024-001',
            studentName: 'Juan Dela Cruz',
            originalDecision: 'rejected',
            appealReason: 'Additional documents provided',
            appealDate: '2024-01-16',
            status: 'pending',
            priority: 'high',
            assignedTo: 'Dr. Maria Santos',
            originalScore: 6.2,
            newScore: null,
            appealDocuments: ['Additional Transcript', 'Recommendation Letter'],
            committeeReview: null,
            finalDecision: null,
            resolutionDate: null,
            comments: 'Student claims additional academic achievements not considered'
          },
          {
            id: 'APL-2024-002',
            applicationId: 'APP-2024-002',
            studentName: 'Maria Garcia',
            originalDecision: 'rejected',
            appealReason: 'Financial circumstances changed',
            appealDate: '2024-01-15',
            status: 'documents_reviewed',
            priority: 'medium',
            assignedTo: 'Prof. Juan Cruz',
            originalScore: 5.8,
            newScore: 7.2,
            appealDocuments: ['Updated Income Certificate', 'Medical Certificate'],
            committeeReview: 'in_progress',
            finalDecision: null,
            resolutionDate: null,
            comments: 'Family income significantly reduced due to job loss'
          },
          {
            id: 'APL-2024-003',
            applicationId: 'APP-2024-003',
            studentName: 'Pedro Santos',
            originalDecision: 'rejected',
            appealReason: 'Technical error in evaluation',
            appealDate: '2024-01-14',
            status: 'resolved',
            priority: 'low',
            assignedTo: 'Dr. Ana Reyes',
            originalScore: 4.5,
            newScore: 7.8,
            appealDocuments: ['Corrected Transcript', 'Grade Verification'],
            committeeReview: 'completed',
            finalDecision: 'approved',
            resolutionDate: '2024-01-18',
            comments: 'GPA calculation error corrected, student now meets requirements'
          }
        ];

        setAppeals(mockAppeals);
        setFilteredAppeals(mockAppeals);
      } catch (err) {
        setError('Failed to load appeals');
        console.error('Error loading appeals:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAppeals();
  }, []);

  useEffect(() => {
    let filtered = appeals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appeal => 
        appeal.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appeal.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appeal.appealReason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appeal => appeal.status === statusFilter);
    }

    setFilteredAppeals(filtered);
  }, [appeals, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      documents_reviewed: 'bg-blue-100 text-blue-800',
      interview_scheduled: 'bg-blue-100 text-blue-800',
      endorsed_to_ssc: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      grants_processing: 'bg-indigo-100 text-indigo-800',
      grants_disbursed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800',
      for_compliance: 'bg-red-100 text-red-800',
      compliance_documents_submitted: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.submitted;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  const getOriginalDecisionColor = (decision) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[decision] || colors.pending;
  };

  const handleViewAppeal = (appeal) => {
    setSelectedAppeal(appeal);
    setShowAppealModal(true);
  };

  const handleOverrideDecision = (appeal) => {
    setSelectedAppeal(appeal);
    setShowOverrideModal(true);
  };

  const handleResolveAppeal = (appealId, decision) => {
    // Handle appeal resolution
    console.log(`Resolving appeal ${appealId} with decision: ${decision}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appeals Handling</h1>
        <p className="text-gray-600">Manage student appeals and decision overrides</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Appeals</p>
              <p className="text-2xl font-bold text-gray-900">
                {appeals.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {appeals.filter(a => ['documents_reviewed', 'interview_scheduled', 'endorsed_to_ssc'].includes(a.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {appeals.filter(a => a.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <RotateCcw className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overrides</p>
              <p className="text-2xl font-bold text-gray-900">
                {appeals.filter(a => a.finalDecision && a.finalDecision !== a.originalDecision).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search appeals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="documents_reviewed">Documents Reviewed</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="endorsed_to_ssc">Endorsed to SSC</option>
              <option value="approved">Approved</option>
              <option value="grants_processing">Grants Processing</option>
              <option value="grants_disbursed">Grants Disbursed</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="for_compliance">For Compliance</option>
              <option value="compliance_documents_submitted">Compliance Documents Submitted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appeals List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Appeals ({filteredAppeals.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Decision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appeal Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppeals.map((appeal) => (
                <tr key={appeal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{appeal.studentName}</div>
                      <div className="text-sm text-gray-500">{appeal.applicationId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOriginalDecisionColor(appeal.originalDecision)}`}>
                      {appeal.originalDecision.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Score: {appeal.originalScore}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{appeal.appealReason}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {appeal.appealDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(appeal.priority)}`}>
                      {appeal.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appeal.status)}`}>
                      {appeal.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appeal.assignedTo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewAppeal(appeal)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Appeal"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {appeal.status !== 'resolved' && (
                        <button
                          onClick={() => handleOverrideDecision(appeal)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Override Decision"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppeals.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appeals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Appeal Details Modal */}
      {showAppealModal && selectedAppeal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Appeal Details - {selectedAppeal.studentName}
              </h3>
              <button
                onClick={() => setShowAppealModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Appeal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Appeal ID:</span> {selectedAppeal.id}</p>
                  <p><span className="font-medium">Application ID:</span> {selectedAppeal.applicationId}</p>
                  <p><span className="font-medium">Appeal Date:</span> {selectedAppeal.appealDate}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAppeal.status)}`}>
                      {selectedAppeal.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Original Decision</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Decision:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getOriginalDecisionColor(selectedAppeal.originalDecision)}`}>
                      {selectedAppeal.originalDecision.toUpperCase()}
                    </span>
                  </p>
                  <p><span className="font-medium">Score:</span> {selectedAppeal.originalScore}</p>
                  <p><span className="font-medium">New Score:</span> {selectedAppeal.newScore || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Appeal Reason</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {selectedAppeal.comments}
              </p>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Appeal Documents</h4>
              <div className="space-y-2">
                {selectedAppeal.appealDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {doc}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAppealModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedAppeal.status !== 'resolved' && (
                <button
                  onClick={() => {
                    setShowAppealModal(false);
                    handleOverrideDecision(selectedAppeal);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Override Decision
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Override Decision Modal */}
      {showOverrideModal && selectedAppeal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Override Decision - {selectedAppeal.studentName}
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Decision</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select New Decision</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="for_review">For Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification for Override</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why this decision should be overridden..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Override Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppealsHandling;
