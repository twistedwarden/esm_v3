import React from 'react';
import { FileText, Plus, Eye, CheckCircle, XCircle, Clock, Search, Filter, Download, UserPlus, AlertCircle, MapPin, Building2, Phone, Mail as MailIcon, Info, List, Grid, ArrowUpDown, Calendar } from 'lucide-react';
import {
    getApplications,
    getApplication,
    submitApplication,
    markAsUnderReview,
    approveApplication,
    rejectApplication,
    createSchoolAccount
} from '../../../../services/partnerSchoolApplicationService';
import PSDApplicationForm from './PSDApplicationForm';
import PSDDocumentReview from './PSDDocumentReview';
import { useToastContext } from '../../../../components/providers/ToastProvider';

function PSDApplicationManagement() {
    const { showSuccess, showError, showWarning } = useToastContext();
    const [applications, setApplications] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [showFormModal, setShowFormModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [showDocumentModal, setShowDocumentModal] = React.useState(false);
    const [selectedApplication, setSelectedApplication] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pagination, setPagination] = React.useState(null);
    const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'grid'
    const [sortBy, setSortBy] = React.useState('created_desc'); // created_desc, created_asc, name_asc, name_desc, status
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [confirmAction, setConfirmAction] = React.useState(null);
    const [showRejectModal, setShowRejectModal] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');
    const [rejectApplicationId, setRejectApplicationId] = React.useState(null);

    React.useEffect(() => {
        fetchApplications();
    }, [searchTerm, filterStatus, currentPage, sortBy]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                search: searchTerm || undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                page: currentPage,
                per_page: 15,
            };
            const data = await getApplications(params);
            let sortedData = data.data || [];
            
            // Client-side sorting
            sortedData = sortedData.sort((a, b) => {
                switch (sortBy) {
                    case 'created_desc':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'created_asc':
                        return new Date(a.created_at) - new Date(b.created_at);
                    case 'name_asc':
                        return (a.school?.name || '').localeCompare(b.school?.name || '');
                    case 'name_desc':
                        return (b.school?.name || '').localeCompare(a.school?.name || '');
                    case 'status':
                        return (a.status || '').localeCompare(b.status || '');
                    default:
                        return 0;
                }
            });
            
            setApplications(sortedData);
            setPagination(data);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };


    const handleView = async (id) => {
        try {
            const application = await getApplication(id);
            setSelectedApplication(application);
            setShowViewModal(true);
        } catch (err) {
            console.error('Error fetching application:', err);
            setError(err.message || 'Failed to load application');
        }
    };

    const handleViewDocuments = async (id) => {
        try {
            const application = await getApplication(id);
            setSelectedApplication(application);
            setShowDocumentModal(true);
        } catch (err) {
            console.error('Error fetching application:', err);
            setError(err.message || 'Failed to load application');
        }
    };

    const handleSubmit = async (id) => {
        if (!window.confirm('Submit this application for review?')) return;
        try {
            await submitApplication(id);
            fetchApplications();
            if (selectedApplication?.id === id) {
                const updated = await getApplication(id);
                setSelectedApplication(updated);
            }
        } catch (err) {
            console.error('Error submitting application:', err);
            setError(err.message || 'Failed to submit application');
        }
    };

    const handleMarkUnderReview = async (id) => {
        setConfirmAction({
            title: 'Mark as Under Review',
            message: 'Mark this application as under review?',
            onConfirm: async () => {
                try {
                    await markAsUnderReview(id);
                    showSuccess('Application marked as under review');
                    fetchApplications();
                    if (selectedApplication?.id === id) {
                        const updated = await getApplication(id);
                        setSelectedApplication(updated);
                    }
                } catch (err) {
                    console.error('Error marking as under review:', err);
                    showError(err.message || 'Failed to mark as under review');
                }
            }
        });
        setShowConfirmModal(true);
    };

    const handleApprove = async (id, notes) => {
        setConfirmAction({
            title: 'Approve Application',
            message: 'Are you sure you want to approve this application?',
            onConfirm: async () => {
                try {
                    await approveApplication(id, notes);
                    showSuccess('Application approved successfully');
                    fetchApplications();
                    setShowViewModal(false);
                } catch (err) {
                    console.error('Error approving application:', err);
                    showError(err.message || 'Failed to approve application');
                }
            }
        });
        setShowConfirmModal(true);
    };

    const handleRejectClick = (id) => {
        setRejectApplicationId(id);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            showWarning('Please provide a rejection reason');
            return;
        }
        
        try {
            await rejectApplication(rejectApplicationId, rejectReason);
            showSuccess('Application rejected successfully');
            fetchApplications();
            setShowViewModal(false);
            setShowRejectModal(false);
            setRejectReason('');
            setRejectApplicationId(null);
        } catch (err) {
            console.error('Error rejecting application:', err);
            showError(err.message || 'Failed to reject application');
        }
    };

    const handleCreateAccount = async (applicationId, accountData) => {
        try {
            await createSchoolAccount(applicationId, accountData);
            fetchApplications();
            alert('Account created successfully. Credentials sent via email.');
        } catch (err) {
            console.error('Error creating account:', err);
            setError(err.message || 'Failed to create account');
        }
    };

    // Check if school information is complete
    const isSchoolInfoComplete = (school) => {
        if (!school) return false;
        
        const requiredFields = [
            school.classification,
            school.address,
            school.city,
            school.province,
            school.region,
            school.contact_number
        ];
        
        return requiredFields.every(field => field && field.trim() !== '');
    };

    // Get completeness percentage
    const getCompletenessPercentage = (school) => {
        if (!school) return 0;
        
        const fields = [
            { value: school.classification, label: 'Classification' },
            { value: school.address, label: 'Address' },
            { value: school.city, label: 'City' },
            { value: school.province, label: 'Province' },
            { value: school.region, label: 'Region' },
            { value: school.contact_number, label: 'Contact Number' }
        ];
        
        const filledFields = fields.filter(f => f.value && f.value.trim() !== '').length;
        return Math.round((filledFields / fields.length) * 100);
    };

    // Get missing fields list
    const getMissingFields = (school) => {
        if (!school) return [];
        
        const fields = [
            { value: school.classification, label: 'Classification' },
            { value: school.address, label: 'Address' },
            { value: school.city, label: 'City' },
            { value: school.province, label: 'Province' },
            { value: school.region, label: 'Region' },
            { value: school.contact_number, label: 'Contact Number' }
        ];
        
        return fields.filter(f => !f.value || f.value.trim() === '').map(f => f.label);
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
            under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
            withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        };
        return colors[status] || colors.draft;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            case 'submitted':
            case 'under_review':
                return <Clock className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Management</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Manage partner school applications and verification
                            </p>
                        </div>
                        <button
                            onClick={() => setShowFormModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Application
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search applications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <div className="relative lg:w-48">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>
                        
                        {/* Sort */}
                        <div className="relative lg:w-48">
                            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white appearance-none cursor-pointer"
                            >
                                <option value="created_desc">Newest First</option>
                                <option value="created_asc">Oldest First</option>
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="name_desc">Name (Z-A)</option>
                                <option value="status">By Status</option>
                            </select>
                        </div>
                        
                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-600 text-orange-500 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                                title="List View"
                            >
                                <List className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-600 text-orange-500 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                                title="Grid View"
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Results Count */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-gray-900 dark:text-white">{pagination?.total || 0}</span> applications found
                            {filterStatus !== 'all' && (
                                <span className="ml-2">
                                    • Filtered by: <span className="font-medium capitalize">{filterStatus.replace('_', ' ')}</span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Applications List/Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <>
                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="space-y-4">
                                {applications.map((application) => (
                                    <div
                                        key={application.id}
                                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                                                        {getStatusIcon(application.status)}
                                                        <span className="ml-1.5 capitalize">{application.status.replace('_', ' ')}</span>
                                                    </span>
                                                    {application.school && (
                                                        <>
                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                {application.school.name}
                                                            </h3>
                                                            {isSchoolInfoComplete(application.school) ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                    Complete
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                                                    {getCompletenessPercentage(application.school)}% Complete
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Created: {new Date(application.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {application.submitted_at && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            <span>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 flex-wrap">
                                                {/* Status-specific action buttons */}
                                                {application.status === 'submitted' && (
                                                    <button
                                                        onClick={() => handleMarkUnderReview(application.id)}
                                                        className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 rounded-lg transition-all flex items-center gap-2"
                                                        title="Mark as Under Review"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        Mark Under Review
                                                    </button>
                                                )}
                                                {application.status === 'under_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(application.id)}
                                                            className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded-lg transition-all flex items-center gap-2"
                                                            title="Approve Application"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(application.id)}
                                                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg transition-all flex items-center gap-2"
                                                            title="Reject Application"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {/* View buttons */}
                                                <button
                                                    onClick={() => handleViewDocuments(application.id)}
                                                    className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                    title="View Documents"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleView(application.id)}
                                                    className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {applications.map((application) => (
                                    <div
                                        key={application.id}
                                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                                                {getStatusIcon(application.status)}
                                                <span className="ml-1.5 capitalize">{application.status.replace('_', ' ')}</span>
                                            </span>
                                            {application.school && isSchoolInfoComplete(application.school) ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" title="Complete" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-500" title={`${getCompletenessPercentage(application.school)}% Complete`} />
                                            )}
                                        </div>
                                        
                                        {/* School Name */}
                                        {application.school && (
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 min-h-[3.5rem]">
                                                {application.school.name}
                                            </h3>
                                        )}
                                        
                                        {/* Dates */}
                                        <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">Created: {new Date(application.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {application.submitted_at && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">Submitted: {new Date(application.submitted_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Status-specific Actions */}
                                        {(application.status === 'submitted' || application.status === 'under_review') && (
                                            <div className="space-y-2 mb-4">
                                                {application.status === 'submitted' && (
                                                    <button
                                                        onClick={() => handleMarkUnderReview(application.id)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 rounded-lg transition-all"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        Mark Under Review
                                                    </button>
                                                )}
                                                {application.status === 'under_review' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleApprove(application.id)}
                                                            className="flex items-center justify-center gap-1 px-2 py-2 text-sm font-semibold text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded-lg transition-all"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(application.id)}
                                                            className="flex items-center justify-center gap-1 px-2 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg transition-all"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* View Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                                            <button
                                                onClick={() => handleViewDocuments(application.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Documents
                                            </button>
                                            <button
                                                onClick={() => handleView(application.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.from}</span> to{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{pagination.to}</span> of{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(Math.min(5, pagination.last_page))].map((_, idx) => {
                                                const pageNum = idx + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                            currentPage === pageNum
                                                                ? 'bg-orange-500 text-white'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            {pagination.last_page > 5 && (
                                                <>
                                                    <span className="px-2 text-gray-500">...</span>
                                                    <button
                                                        onClick={() => setCurrentPage(pagination.last_page)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                            currentPage === pagination.last_page
                                                                ? 'bg-orange-500 text-white'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {pagination.last_page}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                                            disabled={currentPage === pagination.last_page}
                                            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Application Form Modal */}
            {showFormModal && (
                <PSDApplicationForm
                    onClose={() => setShowFormModal(false)}
                    onSave={() => {
                        setShowFormModal(false);
                        fetchApplications();
                    }}
                />
            )}

            {/* View Application Modal */}
            {showViewModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Application Details</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            ID: {selectedApplication.id} • Created {new Date(selectedApplication.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Application Status Section */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Application Status</p>
                                        <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg ${getStatusColor(selectedApplication.status)}`}>
                                            {getStatusIcon(selectedApplication.status)}
                                            <span className="ml-2 capitalize">{selectedApplication.status.replace('_', ' ')}</span>
                                        </span>
                                    </div>
                                    {selectedApplication.submitted_at && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {new Date(selectedApplication.submitted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* School Information Section */}
                            {selectedApplication.school && (
                                <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">School Information</h3>
                                            </div>
                                            {isSchoolInfoComplete(selectedApplication.school) ? (
                                                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                                    Complete
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                    <AlertCircle className="w-4 h-4 mr-1.5" />
                                                    {getCompletenessPercentage(selectedApplication.school)}% Complete
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-6">
                                        {/* Completeness Alert */}
                                        {!isSchoolInfoComplete(selectedApplication.school) && (
                                            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                                                            School information is incomplete
                                                        </p>
                                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                                            Missing: {getMissingFields(selectedApplication.school).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* School Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                                    School Name
                                                </label>
                                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {selectedApplication.school.name}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                                    Classification
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-base font-medium ${selectedApplication.school.classification ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                                        {selectedApplication.school.classification || 'Not provided'}
                                                    </p>
                                                    {!selectedApplication.school.classification && (
                                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                                    Address
                                                </label>
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                                    <p className={`text-base ${selectedApplication.school.address ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                                        {selectedApplication.school.address 
                                                            ? `${selectedApplication.school.address}${selectedApplication.school.city ? ', ' + selectedApplication.school.city : ''}${selectedApplication.school.province ? ', ' + selectedApplication.school.province : ''}${selectedApplication.school.region ? ', ' + selectedApplication.school.region : ''}`
                                                            : 'Not provided'}
                                                    </p>
                                                    {!selectedApplication.school.address && (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-1" />
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                                    Contact Number
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <p className={`text-base ${selectedApplication.school.contact_number ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                                        {selectedApplication.school.contact_number || 'Not provided'}
                                                    </p>
                                                    {!selectedApplication.school.contact_number && (
                                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                                    Email
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <MailIcon className="w-4 h-4 text-gray-400" />
                                                    <p className={`text-base ${selectedApplication.school.email ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                                        {selectedApplication.school.email || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Notes Section */}
                            {selectedApplication.admin_notes && (
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-6">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                        Admin Notes
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedApplication.admin_notes}
                                    </p>
                                </div>
                            )}
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleViewDocuments(selectedApplication.id)}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Documents
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {selectedApplication.status === 'under_review' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(selectedApplication.id)}
                                                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(selectedApplication.id)}
                                                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {selectedApplication.status === 'submitted' && !selectedApplication.school?.email && (
                                        <button
                                            onClick={() => {
                                                const email = prompt('School contact email:');
                                                const firstName = prompt('Contact first name:');
                                                const lastName = prompt('Contact last name:');
                                                if (email && firstName && lastName) {
                                                    handleCreateAccount(selectedApplication.id, {
                                                        email,
                                                        first_name: firstName,
                                                        last_name: lastName,
                                                    });
                                                }
                                            }}
                                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Create Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Review Modal */}
            {showDocumentModal && selectedApplication && (
                <PSDDocumentReview
                    application={selectedApplication}
                    onClose={() => {
                        setShowDocumentModal(false);
                        fetchApplications();
                    }}
                />
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white">{confirmAction.title}</h3>
                            </div>
                        </div>
                        <div className="px-6 py-6">
                            <p className="text-gray-700 dark:text-gray-300">{confirmAction.message}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmAction(null);
                                }}
                                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    confirmAction.onConfirm();
                                    setShowConfirmModal(false);
                                    setConfirmAction(null);
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Reject Application</h3>
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Please provide a reason for rejecting this application:
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                            />
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setRejectApplicationId(null);
                                }}
                                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={!rejectReason.trim()}
                                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PSDApplicationManagement;
