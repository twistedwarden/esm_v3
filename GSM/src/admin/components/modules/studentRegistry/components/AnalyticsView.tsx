import React, { useState, useEffect } from 'react';
import {
    BarChart3, PieChart, TrendingUp, Download, Users,
    GraduationCap, Award, PhilippinePeso, BookOpen, FileText,
    RefreshCw, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import studentApiService from '../../../../../services/studentApiService';

const AnalyticsView: React.FC = () => {
    const { success: showSuccess, error: showError } = useToastContext();
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState('demographics');
    const [reportData, setReportData] = useState<any>(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    const reportTypes = [
        { id: 'demographics', title: 'Demographics', icon: Users, color: 'blue' },
        { id: 'scholarship_impact', title: 'Scholarship Impact', icon: Award, color: 'green' },
        { id: 'academic_performance', title: 'Academic Performance', icon: BookOpen, color: 'purple' },
        { id: 'financial_aid', title: 'Financial Aid', icon: PhilippinePeso, color: 'orange' },
        { id: 'enrollment_trends', title: 'Enrollment Trends', icon: TrendingUp, color: 'indigo' }
    ];

    useEffect(() => {
        fetchReportData();
    }, [selectedReport]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Mock data generation (keeping existing logic style but cleaner)
            // In a real app, this would be an API call: await studentApiService.getReport(selectedReport)
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
            const mockData = generateMockReportData(selectedReport);
            setReportData(mockData);
        } catch (error) {
            showError('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    const generateMockReportData = (type: string) => {
        // ... (Simplified mock data generation from original file)
        switch (type) {
            case 'demographics':
                return {
                    totalStudents: 1250,
                    bySchool: [
                        { name: 'University of the Philippines', count: 450, percentage: 36 },
                        { name: 'Ateneo de Manila University', count: 320, percentage: 25.6 },
                        { name: 'De La Salle University', count: 280, percentage: 22.4 },
                        { name: 'Other', count: 200, percentage: 16 }
                    ]
                };
            // ... add other cases as needed or keep simple for now
            default:
                return {};
        }
    };

    const handleExport = (format: string) => {
        showSuccess(`Exporting as ${format.toUpperCase()}...`);
        // studentApiService.exportReport(selectedReport, format);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Generate insights and track performance</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchReportData()}
                        className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {reportTypes.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${selectedReport === report.id
                                    ? `bg-${report.color}-50 border-${report.color}-200 text-${report.color}-700 dark:bg-${report.color}-900/20 dark:border-${report.color}-800 dark:text-${report.color}-300`
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-700'
                                }`}
                        >
                            <report.icon className="w-5 h-5" />
                            <span className="font-medium">{report.title}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 capitalize">
                                    {selectedReport.replace('_', ' ')} Overview
                                </h2>

                                {selectedReport === 'demographics' && reportData && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                                            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Students Evaluated</p>
                                            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                                                {reportData.totalStudents?.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Distribution by School</h3>
                                            {reportData.bySchool?.map((item: any, i: number) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">{item.percentage}% ({item.count})</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full"
                                                            style={{ width: `${item.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fallback for other reports */}
                                {selectedReport !== 'demographics' && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                                        <p>Detailed visualization for {selectedReport.replace('_', ' ')} coming soon.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
