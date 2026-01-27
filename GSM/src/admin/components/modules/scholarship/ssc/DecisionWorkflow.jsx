import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  MessageSquare,
  Edit,
  Send,
  AlertTriangle,
  Users,
  Calendar,
  Star
} from 'lucide-react';

function DecisionWorkflow() {
  const [decisions, setDecisions] = useState([]);
  const [filteredDecisions, setFilteredDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    const loadDecisions = async () => {
      try {
        setLoading(true);
        setError('');

        // Mock data - replace with actual API calls
        const mockDecisions = [
          {
            id: 'DEC-2024-001',
            applicationId: 'APP-2024-001',
            studentName: 'Juan Dela Cruz',
            decision: 'pending',
            decisionType: 'approve',
            score: 8.5,
            comments: 'Excellent academic performance and strong financial need.',
            decisionMaker: 'Dr. Maria Santos',
            decisionDate: '2024-01-15',
            approvalLevel: 'individual',
            requiresSignature: true,
            digitalSignature: null,
            committeeVote: null,
            finalStatus: 'pending_committee'
          },
          {
            id: 'DEC-2024-002',
            applicationId: 'APP-2024-002',
            studentName: 'Maria Garcia',
            decision: 'approved',
            decisionType: 'approve',
            score: 7.8,
            comments: 'Good academic standing with moderate financial need.',
            decisionMaker: 'Prof. Juan Cruz',
            decisionDate: '2024-01-14',
            approvalLevel: 'committee',
            requiresSignature: true,
            digitalSignature: 'signed',
            committeeVote: { approve: 5, reject: 1, abstain: 0 },
            finalStatus: 'approved'
          },
          {
            id: 'DEC-2024-003',
            applicationId: 'APP-2024-003',
            studentName: 'Pedro Santos',
            decision: 'rejected',
            decisionType: 'reject',
            score: 6.2,
            comments: 'Does not meet minimum requirements for this category.',
            decisionMaker: 'Dr. Ana Reyes',
            decisionDate: '2024-01-13',
            approvalLevel: 'individual',
            requiresSignature: true,
            digitalSignature: 'signed',
            committeeVote: null,
            finalStatus: 'rejected'
          }
        ];

        setDecisions(mockDecisions);
        setFilteredDecisions(mockDecisions);
      } catch (err) {
        setError('Failed to load decisions');
        console.error('Error loading decisions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDecisions();
  }, []);

  useEffect(() => {
    let filtered = decisions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(decision =>
        decision.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.decisionMaker.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(decision => decision.finalStatus === statusFilter);
    }

    setFilteredDecisions(filtered);
  }, [decisions, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending_committee: 'bg-blue-100 text-blue-800',
      pending_signature: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.pending;
  };

  const getDecisionTypeColor = (type) => {
    const colors = {
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      for_review: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || colors.for_review;
  };

  const getApprovalLevelColor = (level) => {
    const colors = {
      individual: 'bg-blue-100 text-blue-800',
      committee: 'bg-purple-100 text-purple-800',
      chairperson: 'bg-orange-100 text-orange-800'
    };
    return colors[level] || colors.individual;
  };

  const handleMakeDecision = (decision) => {
    setSelectedDecision(decision);
    setShowDecisionModal(true);
  };

  const handleDigitalSignature = (decision) => {
    setSelectedDecision(decision);
    setShowSignatureModal(true);
  };

  const handleVote = (decisionId, vote) => {
    // Handle committee voting
    console.log(`Voting ${vote} for decision ${decisionId}`);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Decision Workflow</h1>
        <p className="text-gray-600">Manage application decisions and committee approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Decisions</p>
              <p className="text-2xl font-bold text-gray-900">
                {decisions.filter(d => d.finalStatus === 'pending_committee').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {decisions.filter(d => d.finalStatus === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {decisions.filter(d => d.finalStatus === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Edit className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Signature</p>
              <p className="text-2xl font-bold text-gray-900">
                {decisions.filter(d => d.requiresSignature && !d.digitalSignature).length}
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
              placeholder="Search decisions..."
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
              <option value="pending_committee">Pending Committee</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Decisions ({filteredDecisions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Decision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Decision Maker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDecisions.map((decision) => (
                <tr key={decision.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{decision.studentName}</div>
                      <div className="text-sm text-gray-500">{decision.applicationId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDecisionTypeColor(decision.decisionType)}`}>
                      {decision.decisionType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{decision.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {decision.decisionMaker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getApprovalLevelColor(decision.approvalLevel)}`}>
                      {decision.approvalLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(decision.finalStatus)}`}>
                      {decision.finalStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMakeDecision(decision)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Make Decision"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {decision.requiresSignature && !decision.digitalSignature && (
                        <button
                          onClick={() => handleDigitalSignature(decision)}
                          className="text-green-600 hover:text-green-900"
                          title="Digital Signature"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {decision.approvalLevel === 'committee' && decision.committeeVote && (
                        <button
                          onClick={() => handleVote(decision.id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                          title="Vote Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDecisions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No decisions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedDecision && createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Make Decision - {selectedDecision.studentName}
              </h3>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Decision</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="for_review">For Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments & Justification</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your decision rationale..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Digital Signature Modal */}
      {showSignatureModal && selectedDecision && createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Digital Signature</h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                By signing this decision, you confirm that you have reviewed the application
                and agree with the decision made.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Draw your signature here</p>
                  <canvas className="w-full h-20 border border-gray-200 rounded mt-2"></canvas>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Sign Decision
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DecisionWorkflow;
