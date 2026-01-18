import React from 'react';
import { School as SchoolIcon, Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Users, Phone, Mail, Globe, Building, CheckCircle, XCircle, AlertCircle, Grid3X3, List, CheckSquare, Square } from 'lucide-react';
import AddSchoolModal from './AddSchoolModal';
import BulkDeleteModal from './BulkDeleteModal';
import { getSchools, deleteSchool, getSchoolById } from '../../../../services/schoolService';
import { API_CONFIG } from '../../../../config/api';

function PSDSchoolManagement() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [selectedSchool, setSelectedSchool] = React.useState(null);
    const [schools, setSchools] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'grid'
    const [selectedSchools, setSelectedSchools] = React.useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

    // New state for detailed view
    const [schoolDetails, setSchoolDetails] = React.useState(null);
    const [detailsLoading, setDetailsLoading] = React.useState(false);

    // Fetch schools from API
    const fetchSchools = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getSchools({
                search: searchTerm,
                is_active: filterStatus === 'all' ? undefined : filterStatus === 'active',
                is_partner_school: true
            });

            if (response.success) {
                setSchools(response.data.data || []);
            } else {
                setError(response.message || 'Failed to fetch schools');
            }
        } catch (err) {
            console.error('Error fetching schools:', err);
            setError(err.message || 'Failed to fetch schools');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSchools();
    }, [searchTerm, filterStatus]);

    // Handle view details
    const handleViewDetails = async (school) => {
        setSelectedSchool(school);
        setShowViewModal(true);
        setSchoolDetails(null);
        setDetailsLoading(true);

        try {
            const response = await getSchoolById(school.id);
            if (response.success) {
                setSchoolDetails(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch school details:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Handle successful school creation
    const handleSchoolCreated = (newSchool) => {
        setSchools(prev => [newSchool, ...prev]);
        setShowAddModal(false);
    };

    // Handle school deletion
    const handleDeleteSchool = async (schoolId) => {
        if (window.confirm('Are you sure you want to delete this school?')) {
            try {
                const response = await deleteSchool(schoolId);
                if (response.success) {
                    setSchools(prev => prev.filter(school => school.id !== schoolId));
                } else {
                    alert(response.message || 'Failed to delete school');
                }
            } catch (err) {
                console.error('Error deleting school:', err);
                alert(err.message || 'Failed to delete school');
            }
        }
    };

    // Handle bulk selection
    const handleSelectSchool = (schoolId) => {
        setSelectedSchools(prev =>
            prev.includes(schoolId)
                ? prev.filter(id => id !== schoolId)
                : [...prev, schoolId]
        );
    };

    const handleSelectAll = () => {
        if (selectedSchools.length === schools.length) {
            setSelectedSchools([]);
        } else {
            setSelectedSchools(schools.map(school => school.id));
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            const deletePromises = selectedSchools.map(schoolId => deleteSchool(schoolId));
            const results = await Promise.allSettled(deletePromises);

            const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
            const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

            if (successful.length > 0) {
                setSchools(prev => prev.filter(school => !selectedSchools.includes(school.id)));
                setSelectedSchools([]);
                setShowBulkDeleteModal(false);
                alert(`Successfully deleted ${successful.length} school${successful.length !== 1 ? 's' : ''}`);
            }

            if (failed.length > 0) {
                alert(`Failed to delete ${failed.length} school${failed.length !== 1 ? 's' : ''}`);
            }
        } catch (err) {
            console.error('Error in bulk delete:', err);
            alert('An error occurred during bulk deletion');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const getStatusIcon = (isActive) => {
        return isActive ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Active' : 'Inactive';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">School Management</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage partner school information, contact details, and accreditation status</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                        }`}
                                    title="Table View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                        }`}
                                    title="Grid View"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Bulk Actions */}
                            {selectedSchools.length > 0 && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">
                                        {selectedSchools.length} selected
                                    </span>
                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete Selected
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="truncate">Add New School</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Search and Filter Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 w-full sm:max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search schools..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    </div>
                )}

                {/* Schools Display */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <span className="ml-2 text-gray-600 dark:text-slate-400">Loading schools...</span>
                        </div>
                    ) : viewMode === 'table' ? (
                        // Table View
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                            <button
                                                onClick={handleSelectAll}
                                                className="flex items-center space-x-2 hover:text-gray-700 dark:hover:text-slate-300"
                                            >
                                                {selectedSchools.length === schools.length && schools.length > 0 ? (
                                                    <CheckSquare className="w-4 h-4" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                                <span>School</span>
                                            </button>
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Properties</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {schools.map((school) => (
                                        <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => handleSelectSchool(school.id)}
                                                        className="flex-shrink-0"
                                                    >
                                                        {selectedSchools.includes(school.id) ? (
                                                            <CheckSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                        )}
                                                    </button>
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                                                <SchoolIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{school.name}</div>
                                                            {school.campus && (
                                                                <div className="text-sm text-gray-500 dark:text-slate-400">{school.campus}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">{school.classification}</div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {[school.address, school.city, school.region].filter(Boolean).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">{school.email || 'No email'}</div>
                                                <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {school.contact_number || 'No phone'}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    {school.is_public && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                            Public
                                                        </span>
                                                    )}
                                                    {school.is_partner_school && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                            Partner
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(school.is_active)}`}>
                                                    {getStatusIcon(school.is_active)}
                                                    <span className="ml-1">{getStatusText(school.is_active)}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(school)}
                                                        className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSchool(school);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Edit School"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSchool(school.id)}
                                                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete School"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // Grid View
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {schools.map((school) => (
                                    <div key={school.id} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <button
                                                onClick={() => handleSelectSchool(school.id)}
                                                className="flex-shrink-0"
                                            >
                                                {selectedSchools.includes(school.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                                )}
                                            </button>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => handleViewDetails(school)}
                                                    className="p-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSchool(school);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                    title="Edit School"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSchool(school.id)}
                                                    className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete School"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center mb-3">
                                            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mr-3">
                                                <SchoolIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{school.name}</h3>
                                                {school.campus && (
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{school.campus}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-xs text-gray-600 dark:text-slate-400">
                                                <span className="font-medium">Type:</span> {school.classification}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-slate-400">
                                                <MapPin className="w-3 h-3 inline mr-1" />
                                                {[school.city, school.region].filter(Boolean).join(', ')}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-slate-400">
                                                <Phone className="w-3 h-3 inline mr-1" />
                                                {school.contact_number || 'No phone'}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {school.is_public && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                    Public
                                                </span>
                                            )}
                                            {school.is_partner_school && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                    Partner
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.is_active)}`}>
                                                {getStatusIcon(school.is_active)}
                                                <span className="ml-1">{getStatusText(school.is_active)}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!loading && schools.length === 0 && (
                    <div className="text-center py-12">
                        <SchoolIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No schools found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new school.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add School Modal */}
            <AddSchoolModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleSchoolCreated}
            />

            {/* Bulk Delete Modal */}
            <BulkDeleteModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                selectedSchools={schools.filter(school => selectedSchools.includes(school.id))}
                isDeleting={isBulkDeleting}
            />

            {/* View School Modal */}
            {showViewModal && selectedSchool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Details</h2>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                        <SchoolIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSchool.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">{selectedSchool.classification}</p>
                                        {selectedSchool.campus && (
                                            <p className="text-sm text-gray-500 dark:text-slate-500">{selectedSchool.campus}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Contact Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {selectedSchool.contact_number || 'No phone number'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {selectedSchool.email || 'No email address'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                                <Globe className="w-4 h-4 mr-2" />
                                                {selectedSchool.website || 'No website'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Location</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {selectedSchool.address || 'No address'}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-slate-400">
                                                {[selectedSchool.city, selectedSchool.province, selectedSchool.region].filter(Boolean).join(', ') || 'No location details'}
                                            </div>
                                            {selectedSchool.zip_code && (
                                                <div className="text-sm text-gray-500 dark:text-slate-500">
                                                    ZIP: {selectedSchool.zip_code}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedSchool.is_public ? 'Public' : 'Private'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">School Type</div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                            {selectedSchool.is_partner_school ? 'Yes' : 'No'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">Partner School</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">School Properties</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSchool.is_active)}`}>
                                            {getStatusIcon(selectedSchool.is_active)}
                                            <span className="ml-1">{getStatusText(selectedSchool.is_active)}</span>
                                        </span>
                                        {selectedSchool.is_public && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                Public School
                                            </span>
                                        )}
                                        {selectedSchool.is_partner_school && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                Partner School
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Documents Section */}
                                {detailsLoading ? (
                                    <div className="flex justify-center p-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                    </div>
                                ) : schoolDetails?.verification_documents?.length > 0 ? (
                                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                                <List className="w-4 h-4 mr-2" />
                                                Verification Documents
                                            </h4>
                                        </div>
                                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {schoolDetails.verification_documents.map((doc) => (
                                                <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.document_name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">{doc.document_type}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.verification_status === 'verified'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : doc.verification_status === 'rejected'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                            }`}>
                                                            {doc.verification_status.charAt(0).toUpperCase() + doc.verification_status.slice(1)}
                                                        </span>
                                                        <a
                                                            href={`${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/storage/${doc.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-sm text-gray-500 dark:text-slate-400">No verification documents found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PSDSchoolManagement;
