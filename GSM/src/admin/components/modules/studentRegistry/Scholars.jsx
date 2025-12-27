import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  GraduationCap,
  Eye,
  Edit,
  Download,
  BarChart3,
  PieChart,
  Users,
  Clock,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { LoadingData } from '../../ui/LoadingSpinner';
import studentApiService from '../../../../services/studentApiService';
import StudentProfileModal from './StudentProfileModal';

function Scholars() {
    const { showSuccess, showError } = useToastContext();
    const [scholars, setScholars] = useState([]);
    const [filteredScholars, setFilteredScholars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedStudentUuid, setSelectedStudentUuid] = useState(null);
    const [filters, setFilters] = useState({
        scholarship_type: 'all',
        year_level: 'all',
        compliance_status: 'all',
        risk_level: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchScholars();
    }, []);

    useEffect(() => {
        filterScholars();
    }, [scholars, searchTerm, filters]);

    const fetchScholars = async () => {
        setLoading(true);
        try {
            const response = await studentApiService.getStudentsByScholarshipStatus('scholar');
            // Handle paginated response - data is in response.data.data
            const scholarsData = response.data?.data || [];
            setScholars(scholarsData);
            
            // Calculate statistics
            const stats = calculateStatistics(scholarsData);
            setStatistics(stats);
        } catch (error) {
            console.error('Error fetching scholars:', error);
            showError('Failed to fetch scholars');
            // Fallback to mock data
            const mockScholars = [
                {
                    student_uuid: '1',
                    student_number: 'GSM2024001',
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@example.com',
                    program: 'Computer Science',
                    year_level: '3rd Year',
                    school_name: 'University of the Philippines',
                    scholarship_status: 'scholar',
                    current_scholarship_id: 1,
                    approved_amount: 50000,
                    scholarship_start_date: '2024-01-15T10:30:00Z',
                    gpa: 3.5,
                    status: 'active',
                    compliance_status: 'compliant',
                    risk_level: 'low',
                    last_grade_submission: '2024-01-15T10:30:00Z',
                    attendance_rate: 95
                },
                {
                    student_uuid: '2',
                    student_number: 'GSM2024002',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@example.com',
                    program: 'Engineering',
                    year_level: '2nd Year',
                    school_name: 'Ateneo de Manila University',
                    scholarship_status: 'scholar',
                    current_scholarship_id: 2,
                    approved_amount: 45000,
                    scholarship_start_date: '2024-01-14T14:20:00Z',
                    gpa: 2.8,
                    status: 'active',
                    compliance_status: 'at_risk',
                    risk_level: 'high',
                    last_grade_submission: '2024-01-10T10:30:00Z',
                    attendance_rate: 78
                }
            ];
            setScholars(mockScholars);
            setStatistics(calculateStatistics(mockScholars));
        } finally {
            setLoading(false);
        }
    };

    const calculateStatistics = (scholarsData) => {
        // Ensure scholarsData is an array
        if (!Array.isArray(scholarsData)) {
            return {
                total: 0,
                compliant: 0,
                atRisk: 0,
                nonCompliant: 0,
                averageGPA: 0,
                totalAwarded: 0,
                averageAward: 0
            };
        }
        
        const total = scholarsData.length;
        const compliant = scholarsData.filter(s => s.compliance_status === 'compliant').length;
        const atRisk = scholarsData.filter(s => s.compliance_status === 'at_risk').length;
        const nonCompliant = scholarsData.filter(s => s.compliance_status === 'non_compliant').length;
        const averageGPA = scholarsData.reduce((sum, s) => sum + (s.gpa || 0), 0) / total || 0;
        const totalAwarded = scholarsData.reduce((sum, s) => sum + (s.approved_amount || 0), 0);
        const averageAward = totalAwarded / total || 0;

        return {
            total,
            compliant,
            atRisk,
            nonCompliant,
            averageGPA: Math.round(averageGPA * 100) / 100,
            totalAwarded,
            averageAward: Math.round(averageAward)
        };
    };

    const filterScholars = () => {
        let filtered = [...scholars];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(scholar =>
                scholar.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholar.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholar.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholar.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Other filters
        if (filters.scholarship_type !== 'all') {
            filtered = filtered.filter(scholar => scholar.scholarship_type === filters.scholarship_type);
        }
        if (filters.year_level !== 'all') {
            filtered = filtered.filter(scholar => scholar.year_level === filters.year_level);
        }
        if (filters.compliance_status !== 'all') {
            filtered = filtered.filter(scholar => scholar.compliance_status === filters.compliance_status);
        }
        if (filters.risk_level !== 'all') {
            filtered = filtered.filter(scholar => scholar.risk_level === filters.risk_level);
        }

        setFilteredScholars(filtered);
    };

    const handleViewScholar = (studentUuid) => {
        setSelectedStudentUuid(studentUuid);
        setShowProfileModal(true);
    };

    const handleEditScholar = (scholar) => {
        // This would open the edit modal
        console.log('Edit scholar:', scholar);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getComplianceColor = (status) => {
        switch (status) {
            case 'compliant': return 'text-green-600 bg-green-100';
            case 'at_risk': return 'text-yellow-600 bg-yellow-100';
            case 'non_compliant': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getRiskLevelColor = (level) => {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getGPAStatus = (gpa) => {
        if (gpa >= 3.5) return { color: 'text-green-600', icon: TrendingUp, status: 'Excellent' };
        if (gpa >= 3.0) return { color: 'text-blue-600', icon: TrendingUp, status: 'Good' };
        if (gpa >= 2.5) return { color: 'text-yellow-600', icon: TrendingDown, status: 'At Risk' };
        return { color: 'text-red-600', icon: AlertTriangle, status: 'Critical' };
    };

    if (loading) {
        return <LoadingData />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Scholars Management</span>
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                        Monitor and manage scholarship recipients
                    </p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <button className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Generate Report</span>
                        <span className="sm:hidden">Report</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Data</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scholars</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {statistics?.total || 0}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliant</p>
                            <p className="text-3xl font-bold text-green-600">
                                {statistics?.compliant || 0}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">At Risk</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {statistics?.atRisk || 0}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average GPA</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {statistics?.averageGPA || 0}
                            </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-500" />
                    </div>
                </motion.div>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliant</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {statistics?.compliant || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">At Risk</span>
                </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {statistics?.atRisk || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Non-Compliant</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {statistics?.nonCompliant || 0}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Awarded</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ₱{statistics?.totalAwarded?.toLocaleString() || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Award</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ₱{statistics?.averageAward?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search scholars by name, student number, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                        />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        <span className="sm:hidden">Filter</span>
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Scholarship Type
                                </label>
                        <select
                                    value={filters.scholarship_type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, scholarship_type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="all">All Types</option>
                                    <option value="merit">Merit Scholarship</option>
                                    <option value="need_based">Need-Based</option>
                                    <option value="athletic">Athletic</option>
                        </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Year Level
                                </label>
                        <select
                                    value={filters.year_level}
                                    onChange={(e) => setFilters(prev => ({ ...prev, year_level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Years</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                        </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Compliance Status
                                </label>
                        <select
                                    value={filters.compliance_status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, compliance_status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="compliant">Compliant</option>
                                    <option value="at_risk">At Risk</option>
                                    <option value="non_compliant">Non-Compliant</option>
                        </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Risk Level
                                </label>
                        <select
                                    value={filters.risk_level}
                                    onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="all">All Levels</option>
                                    <option value="low">Low Risk</option>
                                    <option value="medium">Medium Risk</option>
                                    <option value="high">High Risk</option>
                        </select>
                    </div>
                </div>
                    </div>
                )}
            </div>

            {/* Scholars Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Scholar</span>
                                    <span className="sm:hidden">SCHOLAR</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Program</span>
                                    <span className="sm:hidden">PROGRA</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Award Amount</span>
                                    <span className="sm:hidden">AMOUNT</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">GPA Status</span>
                                    <span className="sm:hidden">GPA</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Compliance</span>
                                    <span className="sm:hidden">COMPLY</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Risk Level</span>
                                    <span className="sm:hidden">RISK</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Actions</span>
                                    <span className="sm:hidden">ACTIONS</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredScholars.map((scholar, index) => {
                                const gpaStatus = getGPAStatus(scholar.gpa);
                                return (
                                    <motion.tr
                                        key={scholar.student_uuid}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                                        onClick={() => handleViewScholar(scholar.student_uuid)}
                                    >
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {scholar.first_name} {scholar.last_name}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {scholar.student_number}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                                                        {scholar.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm text-gray-900 dark:text-white truncate">{scholar.program}</div>
                                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{scholar.year_level}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                                ₱{scholar.approved_amount?.toLocaleString()}
                                            </div>
                                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                                Since {formatDate(scholar.scholarship_start_date)}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-1 sm:space-x-2">
                                                <gpaStatus.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${gpaStatus.color} flex-shrink-0`} />
                                                <span className={`text-xs sm:text-sm font-medium ${gpaStatus.color}`}>
                                                    {scholar.gpa || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                                {gpaStatus.status}
                                            </div>
                                    </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getComplianceColor(scholar.compliance_status)}`}>
                                                <span className="hidden sm:inline">{scholar.compliance_status?.replace('_', ' ').toUpperCase()}</span>
                                                <span className="sm:hidden">{scholar.compliance_status?.charAt(0)?.toUpperCase()}</span>
                                            </span>
                                    </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(scholar.risk_level)}`}>
                                                <span className="hidden sm:inline">{scholar.risk_level?.toUpperCase()}</span>
                                                <span className="sm:hidden">{scholar.risk_level?.charAt(0)?.toUpperCase()}</span>
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                            <div className="flex items-center space-x-1 sm:space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewScholar(scholar.student_uuid);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditScholar(scholar);
                                                    }}
                                                    className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                                >
                                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
            </div>

                {filteredScholars.length === 0 && (
                    <div className="text-center py-12">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No scholars found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || Object.values(filters).some(f => f !== 'all') 
                                ? 'Try adjusting your search criteria' 
                                : 'No scholars have been registered yet'
                            }
                        </p>
                    </div>
                )}
                </div>

            {/* Student Profile Modal */}
            {showProfileModal && (
                <StudentProfileModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    studentUuid={selectedStudentUuid}
                    onEdit={handleEditScholar}
                />
            )}
        </div>
    );
}

export default Scholars;