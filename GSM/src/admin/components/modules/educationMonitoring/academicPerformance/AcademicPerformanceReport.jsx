import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    TrendingUp,
    AlertTriangle,
    Award,
    Users,
    Filter,
    Search,
    Eye,
    X,
    ChevronDown,
    RefreshCw,
} from 'lucide-react';
import { getStudentAcademicPerformance } from '../../../../../services/monitoringService';

// Utility functions
// Philippine 5-point scale: 1.0 = highest, 5.0 = lowest, 3.0 = passing
const formatGPA = (gpa) => (gpa ? gpa.toFixed(2) : 'N/A');
const getGradeLabel = (gpa) => {
    if (!gpa) return 'No Grade';
    if (gpa <= 1.5) return 'Excellent';
    if (gpa <= 2.0) return 'Very Good';
    if (gpa <= 2.5) return 'Good';
    if (gpa <= 3.0) return 'Passing';
    return 'Failing';
};
const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'N/A');

// Risk Level Badge Component (5-point scale: >3.0 = failing/high risk)
const RiskBadge = ({ level }) => {
    const config = {
        high: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Failing' },
        medium: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'At Risk' },
        low: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Good Standing' },
    };
    const { bg, label } = config[level] || config.low;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>{label}</span>;
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400">{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

// Student Detail Modal
const StudentDetailModal = ({ student, onClose }) => {
    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Student Details</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Student ID</p>
                            <p className="font-medium text-slate-900 dark:text-white">{student.student_id_number}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {student.first_name} {student.middle_name} {student.last_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                            <p className="font-medium text-slate-900 dark:text-white">{student.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Program</p>
                            <p className="font-medium text-slate-900 dark:text-white">{student.program}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Year Level</p>
                            <p className="font-medium text-slate-900 dark:text-white">{student.year_level}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Current Grade</p>
                            <p className="font-medium text-slate-900 dark:text-white">{formatGPA(student.gpa)} - {getGradeLabel(student.gpa)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Risk Level</p>
                            <RiskBadge level={student.risk_level} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                {student.status}
                            </span>
                        </div>
                    </div>

                    {/* Grades History */}
                    {student.grades && student.grades.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Grade History</h4>
                            <div className="space-y-2">
                                {student.grades.map((grade, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">Grade: {formatGPA(grade.grade)} - {getGradeLabel(grade.grade)}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {grade.term} {grade.year}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(grade.updated_at)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Academic Performance Report Component
const AcademicPerformanceReport = () => {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        minGpa: '',
        maxGpa: '',
        program: '',
        yearLevel: '',
        riskLevel: '',
        hasGrades: '',
        schoolId: '',
    });
    const [schools, setSchools] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch schools for filter
    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await fetch('http://localhost:8001/api/schools');
                const data = await response.json();
                if (data.success) {
                    setSchools(data.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch schools:', error);
            }
        };
        fetchSchools();
    }, []);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const filterParams = {};
            if (filters.minGpa) filterParams.min_gpa = parseFloat(filters.minGpa);
            if (filters.maxGpa) filterParams.max_gpa = parseFloat(filters.maxGpa);
            if (filters.program) filterParams.program = filters.program;
            if (filters.yearLevel) filterParams.year_level = filters.yearLevel;
            if (filters.riskLevel) filterParams.risk_level = filters.riskLevel;
            if (filters.hasGrades) filterParams.has_grades = filters.hasGrades === 'true';
            if (filters.schoolId) filterParams.school_id = parseInt(filters.schoolId);

            const response = await getStudentAcademicPerformance(filterParams);
            setStudents(response.data || []);
            setSummary(response.summary || {});
        } catch (error) {
            console.error('Failed to fetch academic performance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchData();
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            minGpa: '',
            maxGpa: '',
            program: '',
            yearLevel: '',
            riskLevel: '',
            hasGrades: '',
            schoolId: '',
        });
        setTimeout(fetchData, 100);
    };

    // Filter students by search
    const filteredStudents = students.filter(student => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            student.student_id_number?.toLowerCase().includes(searchLower) ||
            student.first_name?.toLowerCase().includes(searchLower) ||
            student.last_name?.toLowerCase().includes(searchLower) ||
            student.email?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">Loading academic performance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Performance</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Track student grades, GPA, and academic progress
                </p>
            </div>

            {/* Unique Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                    title="Average Grade"
                    value={formatGPA(summary?.average_gpa)}
                    subtitle="5-point scale (1.0 best)"
                    icon={GraduationCap}
                    color="blue"
                />
                <MetricCard
                    title="Students Tracked"
                    value={summary?.total_students || 0}
                    subtitle={`${summary?.with_grades || 0} with grades`}
                    icon={Users}
                    color="purple"
                />
                <MetricCard
                    title="At Risk"
                    value={summary?.at_risk || 0}
                    subtitle="Grade > 3.0 (failing)"
                    icon={AlertTriangle}
                    color="red"
                />
                <MetricCard
                    title="Top Performers"
                    value={summary?.top_performers || 0}
                    subtitle="Grade ≤ 1.5 (excellent)"
                    icon={Award}
                    color="green"
                />
                <MetricCard
                    title="Grade Submission"
                    value={`${summary?.with_grades || 0}/${summary?.total_students || 0}`}
                    subtitle={`${summary?.total_students > 0 ? Math.round((summary.with_grades / summary.total_students) * 100) : 0}% submitted`}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, name, or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Min Grade</label>
                            <input
                                type="number"
                                step="0.25"
                                min="1"
                                max="5"
                                value={filters.minGpa}
                                onChange={(e) => setFilters({ ...filters, minGpa: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="1.0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Grade</label>
                            <input
                                type="number"
                                step="0.25"
                                min="1"
                                max="5"
                                value={filters.maxGpa}
                                onChange={(e) => setFilters({ ...filters, maxGpa: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                placeholder="5.0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Risk Level</label>
                            <select
                                value={filters.riskLevel}
                                onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            >
                                <option value="">All</option>
                                <option value="high">High Risk</option>
                                <option value="medium">Medium Risk</option>
                                <option value="low">Low Risk</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Grade Status</label>
                            <select
                                value={filters.hasGrades}
                                onChange={(e) => setFilters({ ...filters, hasGrades: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            >
                                <option value="">All</option>
                                <option value="true">With Grades</option>
                                <option value="false">No Grades</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">School</label>
                            <select
                                value={filters.schoolId}
                                onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            >
                                <option value="">All Schools</option>
                                {schools.map((school) => (
                                    <option key={school.id} value={school.id}>
                                        {school.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Student Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">School</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Program</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grade</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grades</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Submission</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No students found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{student.student_id_number}</td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                                            {student.first_name} {student.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.school_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.program}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.year_level}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                                            {formatGPA(student.gpa)} <span className="text-xs text-slate-500">({getGradeLabel(student.gpa)})</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm"><RiskBadge level={student.risk_level} /></td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.grades_count} submitted</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(student.last_grade_submission)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => setSelectedStudent(student)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" />
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

            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
            )}
        </div>
    );
};

export default AcademicPerformanceReport;
