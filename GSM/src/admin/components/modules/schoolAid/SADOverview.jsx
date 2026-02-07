import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    HandCoins,
    Users,
    Clock,
    TrendingUp,
    Calendar,
    FileText,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileBarChart,
    X,
    Download
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { schoolAidService } from './services/schoolAidService';
import dashboardService from '../../../../services/dashboardService';

function SADOverview({ onPageChange, lastUpdated = null, onTabChange }) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [trends, setTrends] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [error, setError] = useState(null);
    const [availableSchoolYears, setAvailableSchoolYears] = useState([]);

    // Report Generation State
    const [showReportModal, setShowReportModal] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportFormat, setReportFormat] = useState('pdf');
    const [reportFilters, setReportFilters] = useState({
        startDate: '',
        endDate: ''
    });

    // Get current school year (format: YYYY-YYYY)
    const getCurrentSchoolYear = () => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        return `${currentYear}-${nextYear}`;
    };

    const [selectedSchoolYear, setSelectedSchoolYear] = useState(getCurrentSchoolYear());

    const fetchSchoolYears = async () => {
        try {
            const schoolYears = await schoolAidService.getAvailableSchoolYears();
            setAvailableSchoolYears(schoolYears);

            // If selected school year is not in the list, select the first available or current year
            if (schoolYears.length > 0) {
                const currentYear = getCurrentSchoolYear();
                if (!schoolYears.includes(selectedSchoolYear)) {
                    if (schoolYears.includes(currentYear)) {
                        setSelectedSchoolYear(currentYear);
                    } else {
                        setSelectedSchoolYear(schoolYears[0]);
                    }
                }
            } else {
                // If no school years with budgets, use current year as fallback
                const currentYear = getCurrentSchoolYear();
                setAvailableSchoolYears([currentYear]);
                setSelectedSchoolYear(currentYear);
            }
        } catch (err) {
            console.error('Error fetching school years:', err);
            // Fallback to current year if API fails
            const currentYear = getCurrentSchoolYear();
            setAvailableSchoolYears([currentYear]);
            setSelectedSchoolYear(currentYear);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [apiMetrics, analyticsData] = await Promise.all([
                schoolAidService.getMetrics({ school_year: selectedSchoolYear }),
                schoolAidService.getAnalyticsData('payments', '6m')
            ]);

            setMetrics(apiMetrics);

            // Process trends data from analytics if available
            if (analyticsData && analyticsData.dailyDisbursements && analyticsData.dailyDisbursements.length > 0) {
                // Use dailyDisbursements directly (last 30 days for better visualization)
                const recentDays = analyticsData.dailyDisbursements.slice(-30);
                const processedTrends = recentDays.map((day) => ({
                    name: day.date ? new Date(day.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'Unknown',
                    amount: parseFloat(day.amount) || 0
                }));
                setTrends(processedTrends);
            } else if (analyticsData && analyticsData.labels && analyticsData.datasets && analyticsData.datasets[0]) {
                // Fallback to old format
                const processedTrends = analyticsData.labels.map((label, index) => ({
                    name: label,
                    amount: parseFloat(analyticsData.datasets[0].data[index]) || 0
                }));
                setTrends(processedTrends);
            } else {
                // Empty trends if no data available
                setTrends([]);
            }

            // Process category distribution
            if (analyticsData && analyticsData.categoryDistribution && analyticsData.categoryDistribution.length > 0) {
                const total = analyticsData.categoryDistribution.reduce((sum, cat) => sum + (cat.value || 0), 0);
                const processedCategories = analyticsData.categoryDistribution.map((cat) => ({
                    name: cat.name || 'Other',
                    value: total > 0 ? Math.round((cat.value / total) * 100) : 0,
                    color: cat.color || '#3b82f6'
                }));
                setCategoryDistribution(processedCategories);
            } else {
                // Default empty distribution
                setCategoryDistribution([]);
            }

        } catch (err) {
            console.error('Error fetching SAD metrics:', err);
            setError('Failed to load metrics. Please try again.');
            // Set empty metrics on error
            setMetrics({
                need_processing: 0,
                need_disbursing: 0,
                disbursed_count: 0,
                total_disbursed: 0,
                total_budget: 0,
                remaining_budget: 0,
                utilization_rate: 0,
                budgets: {
                    scholarship_benefits: {
                        total_budget: 0,
                        disbursed: 0,
                        remaining: 0,
                        utilization_rate: 0
                    }
                }
            });
            setTrends([]);
            setCategoryDistribution([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available school years on component mount
    useEffect(() => {
        fetchSchoolYears();
    }, []);

    // Fetch data when school year changes
    useEffect(() => {
        if (availableSchoolYears.length > 0 || selectedSchoolYear) {
            fetchData();
        }
    }, [selectedSchoolYear]);

    // Refresh when lastUpdated changes (when grants are processed)
    useEffect(() => {
        if (lastUpdated) {
            fetchData();
        }
    }, [lastUpdated]);

    const stats = [
        {
            id: 'need_processing',
            title: 'Need Processing',
            value: metrics?.need_processing?.toLocaleString() || '0',
            icon: Clock,
            color: 'bg-amber-500',
            textColor: 'text-amber-600',
            description: 'Approved applications awaiting grant processing',
            targetTab: 'applications'
        }
    ];

    // Dynamically generate budget cards from metrics
    const getBudgetStats = () => {
        if (!metrics?.budgets) return [];

        const budgetConfigs = {
            scholarship_benefits: {
                title: 'Scholarship Budget',
                icon: FileText,
                color: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                description: 'Budget for merit, special, and renewal scholarship programs'
            },
            financial_support: {
                title: 'Financial Support Budget',
                icon: HandCoins,
                color: 'bg-emerald-500',
                textColor: 'text-emerald-600',
                description: 'Budget for need-based financial support programs'
            }
        };

        const budgetStats = [];

        // Iterate through all budget types in metrics
        Object.keys(metrics.budgets).forEach((budgetType) => {
            const budgetData = metrics.budgets[budgetType];
            const config = budgetConfigs[budgetType];

            // Only add card if budget exists (total_budget > 0) and config exists
            if (budgetData && budgetData.total_budget > 0 && config) {
                budgetStats.push({
                    id: budgetType,
                    title: config.title,
                    totalBudget: budgetData.total_budget || 0,
                    disbursed: budgetData.disbursed || 0,
                    remaining: budgetData.remaining || 0,
                    utilizationRate: budgetData.utilization_rate || 0,
                    icon: config.icon,
                    color: config.color,
                    textColor: config.textColor,
                    description: config.description
                });
            }
        });

        return budgetStats;
    };

    const budgetStats = getBudgetStats();

    // Use real category distribution data, fallback to empty if not loaded
    const distributionData = categoryDistribution.length > 0 ? categoryDistribution : [];

    const handleGenerateReport = () => {
        setShowReportModal(true);
    };

    const handleConfirmGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            let reportData = {
                overview: {
                    disbursedAmount: metrics?.total_disbursed || 0,
                    disbursedCount: metrics?.disbursed_count || 0,
                    totalApplications: metrics?.need_processing + metrics?.need_disbursing + metrics?.disbursed_count
                },
                schoolYear: selectedSchoolYear
            };

            if (reportFilters.startDate && reportFilters.endDate) {
                const analytics = await schoolAidService.getAnalyticsData('payments', 'custom', {
                    startDate: reportFilters.startDate,
                    endDate: reportFilters.endDate
                });

                if (analytics && analytics.dailyDisbursements) {
                    const totalAmount = analytics.dailyDisbursements.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    const totalCount = analytics.dailyDisbursements.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);

                    reportData.overview.disbursedAmount = totalAmount;
                    reportData.overview.disbursedCount = totalCount;
                }
                reportData.dateRange = { start: reportFilters.startDate, end: reportFilters.endDate };
            }

            if (reportFormat === 'csv') {
                await dashboardService.generateCSVReport('disbursements', reportData);
            } else {
                // Client-side PDF generation with encryption support

                // Dynamically import jsPDF to avoid bundling issues
                const jspdfModule = await import('jspdf');

                // Robust constructor detection
                let JsPDFConstructor;
                if (typeof jspdfModule.jsPDF === 'function') {
                    JsPDFConstructor = jspdfModule.jsPDF;
                } else if (typeof jspdfModule.default === 'function') {
                    JsPDFConstructor = jspdfModule.default;
                } else if (jspdfModule.default && typeof jspdfModule.default.jsPDF === 'function') {
                    JsPDFConstructor = jspdfModule.default.jsPDF;
                } else if (jspdfModule.default && typeof jspdfModule.default.default === 'function') {
                    JsPDFConstructor = jspdfModule.default.default;
                } else {
                    throw new Error('Failed to locate jsPDF constructor');
                }

                // Import autotable plugin
                const autoTableModule = await import('jspdf-autotable');
                const autoTable = autoTableModule.default || autoTableModule.applyPlugin || autoTableModule;

                // Configure PDF options
                const pdfOptions = { orientation: 'portrait' };

                const doc = new JsPDFConstructor(pdfOptions);

                // Apply plugin
                if (typeof autoTable === 'function' && !doc.autoTable) {
                    try {
                        autoTable.default?.(doc) || autoTable(doc);
                    } catch (e) {
                        console.log('autoTable plugin application attempt:', e.message);
                    }
                }

                // Add content to PDF
                const timestamp = new Date().toLocaleString();

                // Header
                doc.setFontSize(22);
                doc.setTextColor(40);
                doc.text("Aid Distribution Report", 105, 20, { align: 'center' });

                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text(`School Year: ${reportData.schoolYear}`, 105, 30, { align: 'center' });
                if (reportData.dateRange) {
                    doc.text(`Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 105, 36, { align: 'center' });
                }
                doc.text(`Generated on: ${timestamp}`, 105, 42, { align: 'center' });

                // Divider
                doc.setLineWidth(0.5);
                doc.setDrawColor(200);
                doc.line(20, 48, 190, 48);

                // Summary Stats
                doc.setFontSize(14);
                doc.setTextColor(60);
                doc.text("Disbursement Summary", 20, 60);

                const summaryData = [
                    ['Total Disbursed Amount', `P ${reportData.overview.disbursedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
                    ['Total Disbursed Count', reportData.overview.disbursedCount.toString()],
                    ['Total Applications', reportData.overview.totalApplications?.toString() || 'N/A']
                ];

                autoTable(doc, {
                    startY: 65,
                    head: [],
                    body: summaryData,
                    theme: 'plain',
                    styles: { fontSize: 11, cellPadding: 3 },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 80 },
                        1: { cellWidth: 'auto' }
                    }
                });

                // Budget Utilization (if available details)
                if (metrics?.budgets) {
                    const budgetRows = Object.entries(metrics.budgets).map(([key, data]) => {
                        const name = key === 'scholarship_benefits' ? 'Scholarship Benefits' : 'Financial Support';
                        return [
                            name,
                            `P ${data.total_budget?.toLocaleString() || '0'}`,
                            `P ${data.disbursed?.toLocaleString() || '0'}`,
                            `P ${data.remaining?.toLocaleString() || '0'}`,
                            `${data.utilization_rate?.toFixed(1) || '0'}%`
                        ];
                    });

                    if (budgetRows.length > 0) {
                        const finalY = doc.lastAutoTable.finalY || 100;
                        doc.text("Budget Utilization", 20, finalY + 15);

                        autoTable(doc, {
                            startY: finalY + 20,
                            head: [['Budget Type', 'Total Allocation', 'Disbursed', 'Remaining', 'Utilization']],
                            body: budgetRows,
                            theme: 'striped',
                            headStyles: { fillColor: [59, 130, 246] },
                            styles: { fontSize: 9 }
                        });
                    }
                }

                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(`Page ${i} of ${pageCount}`, 20, 280);
                    doc.text("Confidential - School Aid Module", 190, 280, { align: 'right' });
                }

                doc.save(`aid_distribution_report_${new Date().toISOString().split('T')[0]}.pdf`);
            }
            setShowReportModal(false);
        } catch (err) {
            console.error('Report generation failed', err);
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-slate-600 dark:text-slate-400 font-medium">Loading Overview...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                        <HandCoins className="w-8 h-8 text-blue-600 mr-3" />
                        Aid Distribution Overview
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Real-time summary of grant processing and fund disbursements
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* School Year Selector */}
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mr-2">School Year:</label>
                        <select
                            value={selectedSchoolYear}
                            onChange={(e) => setSelectedSchoolYear(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-0 cursor-pointer"
                            disabled={availableSchoolYears.length === 0}
                        >
                            {availableSchoolYears.length > 0 ? (
                                availableSchoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))
                            ) : (
                                <option value={selectedSchoolYear}>{selectedSchoolYear}</option>
                            )}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm"
                    >
                        <FileBarChart className="w-4 h-4 mr-2" />
                        Generate Disbursement Report
                    </button>
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
                        <Calendar className="w-4 h-4 text-slate-500 mr-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => {
                            // Navigate to Processing Grants tab when card is clicked
                            if (stat.id === 'need_processing' && onTabChange) {
                                onTabChange('applications');
                            } else if (onPageChange) {
                                onPageChange(stat.targetTab || 'applications');
                            }
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`${stat.color} p-3 rounded-xl shadow-sm text-white transform group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div
                                className="flex items-center text-slate-400 group-hover:text-blue-500 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to Processing Grants tab when arrow is clicked
                                    if (stat.id === 'need_processing' && onTabChange) {
                                        onTabChange('applications');
                                    } else if (onPageChange) {
                                        onPageChange(stat.targetTab || 'applications');
                                    }
                                }}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">{stat.description}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.color} bg-opacity-10 ${stat.textColor}`}>
                                {stat.id === 'need_processing' ? 'Awaiting Action' : stat.id === 'need_disbursing' ? 'In Progress' : 'Completed'}
                            </span>
                            <span className="text-[10px] text-slate-400">Updated just now</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget Cards */}
            {budgetStats.length > 0 && (
                <div className="grid grid-cols-1 gap-6 mt-6">
                    {budgetStats.map((budget, index) => {
                        const Icon = budget.icon;
                        const remainingPercent = budget.totalBudget > 0
                            ? (budget.remaining / budget.totalBudget) * 100
                            : 0;

                        return (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${budget.color} p-3 rounded-xl shadow-sm text-white`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${budget.color} bg-opacity-10 ${budget.textColor}`}>
                                        {budget.utilizationRate.toFixed(1)}% Used
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        {budget.title}
                                    </p>
                                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                        ₱{budget.totalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{budget.description}</p>
                                </div>

                                {/* Budget Breakdown */}
                                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Total Budget</span>
                                        <span className="font-semibold text-slate-800 dark:text-white">
                                            ₱{budget.totalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Disbursed</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            ₱{budget.disbursed.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Remaining</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            ₱{budget.remaining.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`${budget.color} h-2 rounded-full transition-all duration-300`}
                                                style={{ width: `${remainingPercent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Remaining: {remainingPercent.toFixed(1)}%</span>
                                            <span>Used: {budget.utilizationRate.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Disbursement Trends */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                            <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                            Disbursement Trends
                        </h3>
                        <div className="text-xs font-semibold text-slate-400 uppercase">Last 6 Months</div>
                    </div>
                    <div className="h-[300px]">
                        {trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
                                            if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
                                            return `₱${value}`;
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            backgroundColor: '#fff'
                                        }}
                                        formatter={(value) => [`₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Disbursed']}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={trends.length > 30 ? 20 : 40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No disbursement trends data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Aid Type Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                            <FileText className="w-5 h-5 text-purple-500 mr-2" />
                            Aid Type Distribution
                        </h3>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        {distributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value) => `${value}%`}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        layout="horizontal"
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No category data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Stages */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Distribution Lifecycle</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                    {/* Visual Journey */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -translate-y-1/2 hidden md:block"></div>

                    {[
                        { label: 'Approved', count: metrics?.need_processing, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Processing', count: metrics?.need_disbursing, icon: Loader2, iconClass: 'animate-spin-slow', color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Disbursed', count: metrics?.disbursed_count, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                    ].map((stage, idx) => (
                        <div key={idx} className="flex flex-col items-center relative z-10 bg-white dark:bg-slate-800 px-4">
                            <div className={`w-12 h-12 ${stage.bg} dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 border-2 border-white dark:border-slate-800 shadow-sm`}>
                                <stage.icon className={`w-6 h-6 ${stage.color} ${stage.iconClass || ''}`} />
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{stage.label}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{stage.count || 0} Accounts</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Report Generation Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence mode="wait">
                    {showReportModal && (
                        <motion.div
                            key="report-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
                            onClick={() => setShowReportModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-y-auto"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <FileBarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Generate Report</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Configure report settings</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowReportModal(false)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Date Range (Optional)
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={reportFilters.startDate}
                                                        onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={reportFilters.endDate}
                                                        onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Leave empty to generate report for current school year ({selectedSchoolYear}).
                                            </p>
                                        </div>



                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Format
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setReportFormat('pdf')}
                                                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all ${reportFormat === 'pdf'
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 ring-1 ring-red-500/20'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <FileText className="w-5 h-5" />
                                                    <span className="font-medium">PDF Document</span>
                                                </button>
                                                <button
                                                    onClick={() => setReportFormat('csv')}
                                                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all ${reportFormat === 'csv'
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 ring-1 ring-green-500/20'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <FileBarChart className="w-5 h-5" />
                                                    <span className="font-medium">CSV Spreadsheet</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                                        <button
                                            onClick={() => setShowReportModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirmGenerateReport}
                                            disabled={generatingReport}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generatingReport ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Report
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

export default SADOverview;
