import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,

  PhilippinePeso,
  Grid3X3,
  List,
  Lock,
  RefreshCw,
  X,
  FileBarChart
} from 'lucide-react';

const DisbursementHistory = () => {
  // Define interface for data items
  interface Disbursement {
    id: string;
    scholarName: string;
    schoolName: string;
    amount: number;
    method: string;
    disbursementDate: string;
    referenceNumber: string;
    status: string;
  }

  const [history, setHistory] = useState<Disbursement[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Disbursement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    school: '',
    status: '',
    method: '',
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [password, setPassword] = useState('');
  const [exporting, setExporting] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [searchTerm, filters, history]);

  const fetchHistory = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/disbursements/history');
      // const data = await response.json();

      // Mock data
      const mockData: Disbursement[] = [
        {
          id: 'DISB-2024-101',
          scholarName: 'Carlos Mendoza',
          schoolName: 'University of the Philippines',
          amount: 50000,
          method: 'Bank Transfer',
          disbursementDate: '2024-10-10',
          referenceNumber: 'REF-UP-2024-001',
          status: 'Completed',
        },
        {
          id: 'DISB-2024-102',
          scholarName: 'Lisa Aquino',
          schoolName: 'Ateneo de Manila University',
          amount: 45000,
          method: 'Bank Transfer',
          disbursementDate: '2024-10-09',
          referenceNumber: 'REF-ADMU-2024-001',
          status: 'Completed',
        },
        {
          id: 'DISB-2024-103',
          scholarName: 'Roberto Cruz',
          schoolName: 'De La Salle University',
          amount: 48000,
          method: 'Check',
          disbursementDate: '2024-10-08',
          referenceNumber: 'CHK-DLSU-2024-001',
          status: 'Pending Confirmation',
        },
        {
          id: 'DISB-2024-104',
          scholarName: 'Sofia Reyes',
          schoolName: 'University of Santo Tomas',
          amount: 40000,
          method: 'Bank Transfer',
          disbursementDate: '2024-10-07',
          referenceNumber: 'REF-UST-2024-001',
          status: 'Failed',
        },
        {
          id: 'DISB-2024-105',
          scholarName: 'Miguel Torres',
          schoolName: 'Polytechnic University of the Philippines',
          amount: 35000,
          method: 'Bank Transfer',
          disbursementDate: '2024-10-06',
          referenceNumber: 'REF-PUP-2024-001',
          status: 'Completed',
        },
      ];

      setHistory(mockData);
      setFilteredHistory(mockData);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.scholarName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item.disbursementDate) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(item =>
        new Date(item.disbursementDate) <= new Date(filters.dateTo)
      );
    }

    // School filter
    if (filters.school) {
      filtered = filtered.filter(item => item.schoolName === filters.school);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Method filter
    if (filters.method) {
      filtered = filtered.filter(item => item.method === filters.method);
    }

    setFilteredHistory(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pending Confirmation':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Reversed':
        return <RotateCcw className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending Confirmation': 'bg-yellow-100 text-yellow-800',
      'Failed': 'bg-red-100 text-red-800',
      'Reversed': 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    setExporting(true);
    try {
      // Client-side PDF generation with encryption support

      // Dynamically import jsPDF
      const jspdfModule = await import('jspdf');
      const jspdfAny = jspdfModule as any;

      // Robust constructor detection
      let JsPDFConstructor;
      if (typeof jspdfAny.jsPDF === 'function') {
        JsPDFConstructor = jspdfAny.jsPDF;
      } else if (typeof jspdfAny.default === 'function') {
        JsPDFConstructor = jspdfAny.default;
      } else if (jspdfAny.default && typeof jspdfAny.default.jsPDF === 'function') {
        JsPDFConstructor = jspdfAny.default.jsPDF;
      } else if (jspdfAny.default && typeof jspdfAny.default.default === 'function') {
        JsPDFConstructor = jspdfAny.default.default;
      } else {
        throw new Error('Failed to locate jsPDF constructor');
      }

      // Import autotable plugin
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule.applyPlugin || autoTableModule;

      // Configure PDF options
      const pdfOptions: any = { orientation: 'landscape' };
      if (password) {
        pdfOptions.encryption = {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ["print", "modify", "copy", "annot-forms"]
        };
      }

      const doc = new JsPDFConstructor(pdfOptions);

      // Apply plugin
      if (typeof autoTable === 'function' && !(doc as any).autoTable) {
        try {
          (autoTable as any).default?.(doc) || (autoTable as any)(doc);
        } catch (e: any) {
          console.log('autoTable plugin application attempt:', e.message);
        }
      }

      const timestamp = new Date().toLocaleString();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("Disbursement History Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${timestamp}`, 14, 28);
      doc.text(`Records: ${filteredHistory.length}`, 14, 33);

      doc.setLineWidth(0.5);
      doc.line(14, 38, 283, 38);

      const tableRows = filteredHistory.map(item => [
        item.id,
        item.scholarName,
        item.schoolName,
        formatCurrency(item.amount),
        item.method,
        formatDate(item.disbursementDate),
        item.referenceNumber,
        item.status
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['ID', 'Scholar', 'School', 'Amount', 'Method', 'Date', 'Ref #', 'Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 14, 200);
        doc.text("Confidential - School Aid Module", 283, 200, { align: 'right' });
      }

      doc.save(`disbursement_history_${new Date().toISOString().split('T')[0]}.pdf`);

      setShowExportModal(false);
      setPassword('');

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const uniqueSchools = [...new Set(history.map(h => h.schoolName))];
  const uniqueStatuses = [...new Set(history.map(h => h.status))];
  const uniqueMethods = [...new Set(history.map(h => h.method))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by scholar name, ID, school, or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School
              </label>
              <select
                value={filters.school}
                onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Schools</option>
                {uniqueSchools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={filters.method}
                onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {uniqueMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setFilters({ dateFrom: '', dateTo: '', school: '', status: '', method: '' })}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <List className="w-4 h-4" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Grid
                </button>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Export data"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Display */}
      {viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disbursement ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scholar Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference #
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
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-400 mb-2" />
                        <p>No disbursement history found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.scholarName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(item.disbursementDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {item.referenceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
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
          {filteredHistory.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg">No disbursement history found</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header with Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.id}</span>
                </div>

                {/* Scholar Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.scholarName}</h3>
                </div>

                {/* Disbursement Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Method:</span>
                    <span className="text-sm text-gray-900">{item.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(item.disbursementDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reference:</span>
                    <span className="text-sm font-mono text-gray-900">{item.referenceNumber}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredHistory.filter(h => h.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredHistory.filter(h => h.status === 'Pending Confirmation').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-xl font-bold text-gray-900">
                {filteredHistory.filter(h => h.status === 'Failed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(filteredHistory.reduce((sum, h) => sum + h.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
                  <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${reportFormat === 'pdf'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        onClick={() => setReportFormat('pdf')}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">PDF Document</span>
                      </button>
                      <button
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${reportFormat === 'csv'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        onClick={() => setReportFormat('csv')}
                      >
                        <FileBarChart className="w-5 h-5" />
                        <span className="font-medium">Excel / CSV</span>
                      </button>
                    </div>
                  </div>

                  {reportFormat === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Protection (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password to encrypt PDF"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                        />
                        <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank for an unprotected PDF.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Report
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
export default DisbursementHistory;

