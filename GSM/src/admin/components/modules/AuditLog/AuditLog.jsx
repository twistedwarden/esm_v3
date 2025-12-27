import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    Eye, 
    Calendar,
    User,
    Shield,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    RefreshCw
} from 'lucide-react';
import { LoadingData } from '../../ui/LoadingSpinner';
import axios from 'axios';
import { getScholarshipServiceUrl } from '../../../../config/api';

const SCHOLARSHIP_API = getScholarshipServiceUrl('/api');

// Mock data generation function
const generateMockAuditLogs = () => {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'];
    const userRoles = ['Admin', 'User', 'Moderator', 'Reviewer'];
    const resourceTypes = ['User', 'Application', 'Document', 'School', 'Student'];
    const statuses = ['success', 'failed', 'error'];
    const users = ['admin@example.com', 'user@example.com', 'moderator@example.com', 'reviewer@example.com'];
    
    return Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        action: actions[Math.floor(Math.random() * actions.length)],
        user_email: users[Math.floor(Math.random() * users.length)],
        user_role: userRoles[Math.floor(Math.random() * userRoles.length)],
        description: `Sample audit log entry ${i + 1}`,
        resource_type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        resource_id: Math.floor(Math.random() * 1000) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        old_values: i % 2 === 0 ? { field: 'old_value' } : null,
        new_values: i % 2 === 0 ? { field: 'new_value' } : null,
        metadata: { ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0...' },
        error_message: i % 3 === 0 ? 'Sample error message' : null
    }));
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        action: '',
        user_role: '',
        resource_type: '',
        status: '',
        date_from: '',
        date_to: ''
    });
    const [filterOptions, setFilterOptions] = useState({
        actions: [],
        user_roles: [],
        resource_types: [],
        statuses: []
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchFilterOptions();
        fetchStatistics();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [filters, searchTerm, pagination.current_page]);

    const fetchLogs = async () => {
        setLoading(true);
        
        // Use mock data directly instead of making API calls
        setLogs(generateMockAuditLogs());
        setPagination({
            current_page: 1,
            last_page: 1,
            per_page: 25,
            total: 5,
            from: 1,
            to: 5
        });
        setLoading(false);
    };

    const fetchFilterOptions = async () => {
        // Use mock filter options directly instead of making API calls
        setFilterOptions({
            actions: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'],
            user_roles: ['Admin', 'User', 'Moderator', 'Reviewer'],
            resource_types: ['User', 'Application', 'Document', 'School', 'Student'],
            statuses: ['success', 'failed', 'error', 'pending']
        });
    };

    const fetchStatistics = async () => {
        // Use mock statistics directly instead of making API calls
        setStatistics({
            total_logs: 1247,
            by_status: {
                success: 1156,
                failed: 67,
                error: 24
            },
            by_user_role: {
                'Admin': 45,
                'User': 892,
                'Moderator': 234,
                'Reviewer': 76
            }
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({
            ...prev,
            current_page: 1
        }));
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            user_role: '',
            resource_type: '',
            status: '',
            date_from: '',
            date_to: ''
        });
        setSearchTerm('');
        setPagination(prev => ({
            ...prev,
            current_page: 1
        }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({
            ...prev,
            current_page: page
        }));
    };

    const viewLogDetails = (log) => {
        setSelectedLog(log);
        setShowDetails(true);
    };

    const exportLogs = async () => {
        // Export mock data directly instead of making API calls
        const mockData = generateMockAuditLogs();
        const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const getActionBadgeColor = (action) => {
        const colors = {
            'CREATE': 'bg-green-100 text-green-800',
            'UPDATE': 'bg-blue-100 text-blue-800',
            'DELETE': 'bg-red-100 text-red-800',
            'LOGIN': 'bg-purple-100 text-purple-800',
            'LOGOUT': 'bg-gray-100 text-gray-800',
            'VIEW': 'bg-yellow-100 text-yellow-800',
            'EXPORT': 'bg-indigo-100 text-indigo-800',
            'IMPORT': 'bg-pink-100 text-pink-800',
            'SYSTEM': 'bg-orange-100 text-orange-800'
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading && logs.length === 0) {
        return <LoadingData />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Track system activities and user actions</p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                    >
                        <RefreshCw size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Refresh</span>
                        <span className="sm:hidden">Refresh</span>
                    </button>
                    <button
                        onClick={exportLogs}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                        <Download size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Export</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Logs</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {statistics.total_logs?.toLocaleString() || 0}
                                </p>
                            </div>
                            <FileText className="text-blue-500" size={24} />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Success Rate</p>
                                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {statistics.by_status?.success || 0}
                                </p>
                            </div>
                            <CheckCircle className="text-green-500" size={24} />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Failed Actions</p>
                                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {(statistics.by_status?.failed || 0) + (statistics.by_status?.error || 0)}
                                </p>
                            </div>
                            <XCircle className="text-red-500" size={24} />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Active Users</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {Object.keys(statistics.by_user_role || {}).length}
                                </p>
                            </div>
                            <User className="text-purple-500" size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
                <div className="flex flex-col space-y-3 sm:flex-row sm:gap-4 sm:space-y-0">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                        />
                    </div>
                    
                    <select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    >
                        <option value="">All Actions</option>
                        {filterOptions.actions?.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                    
                    <select
                        value={filters.user_role}
                        onChange={(e) => handleFilterChange('user_role', e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Roles</option>
                        {filterOptions.user_roles?.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        {filterOptions.statuses?.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Clear
                    </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 text-gray-400 mr-2" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.user_email || 'System'}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {log.user_role || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                            {log.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {log.resource_type && log.resource_id ? 
                                            `${log.resource_type} #${log.resource_id}` : 
                                            log.resource_type || 'N/A'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getStatusIcon(log.status)}
                                            <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                                                {log.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => viewLogDetails(log)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
                                    <span className="font-medium">{pagination.to || 0}</span> of{' '}
                                    <span className="font-medium">{pagination.total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === pagination.current_page
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            } ${page === 1 ? 'rounded-l-md' : ''} ${page === pagination.last_page ? 'rounded-r-md' : ''}`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Details Modal */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Audit Log Details
                                </h3>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{selectedLog.status}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.user_email || 'System'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.user_role || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {selectedLog.resource_type && selectedLog.resource_id ? 
                                                `${selectedLog.resource_type} #${selectedLog.resource_id}` : 
                                                selectedLog.resource_type || 'N/A'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedLog.created_at)}</p>
                                    </div>
                                </div>
                                
                                {selectedLog.old_values && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Values</label>
                                        <pre className="mt-1 text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                                            {JSON.stringify(selectedLog.old_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {selectedLog.new_values && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Values</label>
                                        <pre className="mt-1 text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                                            {JSON.stringify(selectedLog.new_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {selectedLog.metadata && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Metadata</label>
                                        <pre className="mt-1 text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {selectedLog.error_message && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Error Message</label>
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{selectedLog.error_message}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
