import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, Calendar, PhilippinePeso, User, School, X, ExternalLink, FileDown } from 'lucide-react';
import { DisbursementHistoryRecord, PaymentMethod } from './types';
import { schoolAidService } from './services/schoolAidService';
import { API_CONFIG } from '../../../../config/api';

const DisbursementHistory: React.FC = () => {
  const [records, setRecords] = useState<DisbursementHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'disbursedAt' | 'amount'>('disbursedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<DisbursementHistoryRecord | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [searchTerm, methodFilter, dateFrom, dateTo, sortBy, sortDir]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const filters: {
        search?: string;
        method?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortDir?: 'asc' | 'desc';
      } = {};

      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (methodFilter !== 'all') {
        filters.method = methodFilter;
      }
      if (dateFrom) {
        filters.dateFrom = dateFrom;
      }
      if (dateTo) {
        filters.dateTo = dateTo;
      }
      filters.sortBy = sortBy === 'disbursedAt' ? 'disbursed_at' : 'amount';
      filters.sortDir = sortDir;

      const data = await schoolAidService.getDisbursementHistory(filters);
      setRecords(data);
    } catch (error) {
      console.error('Error fetching disbursement history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (column: 'disbursedAt' | 'amount') => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = 'School Aid Disbursement History';

    const rows = records.map(record => `
      <tr>
        <td>${record.applicationNumber ?? ''}</td>
        <td>${record.studentName ?? ''}</td>
        <td>${formatCurrency(record.amount)}</td>
        <td>${record.method}</td>
        <td>${record.providerName}</td>
        <td>${record.referenceNumber}</td>
        <td>${record.disbursedByName ?? (record.disbursedByUserId ? 'User #' + record.disbursedByUserId : '')}</td>
        <td>${formatDateTime(record.disbursedAt)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Application No.</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Provider</th>
                <th>Reference</th>
                <th>Disbursed By</th>
                <th>Disbursed At</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleViewDetails = (record: DisbursementHistoryRecord) => {
    setSelectedRecord(record);
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const getReceiptUrl = (record: DisbursementHistoryRecord) => {
    if (!record.receiptPath) return null;
    if (record.id) {
      return `${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/disbursements/${record.id}/receipt`;
    }
    if (record.receiptPath.startsWith('http://') || record.receiptPath.startsWith('https://')) {
      return record.receiptPath;
    }
    return `${API_CONFIG.AID_SERVICE.BASE_URL}${record.receiptPath}`;
  };

  const getReceiptDownloadUrl = (record: DisbursementHistoryRecord) => {
    if (!record.receiptPath || !record.id) return null;
    return `${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/disbursements/${record.id}/receipt/download`;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Disbursement History
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            View and export the complete history of scholarship aid disbursements.
          </p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student, school, application no., or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Method filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
            >
              <option value="all">All methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="paymaya">PayMaya</option>
              <option value="check">Check</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          {/* Export */}
          <div>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  <span className="ml-1 text-gray-400">
                    {sortBy === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort('disbursedAt')}
                >
                  Disbursed At
                  <span className="ml-1 text-gray-400">
                    {sortBy === 'disbursedAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.applicationNumber}
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
                          {record.studentName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(record.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white capitalize">
                      <PhilippinePeso className="w-4 h-4 mr-1 text-gray-400 dark:text-slate-400" />
                      {(record.method as PaymentMethod)?.replace('_', ' ') || 'Bank Transfer'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(record.disbursedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(record)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-full text-xs font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400">
              <PhilippinePeso className="w-12 h-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No disbursements found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        )}
      </div>
      {selectedRecord && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Disbursement Details
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Application {selectedRecord.applicationNumber ?? selectedRecord.applicationId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  Student
                </div>
                <div className="text-gray-900 dark:text-white">
                  {selectedRecord.studentName || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  School
                </div>
                <div className="text-gray-900 dark:text-white">
                  {selectedRecord.schoolName || '—'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Amount
                  </div>
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(selectedRecord.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Method
                  </div>
                  <div className="text-gray-900 dark:text-white capitalize">
                    {(selectedRecord.method as PaymentMethod)?.replace('_', ' ') || 'Bank Transfer'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Provider
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedRecord.providerName || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Reference
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedRecord.referenceNumber || '—'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Account Number
                  </div>
                  <div className="text-gray-900 dark:text-white font-mono">
                    {selectedRecord.accountNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Disbursed By
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedRecord.disbursedByName ??
                      (selectedRecord.disbursedByUserId
                        ? `User #${selectedRecord.disbursedByUserId}`
                        : '—')}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Disbursed By
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedRecord.disbursedByName ??
                      (selectedRecord.disbursedByUserId
                        ? `User #${selectedRecord.disbursedByUserId}`
                        : '—')}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Disbursed At
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {formatDateTime(selectedRecord.disbursedAt) || '—'}
                  </div>
                </div>
              </div>
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Notes
                  </div>
                  <div className="text-gray-900 dark:text-white whitespace-pre-line">
                    {selectedRecord.notes}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  Receipt
                </div>
                {getReceiptUrl(selectedRecord) ? (
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={getReceiptUrl(selectedRecord) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </a>
                    <a
                      href={getReceiptDownloadUrl(selectedRecord) || '#'}
                      download
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </a>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-slate-400">
                    No receipt available
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetails}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementHistory;
