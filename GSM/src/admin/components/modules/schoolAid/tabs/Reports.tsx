import React, { useState } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  Mail,
  Printer
} from 'lucide-react';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [filters, setFilters] = useState({
    school: '',
    groupBy: 'school',
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    {
      id: 'disbursement-summary',
      name: 'Disbursement Summary Report',
      description: 'Overview of all disbursements within a date range',
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'school-distribution',
      name: 'School Distribution Report',
      description: 'Per-school breakdown of disbursements and scholars',
      icon: FileText,
      color: 'green',
    },
    {
      id: 'scholar-payment',
      name: 'Scholar Payment Report',
      description: 'Individual scholar payment history and details',
      icon: FileSpreadsheet,
      color: 'purple',
    },
    {
      id: 'financial-reconciliation',
      name: 'Financial Reconciliation Report',
      description: 'Fund sources, allocations, and balance reconciliation',
      icon: FileText,
      color: 'orange',
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail Report',
      description: 'Complete transaction logs and user actions',
      icon: FileText,
      color: 'red',
    },
  ];

  const handleGenerateReport = async (format) => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setGenerating(true);
    try {
      // TODO: Implement actual report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Generating report:', selectedReport, format, dateRange, filters);
      alert(`Report generated successfully! Format: ${format}`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const ReportCard = ({ report }) => {
    const Icon = report.icon;
    const isSelected = selectedReport === report.id;
    
    return (
      <button
        onClick={() => setSelectedReport(report.id)}
        className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
          isSelected
            ? `border-${report.color}-500 bg-${report.color}-50`
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            isSelected ? `bg-${report.color}-100` : 'bg-gray-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              isSelected ? `text-${report.color}-600` : 'text-gray-600'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{report.name}</h4>
            <p className="text-sm text-gray-600">{report.description}</p>
          </div>
          {isSelected && (
            <div className={`w-6 h-6 rounded-full bg-${report.color}-500 flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
        </div>
        <p className="text-sm text-gray-600">
          Create comprehensive reports for disbursement tracking, financial analysis, and auditing
        </p>
      </div>

      {/* Report Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      {selectedReport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Report Configuration</h3>
          
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by School
                </label>
                <select
                  value={filters.school}
                  onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Schools</option>
                  <option value="UP">University of the Philippines</option>
                  <option value="ADMU">Ateneo de Manila University</option>
                  <option value="DLSU">De La Salle University</option>
                  <option value="UST">University of Santo Tomas</option>
                  <option value="PUP">Polytechnic University of the Philippines</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group By
                </label>
                <select
                  value={filters.groupBy}
                  onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="school">School</option>
                  <option value="type">Scholarship Type</option>
                  <option value="month">Month</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleGenerateReport('pdf')}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  PDF
                </button>
                <button
                  onClick={() => handleGenerateReport('excel')}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Excel
                </button>
                <button
                  onClick={() => handleGenerateReport('csv')}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-5 h-5" />
                  CSV
                </button>
                <button
                  onClick={() => handleGenerateReport('print')}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>

            {/* Additional Options */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-gray-500" />
                Email report to my address
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports / Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        
        <div className="space-y-3">
          {[
            {
              name: 'October 2024 Disbursement Summary',
              type: 'PDF',
              date: '2024-10-15',
              size: '2.4 MB',
            },
            {
              name: 'Q3 2024 Financial Reconciliation',
              type: 'Excel',
              date: '2024-10-01',
              size: '1.8 MB',
            },
            {
              name: 'School Distribution Report - September',
              type: 'PDF',
              date: '2024-09-30',
              size: '3.1 MB',
            },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-500">
                    {report.type} • {report.date} • {report.size}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generating Overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">Generating Report...</p>
              <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

