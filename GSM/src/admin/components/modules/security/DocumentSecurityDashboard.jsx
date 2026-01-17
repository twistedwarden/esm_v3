import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings
} from 'lucide-react';
import { getScholarshipServiceUrl } from '../../../../config/api';

const DocumentSecurityDashboard = ({ activeItem = 'security-dashboard' }) => {
  const [statistics, setStatistics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [quarantine, setQuarantine] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set active tab based on activeItem
  const getActiveTab = () => {
    switch (activeItem) {
      case 'security':
      case 'security-dashboard':
        return 'overview';
      case 'security-threats':
        return 'logs';
      case 'security-quarantine':
        return 'quarantine';
      case 'security-settings':
        return 'settings';
      default:
        return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [filters, setFilters] = useState({
    days: 30,
    status: 'all',
    threat: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch data
  const SCHOLARSHIP_API = getScholarshipServiceUrl('/api');

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${SCHOLARSHIP_API}/virus-scan/statistics?days=${filters.days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.threat) params.append('threat', filters.threat);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await fetch(`${SCHOLARSHIP_API}/virus-scan/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchQuarantine = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.threat) params.append('threat', filters.threat);

      const response = await fetch(`${SCHOLARSHIP_API}/virus-scan/quarantine?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setQuarantine(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching quarantine:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStatistics(), fetchLogs(), fetchQuarantine()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'infected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'not_scanned':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'clean':
        return 'text-green-600 bg-green-100';
      case 'infected':
        return 'text-red-600 bg-red-100';
      case 'not_scanned':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScannerHealthColor = (percentage) => {
    if (percentage > 90) return 'text-green-600';
    if (percentage > 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-xs sm:text-sm">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
          )}
          <span className={`${trend > 0 ? 'text-green-600' : 'text-red-600'} truncate`}>
            {Math.abs(trend)}% from last period
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center h-64 space-y-2 sm:space-y-0">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-orange-500" />
          <span className="text-sm sm:text-base text-gray-600 text-center">Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Document Security Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Monitor virus scans and security threats</p>
          </div>
        </div>
        <button
          onClick={fetchAllData}
          className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
              className="w-full px-2 py-2 sm:px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2 py-2 sm:px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="clean">Clean</option>
              <option value="infected">Infected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Threat</label>
            <input
              type="text"
              placeholder="Search threat..."
              value={filters.threat}
              onChange={(e) => setFilters({ ...filters, threat: e.target.value })}
              className="w-full px-2 py-2 sm:px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-2 py-2 sm:px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-2 py-2 sm:px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-col sm:flex-row sm:space-x-8 overflow-x-auto">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'logs', name: 'Scan Logs', icon: FileText },
            { id: 'quarantine', name: 'Quarantine', icon: AlertTriangle },
            { id: 'settings', name: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:justify-start space-x-2 py-3 sm:py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap min-w-0 ${activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && statistics && (
        <div className="space-y-4 sm:space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Scans"
              value={statistics.overview.total_scans.toLocaleString()}
              icon={Activity}
              color="text-blue-600"
              subtitle={`Last ${filters.days} days`}
            />
            <StatCard
              title="Clean Files"
              value={statistics.overview.clean_scans.toLocaleString()}
              icon={CheckCircle}
              color="text-green-600"
              subtitle={`${statistics.overview.clean_percentage}% clean rate`}
            />
            <StatCard
              title="Threats Blocked"
              value={statistics.overview.infected_scans.toLocaleString()}
              icon={AlertTriangle}
              color="text-red-600"
              subtitle="Malicious files detected"
            />
            <StatCard
              title="Avg Scan Time"
              value={`${statistics.overview.avg_scan_time}s`}
              icon={Clock}
              color="text-purple-600"
              subtitle="Performance metric"
            />
          </div>

          {/* Scanner Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanner Health</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`text-3xl font-bold ${getScannerHealthColor(statistics.scanner_health.uptime_percentage)}`}>
                  {statistics.scanner_health.uptime_percentage}%
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Uptime</p>
                  <p className="text-xs text-gray-500">
                    {statistics.scanner_health.recent_scans} scans in last 24h
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${statistics.scanner_health.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : statistics.scanner_health.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                {statistics.scanner_health.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Threat Breakdown */}
          {statistics.threat_breakdown && statistics.threat_breakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Breakdown</h3>
              <div className="space-y-3">
                {statistics.threat_breakdown.map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-gray-900">{threat.threat_name}</span>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {threat.count} detections
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Scan Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.file_name}</div>
                          <div className="text-sm text-gray-500">{log.mime_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.is_clean ? 'clean' : 'infected')}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.is_clean ? 'clean' : 'infected')}`}>
                          {log.is_clean ? 'Clean' : 'Infected'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.threat_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.scan_duration ? `${log.scan_duration}s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.first_name} {log.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quarantine Tab */}
      {activeTab === 'quarantine' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quarantined Files</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarantined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quarantine.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.file_name}</div>
                          <div className="text-sm text-gray-500">{item.mime_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        {item.threat_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.first_name} {item.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.quarantined_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_reviewed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {item.is_reviewed ? 'Reviewed' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-orange-600 hover:text-orange-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
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
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Configuration</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="clamd">ClamAV Daemon (Recommended)</option>
                    <option value="clamscan">ClamAV CLI</option>
                    <option value="virustotal">VirusTotal API</option>
                    <option value="defender">Windows Defender</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scan Timeout (seconds)</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fallback Policy</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="reject">Reject (Recommended)</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Allowed File Types</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">PDF Documents</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">JPEG Images</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">PNG Images</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Word Documents</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Scanner Health</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Scanner is healthy and operational</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Last virus definition update: 2 hours ago
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Save Configuration
                </button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                  Test Scanner
                </button>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  Update Definitions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSecurityDashboard;
