import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Calendar,
  User,
  Settings,
  BarChart3,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

function PolicyGuidelines() {
  const [policies, setPolicies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('policies');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Mock data - replace with actual API calls
        const mockPolicies = [
          {
            id: 'POL-001',
            title: 'Scholarship Eligibility Criteria 2024',
            version: '2.1',
            category: 'Eligibility',
            uploadDate: '2024-01-15',
            uploadedBy: 'Dr. Maria Santos',
            status: 'active',
            fileSize: '2.3 MB',
            downloads: 45,
            description: 'Updated eligibility criteria for academic year 2024-2025'
          },
          {
            id: 'POL-002',
            title: 'Financial Need Assessment Guidelines',
            version: '1.8',
            category: 'Financial',
            uploadDate: '2024-01-10',
            uploadedBy: 'Prof. Juan Cruz',
            status: 'active',
            fileSize: '1.8 MB',
            downloads: 32,
            description: 'Guidelines for assessing financial need of applicants'
          },
          {
            id: 'POL-003',
            title: 'Appeal Process Procedures',
            version: '1.5',
            category: 'Appeals',
            uploadDate: '2024-01-05',
            uploadedBy: 'Dr. Ana Reyes',
            status: 'draft',
            fileSize: '1.2 MB',
            downloads: 18,
            description: 'Step-by-step procedures for handling appeals'
          }
        ];

        const mockTemplates = [
          {
            id: 'TMP-001',
            name: 'Academic Excellence Evaluation',
            category: 'Academic',
            criteria: [
              { name: 'GWA', weight: 40, minScore: 1.5, maxScore: 1.0 },
              { name: 'Leadership', weight: 25, minScore: 7, maxScore: 10 },
              { name: 'Extracurricular', weight: 20, minScore: 6, maxScore: 10 },
              { name: 'Interview', weight: 15, minScore: 7, maxScore: 10 }
            ],
            createdBy: 'Dr. Maria Santos',
            createdDate: '2024-01-12',
            status: 'active',
            usage: 23
          },
          {
            id: 'TMP-002',
            name: 'Financial Need Assessment',
            category: 'Financial',
            criteria: [
              { name: 'Family Income', weight: 50, minScore: 1, maxScore: 10 },
              { name: 'Family Size', weight: 20, minScore: 1, maxScore: 10 },
              { name: 'Other Dependents', weight: 15, minScore: 1, maxScore: 10 },
              { name: 'Special Circumstances', weight: 15, minScore: 1, maxScore: 10 }
            ],
            createdBy: 'Prof. Juan Cruz',
            createdDate: '2024-01-08',
            status: 'active',
            usage: 18
          }
        ];

        const mockAuditTrail = [
          {
            id: 'AUD-001',
            action: 'Policy Updated',
            policyTitle: 'Scholarship Eligibility Criteria 2024',
            user: 'Dr. Maria Santos',
            timestamp: '2024-01-15T14:30:00Z',
            changes: 'Updated minimum GWA requirement from 1.75 to 1.5',
            ipAddress: '192.168.1.100'
          },
          {
            id: 'AUD-002',
            action: 'Template Created',
            policyTitle: 'Financial Need Assessment',
            user: 'Prof. Juan Cruz',
            timestamp: '2024-01-08T10:15:00Z',
            changes: 'Created new evaluation template for financial need',
            ipAddress: '192.168.1.101'
          },
          {
            id: 'AUD-003',
            action: 'Policy Deleted',
            policyTitle: 'Old Eligibility Criteria 2023',
            user: 'Dr. Ana Reyes',
            timestamp: '2024-01-05T16:45:00Z',
            changes: 'Archived outdated policy document',
            ipAddress: '192.168.1.102'
          }
        ];

        setPolicies(mockPolicies);
        setTemplates(mockTemplates);
        setAuditTrail(mockAuditTrail);
      } catch (err) {
        setError('Failed to load policy data');
        console.error('Error loading policy data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  const getCategoryColor = (category) => {
    const colors = {
      Eligibility: 'bg-blue-100 text-blue-800',
      Financial: 'bg-green-100 text-green-800',
      Appeals: 'bg-orange-100 text-orange-800',
      Academic: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || colors.Eligibility;
  };

  const handleUploadPolicy = () => {
    setShowUploadModal(true);
  };

  const handleCreateTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
  };

  const handleDownloadPolicy = (policyId) => {
    console.log(`Downloading policy ${policyId}`);
  };

  const handleDeletePolicy = (policyId) => {
    console.log(`Deleting policy ${policyId}`);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy & Guidelines Management</h1>
        <p className="text-gray-600">Manage SSC policies, evaluation templates, and audit trails</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'policies', label: 'Policies', count: policies.length },
            { id: 'templates', label: 'Templates', count: templates.length },
            { id: 'audit', label: 'Audit Trail', count: auditTrail.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div>
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleUploadPolicy}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Policy
            </button>
          </div>

          {/* Policies List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Policy Documents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{policy.title}</div>
                          <div className="text-sm text-gray-500">{policy.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(policy.category)}`}>
                          {policy.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        v{policy.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                          {policy.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {policy.uploadedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {policy.downloads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPolicy(policy)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Policy"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPolicy(policy.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(template.status)}`}>
                    {template.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Category:</span> {template.category}</p>
                  <p><span className="font-medium">Created by:</span> {template.createdBy}</p>
                  <p><span className="font-medium">Usage:</span> {template.usage} times</p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Evaluation Criteria</h4>
                  <div className="space-y-1">
                    {template.criteria.map((criterion, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{criterion.name}</span>
                        <span className="font-medium">{criterion.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm">
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700 text-sm">
                    <Eye className="h-4 w-4 inline mr-1" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Decision Audit Trail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy/Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditTrail.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {audit.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {audit.policyTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {audit.user}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {audit.changes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(audit.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {audit.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Policy Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Policy Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter policy title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  <option value="Eligibility">Eligibility</option>
                  <option value="Financial">Financial</option>
                  <option value="Appeals">Appeals</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter policy description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PolicyGuidelines;
