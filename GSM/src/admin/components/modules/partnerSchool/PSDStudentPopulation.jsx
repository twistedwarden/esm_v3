import React from 'react';
import { Users, TrendingUp, TrendingDown, Plus, Search, Filter, Download, Eye, BarChart3, PieChart, Activity, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { API_CONFIG } from '../../../../config/api';

const API_BASE_URL = `${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/api`;

function PSDStudentPopulation() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterSchool, setFilterSchool] = React.useState('all');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [selectedSchool, setSelectedSchool] = React.useState(null);
    const [schools, setSchools] = React.useState([]);
    const [schoolOptions, setSchoolOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('table'); // table, chart
    const [totals, setTotals] = React.useState({
        total_students: 0,
        total_scholars: 0,
        active_scholars: 0,
        graduated_scholars: 0,
        scholarship_rate: 0
    });

    // Fetch student population data from API
    React.useEffect(() => {
        fetchStudentPopulation();
        fetchSchools();
    }, [filterSchool, searchTerm]);

    const fetchStudentPopulation = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSchool !== 'all') {
                params.append('school_id', filterSchool);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            
            const response = await fetch(`${API_BASE_URL}/partner-school/student-population?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setSchools(data.data || []);
                setTotals(data.totals || {
                    total_students: 0,
                    total_scholars: 0,
                    active_scholars: 0,
                    graduated_scholars: 0,
                    scholarship_rate: 0
                });
            } else {
                console.error('Failed to fetch student population:', data.message);
                setSchools([]);
            }
        } catch (error) {
            console.error('Error fetching student population:', error);
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/partner-school/schools`);
            const data = await response.json();
            
            if (data.success) {
                setSchoolOptions(data.data || []);
            } else {
                console.error('Failed to fetch schools:', data.message);
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

    const handleExport = () => {
        const csvContent = [
            ['School', 'Total Students', 'Male Students', 'Female Students', 'Scholars', 'Active Scholars', 'Graduated Scholars', 'Scholarship Rate (%)', 'Last Updated'],
            ...filteredSchools.map(school => [
                school.school_name,
                school.total_students,
                school.male_students,
                school.female_students,
                school.scholarship_recipients,
                school.active_scholars,
                school.graduated_scholars,
                school.scholarship_rate,
                new Date(school.last_updated).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-population-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const filteredSchools = schools.filter(school => {
        const matchesSearch = school.school_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSchool = filterSchool === 'all' || school.id.toString() === filterSchool;
        return matchesSearch && matchesSchool;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Student Population</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Track student demographics and scholarship distribution across partner schools</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'table' 
                                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    Table
                                </button>
                                <button
                                    onClick={() => setViewMode('chart')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'chart' 
                                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    Charts
                                </button>
                            </div>
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center justify-center px-3 py-2 sm:px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="truncate">Add Population Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate">Total Students</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totals.total_students.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate">Total Scholars</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totals.total_scholars.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate">Active Scholars</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totals.active_scholars.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate">Scholarship Rate</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totals.scholarship_rate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate">Graduated</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{totals.graduated_scholars.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

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
                                    value={filterSchool}
                                    onChange={(e) => setFilterSchool(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                                >
                                    <option value="all">All Schools</option>
                                    {schoolOptions.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleExport}
                                className="inline-flex items-center px-3 py-2 sm:px-4 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md text-sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content based on view mode */}
                {viewMode === 'table' ? (
                    /* Schools Table */
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">School</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Students</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Gender Split</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Scholars</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Scholarship Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                                    <span className="ml-2 text-gray-600 dark:text-slate-400">Loading student population data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchools.map((school) => {
                                        const scholarshipRate = school.total_students > 0 ? ((school.scholarship_recipients / school.total_students) * 100).toFixed(1) : 0;
                                        const malePercentage = school.total_students > 0 ? ((school.male_students / school.total_students) * 100).toFixed(1) : 0;
                                        const femalePercentage = school.total_students > 0 ? ((school.female_students / school.total_students) * 100).toFixed(1) : 0;
                                        
                                        return (
                                            <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                                                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{school.school_name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-slate-400">Updated: {new Date(school.last_updated).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{school.total_students.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                            Male: {malePercentage}%
                                                        </div>
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                                                            Female: {femalePercentage}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{school.scholarship_recipients}</div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                                        Active: {school.active_scholars} | Graduated: {school.graduated_scholars}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{scholarshipRate}%</div>
                                                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                                                        <div 
                                                            className="bg-orange-500 h-2 rounded-full" 
                                                            style={{ width: `${Math.min(scholarshipRate, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        <div className="flex items-center text-green-600 dark:text-green-400">
                                                            <UserCheck className="w-4 h-4 mr-1" />
                                                            {school.active_scholars} Active
                                                        </div>
                                                        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                                                            <Activity className="w-4 h-4 mr-1" />
                                                            {school.pending_applications} Pending
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedSchool(school);
                                                                setShowViewModal(true);
                                                            }}
                                                            className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="View Charts">
                                                            <BarChart3 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Charts View */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scholarship Distribution</h3>
                            <div className="text-center py-8">
                                <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Chart visualization will be implemented here</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Demographics</h3>
                            <div className="text-center py-8">
                                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Chart visualization will be implemented here</p>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && filteredSchools.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {searchTerm || filterSchool !== 'all' ? 'Try adjusting your search criteria.' : 'No student population data available.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Population Data Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Population Data</h2>
                                <button 
                                    onClick={() => setShowAddModal(false)} 
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-8">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Add Population Data Form</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                                    This form will be implemented to add student population data for partner schools.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View School Details Modal */}
            {showViewModal && selectedSchool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Population Details</h2>
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
                                        <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSchool.school_name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">Population data as of {new Date(selectedSchool.population_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedSchool.total_students.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">Total Students</div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedSchool.scholarship_recipients}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">Scholarship Recipients</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedSchool.active_scholars}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">Active Scholars</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedSchool.graduated_scholars}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">Graduated Scholars</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Gender Distribution</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-slate-400">Male</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedSchool.male_students.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full" 
                                                    style={{ width: `${(selectedSchool.male_students / selectedSchool.total_students) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-slate-400">Female</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedSchool.female_students.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                                <div 
                                                    className="bg-pink-500 h-2 rounded-full" 
                                                    style={{ width: `${(selectedSchool.female_students / selectedSchool.total_students) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Scholarship Breakdown</h4>
                                        <div className="space-y-2">
                                            {Object.entries(selectedSchool.scholarship_breakdown).map(([type, count]) => (
                                                <div key={type} className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 dark:text-slate-400 capitalize">{type.replace('_', ' ')}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PSDStudentPopulation;
