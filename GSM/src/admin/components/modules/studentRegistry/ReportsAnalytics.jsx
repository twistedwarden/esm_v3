import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  GraduationCap,
  Award,
  DollarSign,
  BookOpen,
  MapPin,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { LoadingData } from '../../ui/LoadingSpinner';
import studentApiService from '../../../../services/studentApiService';

function ReportsAnalytics() {
    const { showSuccess, showError } = useToastContext();
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState('demographics');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    const reportTypes = [
        {
            id: 'demographics',
            title: 'Student Demographics',
            description: 'Distribution by school, program, year level',
            icon: Users,
            color: 'blue'
        },
        {
            id: 'scholarship_impact',
            title: 'Scholarship Impact',
            description: 'Scholars vs non-scholars, retention rates',
            icon: Award,
            color: 'green'
        },
        {
            id: 'academic_performance',
            title: 'Academic Performance',
            description: 'GPA trends, graduation rates',
            icon: BookOpen,
            color: 'purple'
        },
        {
            id: 'financial_aid',
            title: 'Financial Aid Report',
            description: 'Total aid distributed, average per student',
            icon: DollarSign,
            color: 'orange'
        },
        {
            id: 'enrollment_trends',
            title: 'Enrollment Trends',
            description: 'Historical data, projections',
            icon: TrendingUp,
            color: 'indigo'
        }
    ];

    useEffect(() => {
        fetchReportData();
    }, [selectedReport, dateRange]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Mock data for demonstration
            const mockData = generateMockReportData(selectedReport);
            setReportData(mockData);
        } catch (error) {
            console.error('Error fetching report data:', error);
            showError('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    const generateMockReportData = (reportType) => {
        switch (reportType) {
            case 'demographics':
                return {
                    totalStudents: 1250,
                    bySchool: [
                        { name: 'University of the Philippines', count: 450, percentage: 36 },
                        { name: 'Ateneo de Manila University', count: 320, percentage: 25.6 },
                        { name: 'De La Salle University', count: 280, percentage: 22.4 },
                        { name: 'University of Santo Tomas', count: 200, percentage: 16 }
                    ],
                    byProgram: [
                        { name: 'Computer Science', count: 300, percentage: 24 },
                        { name: 'Engineering', count: 280, percentage: 22.4 },
                        { name: 'Business Administration', count: 250, percentage: 20 },
                        { name: 'Medicine', count: 200, percentage: 16 },
                        { name: 'Others', count: 220, percentage: 17.6 }
                    ],
                    byYearLevel: [
                        { name: '1st Year', count: 350, percentage: 28 },
                        { name: '2nd Year', count: 320, percentage: 25.6 },
                        { name: '3rd Year', count: 300, percentage: 24 },
                        { name: '4th Year', count: 280, percentage: 22.4 }
                    ]
                };
            case 'scholarship_impact':
                return {
                    totalScholars: 340,
                    totalNonScholars: 910,
                    retentionRate: 85.2,
                    graduationRate: 78.5,
                    averageGPAScholars: 3.4,
                    averageGPANonScholars: 3.1,
                    impactMetrics: [
                        { metric: 'Retention Rate', scholars: 85.2, nonScholars: 72.1, difference: 13.1 },
                        { metric: 'Graduation Rate', scholars: 78.5, nonScholars: 65.3, difference: 13.2 },
                        { metric: 'Average GPA', scholars: 3.4, nonScholars: 3.1, difference: 0.3 }
                    ]
                };
            case 'academic_performance':
                return {
                    averageGPA: 3.2,
                    gpaDistribution: [
                        { range: '3.5-4.0', count: 180, percentage: 14.4 },
                        { range: '3.0-3.4', count: 450, percentage: 36 },
                        { range: '2.5-2.9', count: 420, percentage: 33.6 },
                        { range: '2.0-2.4', count: 150, percentage: 12 },
                        { range: 'Below 2.0', count: 50, percentage: 4 }
                    ],
                    graduationRates: [
                        { year: '2020', rate: 75.2 },
                        { year: '2021', rate: 78.5 },
                        { year: '2022', rate: 82.1 },
                        { year: '2023', rate: 85.3 }
                    ],
                    topPerformingPrograms: [
                        { program: 'Computer Science', averageGPA: 3.5, graduationRate: 88.2 },
                        { program: 'Engineering', averageGPA: 3.3, graduationRate: 82.5 },
                        { program: 'Medicine', averageGPA: 3.4, graduationRate: 90.1 }
                    ]
                };
            case 'financial_aid':
                return {
                    totalAidDistributed: 15750000,
                    averagePerStudent: 46324,
                    byType: [
                        { type: 'Merit Scholarships', amount: 8500000, count: 200, average: 42500 },
                        { type: 'Need-Based Grants', amount: 4500000, count: 120, average: 37500 },
                        { type: 'Athletic Scholarships', amount: 2000000, count: 50, average: 40000 },
                        { type: 'Research Grants', amount: 750000, count: 25, average: 30000 }
                    ],
                    monthlyDistribution: [
                        { month: 'Jan', amount: 1200000 },
                        { month: 'Feb', amount: 1350000 },
                        { month: 'Mar', amount: 1400000 },
                        { month: 'Apr', amount: 1300000 },
                        { month: 'May', amount: 1250000 },
                        { month: 'Jun', amount: 1100000 }
                    ]
                };
            case 'enrollment_trends':
                return {
                    currentEnrollment: 1250,
                    previousYearEnrollment: 1180,
                    growthRate: 5.9,
                    monthlyTrends: [
                        { month: 'Jan 2023', enrollment: 1100 },
                        { month: 'Feb 2023', enrollment: 1120 },
                        { month: 'Mar 2023', enrollment: 1150 },
                        { month: 'Apr 2023', enrollment: 1180 },
                        { month: 'May 2023', enrollment: 1200 },
                        { month: 'Jun 2023', enrollment: 1250 }
                    ],
                    projectedEnrollment: [
                        { month: 'Jul 2024', projected: 1280 },
                        { month: 'Aug 2024', projected: 1320 },
                        { month: 'Sep 2024', projected: 1350 },
                        { month: 'Oct 2024', projected: 1380 }
                    ]
                };
            default:
                return null;
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            // Simulate report generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            showSuccess('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            showError('Failed to generate report');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReport = (format) => {
        showSuccess(`Report exported as ${format.toUpperCase()}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const renderReportContent = () => {
        // Show report content when report data is available
        if (!reportData) {
            return null;
        }

        switch (selectedReport) {
            case 'demographics':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By School</h3>
                                <div className="space-y-3">
                                    {reportData.bySchool.map((school, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    index === 0 ? 'bg-blue-500' :
                                                    index === 1 ? 'bg-green-500' :
                                                    index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                                                }`} />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {school.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {school.count}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    ({school.percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Program</h3>
                                <div className="space-y-3">
                                    {reportData.byProgram.map((program, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    index === 0 ? 'bg-blue-500' :
                                                    index === 1 ? 'bg-green-500' :
                                                    index === 2 ? 'bg-orange-500' :
                                                    index === 3 ? 'bg-purple-500' : 'bg-pink-500'
                                                }`} />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {program.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {program.count}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    ({program.percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Year Level</h3>
                                <div className="space-y-3">
                                    {reportData.byYearLevel.map((year, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    index === 0 ? 'bg-blue-500' :
                                                    index === 1 ? 'bg-green-500' :
                                                    index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                                                }`} />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {year.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {year.count}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    ({year.percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'scholarship_impact':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scholars</p>
                                        <p className="text-3xl font-bold text-blue-600">{reportData.totalScholars}</p>
                                    </div>
                                    <Award className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retention Rate</p>
                                        <p className="text-3xl font-bold text-green-600">{reportData.retentionRate}%</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Graduation Rate</p>
                                        <p className="text-3xl font-bold text-purple-600">{reportData.graduationRate}%</p>
                                    </div>
                                    <GraduationCap className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg GPA</p>
                                        <p className="text-3xl font-bold text-orange-600">{reportData.averageGPAScholars}</p>
                                    </div>
                                    <BookOpen className="w-8 h-8 text-orange-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Impact Comparison</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Metric
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Scholars
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Non-Scholars
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Difference
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {reportData.impactMetrics.map((metric, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {metric.metric}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {metric.scholars}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {metric.nonScholars}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                    +{metric.difference}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'financial_aid':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Aid Distributed</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(reportData.totalAidDistributed)}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Per Student</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(reportData.averagePerStudent)}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recipients</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {reportData.byType.reduce((sum, type) => sum + type.count, 0)}
                                        </p>
                                    </div>
                                    <Award className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aid by Type</h3>
                            <div className="space-y-4">
                                {reportData.byType.map((type, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{type.type}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {type.count} recipients • Avg: {formatCurrency(type.average)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(type.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Report Content</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Report data will be displayed here
                        </p>
                    </div>
                );
        }
    };

    if (loading) {
        return <LoadingData />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Generate comprehensive reports and analytics
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                        {generatingReport ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        <span>{generatingReport ? 'Generating...' : 'Generate Report'}</span>
                    </button>
                </div>
            </div>

            {/* Report Type Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Report Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTypes.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                                selectedReport === report.id
                                    ? `border-${report.color}-500 bg-${report.color}-50 dark:bg-${report.color}-900/20`
                                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                            }`}
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <report.icon className={`w-6 h-6 text-${report.color}-600`} />
                                <h4 className="font-medium text-gray-900 dark:text-white">{report.title}</h4>
                    </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date Range</h3>
                <div className="flex items-center space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <motion.div
                key={selectedReport}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {renderReportContent()}
            </motion.div>

            {/* Export Options */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Options</h3>
                <div className="flex items-center space-x-4">
                        <button
                        onClick={() => handleExportReport('pdf')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                        <FileText className="w-4 h-4" />
                        <span>Export PDF</span>
                        </button>
                        <button
                        onClick={() => handleExportReport('excel')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        <span>Export Excel</span>
                        </button>
                        <button
                        onClick={() => handleExportReport('csv')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                        </button>
                </div>
            </div>
        </div>
    );
}

export default ReportsAnalytics;