import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  CheckSquare,
  Square,
  Send,
  Eye,
  AlertCircle,
  Grid3X3,
  List
} from 'lucide-react';
import BatchProcessingModal from '../components/BatchProcessingModal';
import DisbursementDetailModal from '../components/DisbursementDetailModal';

const PendingDisbursements = () => {
  const [disbursements, setDisbursements] = useState([]);
  const [filteredDisbursements, setFilteredDisbursements] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    school: '',
    scholarshipType: '',
    priority: '',
  });
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  useEffect(() => {
    fetchPendingDisbursements();
  }, []);

  useEffect(() => {
    filterDisbursements();
  }, [searchTerm, filters, disbursements]);

  const fetchPendingDisbursements = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/disbursements/pending');
      // const data = await response.json();
      
      // Mock data
      const mockData = [
        {
          id: 1,
          scholarId: 'SCH-2024-001',
          scholarName: 'Juan Dela Cruz',
          schoolName: 'University of the Philippines',
          scholarshipType: 'Merit-Based',
          amount: 50000,
          semester: '1st Semester 2024',
          approvalDate: '2024-10-01',
          priority: 'Normal',
        },
        {
          id: 2,
          scholarId: 'SCH-2024-002',
          scholarName: 'Maria Santos',
          schoolName: 'Ateneo de Manila University',
          scholarshipType: 'Need-Based',
          amount: 45000,
          semester: '1st Semester 2024',
          approvalDate: '2024-10-02',
          priority: 'Urgent',
        },
        {
          id: 3,
          scholarId: 'SCH-2024-003',
          scholarName: 'Pedro Reyes',
          schoolName: 'De La Salle University',
          scholarshipType: 'Merit-Based',
          amount: 48000,
          semester: '1st Semester 2024',
          approvalDate: '2024-10-03',
          priority: 'Normal',
        },
        {
          id: 4,
          scholarId: 'SCH-2024-004',
          scholarName: 'Ana Garcia',
          schoolName: 'University of Santo Tomas',
          scholarshipType: 'Sports',
          amount: 40000,
          semester: '1st Semester 2024',
          approvalDate: '2024-10-04',
          priority: 'Urgent',
        },
        {
          id: 5,
          scholarId: 'SCH-2024-005',
          scholarName: 'Jose Tan',
          schoolName: 'Polytechnic University of the Philippines',
          scholarshipType: 'Academic Excellence',
          amount: 35000,
          semester: '1st Semester 2024',
          approvalDate: '2024-10-05',
          priority: 'Normal',
        },
      ];
      
      setDisbursements(mockData);
      setFilteredDisbursements(mockData);
    } catch (error) {
      console.error('Error fetching pending disbursements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDisbursements = () => {
    let filtered = [...disbursements];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.scholarName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scholarId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // School filter
    if (filters.school) {
      filtered = filtered.filter(item => item.schoolName === filters.school);
    }

    // Scholarship type filter
    if (filters.scholarshipType) {
      filtered = filtered.filter(item => item.scholarshipType === filters.scholarshipType);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }

    setFilteredDisbursements(filtered);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredDisbursements.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredDisbursements.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleProcessBatch = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to process');
      return;
    }
    setShowBatchModal(true);
  };

  const handleViewDetails = (disbursement) => {
    setSelectedDisbursement(disbursement);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSelectedTotal = () => {
    return disbursements
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const uniqueSchools = [...new Set(disbursements.map(d => d.schoolName))];
  const uniqueTypes = [...new Set(disbursements.map(d => d.scholarshipType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by scholar name, ID, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filters.school}
              onChange={(e) => setFilters({ ...filters, school: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Schools</option>
              {uniqueSchools.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>

            <select
              value={filters.scholarshipType}
              onChange={(e) => setFilters({ ...filters, scholarshipType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <span className="text-sm text-blue-700">
                Total: <strong>{formatCurrency(getSelectedTotal())}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleProcessBatch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Process Selected
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button onClick={handleSelectAll}>
                      {selectedItems.length === filteredDisbursements.length && filteredDisbursements.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scholar ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scholar Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p>No pending disbursements found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDisbursements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button onClick={() => handleSelectItem(item.id)}>
                          {selectedItems.includes(item.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.scholarId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.scholarName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.schoolName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.scholarshipType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.approvalDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.priority === 'Urgent' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisbursements.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg">No pending disbursements found</p>
            </div>
          ) : (
            filteredDisbursements.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header with checkbox */}
                <div className="flex items-start justify-between mb-4">
                  <button onClick={() => handleSelectItem(item.id)}>
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.priority === 'Urgent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                {/* Scholar Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.scholarName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.scholarId}</p>
                  <p className="text-sm text-gray-500">{item.schoolName}</p>
                </div>

                {/* Scholarship Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">{item.scholarshipType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Semester:</span>
                    <span className="text-sm text-gray-900">{item.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved:</span>
                    <span className="text-sm text-gray-900">{formatDate(item.approvalDate)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewDetails(item)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Pending Disbursements</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {filteredDisbursements.length} scholarships
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(filteredDisbursements.reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBatchModal && (
        <BatchProcessingModal
          selectedItems={selectedItems}
          disbursements={disbursements}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false);
            setSelectedItems([]);
            fetchPendingDisbursements();
          }}
        />
      )}

      {showDetailModal && selectedDisbursement && (
        <DisbursementDetailModal
          disbursement={selectedDisbursement}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default PendingDisbursements;

