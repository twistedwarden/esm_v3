import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, FileText, PhilippinePeso, Activity, Users, Send, X, Download, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from './MetricCard';
import ActionCenter from './ActionCenter';
import ContextPanel from './ContextPanel';
import { dashboardService } from '../../../../../services/dashboardService';

const StreamlinedDashboard = ({ onPageChange }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportFilters, setReportFilters] = useState({
        startDate: '',
        endDate: ''
    });
    const [reportFormat, setReportFormat] = useState('pdf');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch real data from Scholarship and Aid services
            const dashboardData = await dashboardService.getAllDashboardData();
            setData(dashboardData);
            setError(null);
        } catch (err) {
            console.error("Dashboard load failed", err);
            setError("Using offline mode");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (type) => {
        setGeneratingReport(true);
        try {
            let reportData = data;

            // If filters are active, fetch specific data for the report
            if (reportFilters.startDate && reportFilters.endDate) {
                const [filteredOverview, filteredTrends] = await Promise.all([
                    dashboardService.getDashboardOverview({
                        startDate: reportFilters.startDate,
                        endDate: reportFilters.endDate
                    }),
                    dashboardService.getApplicationTrends({
                        startDate: reportFilters.startDate,
                        endDate: reportFilters.endDate
                    })
                ]);

                // Merge filtered data into report data
                reportData = {
                    ...data,
                    overview: { ...data.overview, ...filteredOverview },
                    applicationTrends: filteredTrends
                };
            }

            if (reportFormat === 'csv') {
                await dashboardService.generateCSVReport(type, reportData);
            } else {
                await dashboardService.generatePDFReport(type, reportData, reportFilters.password);
            }
            setShowReportModal(false);
        } catch (err) {
            console.error("Report generation failed", err);
        } finally {
            setGeneratingReport(false);
        }
    };

    // Safe data accessors
    const overview = data?.overview || {};
    const trends = data?.applicationTrends?.monthly || [];

    // Transform data for UI
    // Actionable: Applications needing review, interviews, etc.
    // Critical: Rejected or Compliance flagged
    const metrics = [
        {
            label: "Actionable Backlog",
            value: overview.actionable_count || 0,
            subtext: "Applications in workflow",
            status: (overview.actionable_count > 50) ? 'warning' : 'good',
            icon: Clock
        },
        {
            label: "Critical Issues",
            value: overview.critical_count || 0,
            subtext: "Require resolution",
            status: (overview.critical_count > 0) ? 'critical' : 'good',
            icon: AlertTriangle
        },
        {
            label: "Processing Speed",
            value: `${overview.processingSpeed || 0} Days`,
            subtext: "Avg time to approve",
            status: 'good',
            trend: 1,
            icon: Activity
        },
        {
            label: "Disbursed (Cycle)",
            value: (overview.disbursedAmount || 0) >= 1000000
                ? `₱${((overview.disbursedAmount || 0) / 1000000).toFixed(1)}M`
                : `₱${((overview.disbursedAmount || 0) / 1000).toFixed(1)}K`,
            subtext: `${overview.disbursedCount || 0} accounts disbursed`,
            status: 'neutral',
            icon: Send
        }
    ];

    // Priority Action Items (Focus on real-time backlog)
    const actionItems = [];

    if (overview.pendingReview > 0 || overview.actionable_count > 0) {
        actionItems.push({
            title: "Review Backlog",
            description: `${overview.actionable_count || overview.pendingReview || 0} applications pending next workflow steps`,
            timeAgo: "Live",
            type: "stale_application",
            priority: "high"
        });
    }

    if (overview.critical_count > 0) {
        actionItems.push({
            title: "Critical Resolution Needed",
            description: `${overview.critical_count} applications flagged for compliance or rejection review`,
            timeAgo: "Urgent",
            type: "payment_failed",
            priority: "high"
        });
    }

    // Map trends to Chart Data
    const weeklyData = {
        labels: trends.map(t => t.month),
        new: trends.map(t => t.applications),
        approved: trends.map(t => t.approved)
    };

    const upcomingInterviews = Array(Math.min(overview.interviewsScheduled || 0, 3)).fill(null).map((_, i) => ({
        time: "Upcoming",
        candidate: `Scheduled Application ${i + 1}`,
        type: "Interview"
    }));

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Status: <span className="text-green-600 font-medium lowercase">● connected to services</span> • {new Date().toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={fetchData} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white border border-gray-200 shadow-sm">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Pulse Row (Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => (
                    <MetricCard key={idx} {...metric} />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action Center (2/3 width) */}
                <div className="lg:col-span-2">
                    <ActionCenter items={actionItems} />
                </div>

                {/* Operational Context (1/3 width) */}
                <div className="lg:col-span-1">
                    <ContextPanel weeklyData={weeklyData} upcomingInterviews={upcomingInterviews} />
                </div>
            </div>

            {/* Quick Actions Integration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Functional Controls</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => onPageChange('scholarship-applications', 'applications')}
                        className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 group"
                    >
                        <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">Review Applications</span>
                    </button>

                    <button
                        onClick={() => onPageChange('sad-overview')}
                        className="flex items-center space-x-3 p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all border border-purple-100 group"
                    >
                        <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                            <PhilippinePeso className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">Process Grants</span>
                    </button>

                    <button
                        onClick={() => onPageChange('scholarship-programs')}
                        className="flex items-center space-x-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 group"
                    >
                        <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">Manage Categories</span>
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center space-x-3 p-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all border border-gray-100 group"
                    >
                        <div className="p-2 bg-gray-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                            <Send className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">Generate Reports</span>
                    </button>
                </div>
            </div>

            {/* Report Selection Modal */}
            {createPortal(
                <AnimatePresence>
                    {showReportModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Generate Report
                                    </h3>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <p className="text-slate-500 text-sm">Select the type of report and format you'd like to generate.</p>

                                    {/* Date Filters */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={reportFilters.startDate}
                                                onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={reportFilters.endDate}
                                                onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                            <label className="block text-xs font-semibold text-slate-500 mb-2">Export Format</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="reportFormat"
                                                        value="pdf"
                                                        checked={reportFormat === 'pdf'}
                                                        onChange={(e) => setReportFormat(e.target.value)}
                                                        className="text-blue-600 focus:ring-blue-500"
                                                    />
                                                    PDF Document
                                                </label>
                                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="reportFormat"
                                                        value="csv"
                                                        checked={reportFormat === 'csv'}
                                                        onChange={(e) => setReportFormat(e.target.value)}
                                                        className="text-blue-600 focus:ring-blue-500"
                                                    />
                                                    CSV Spreadsheet
                                                </label>
                                            </div>
                                        </div>
                                        {reportFormat === 'pdf' && (
                                            <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                    Password Protection (Optional)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="password"
                                                        value={reportFilters.password || ''}
                                                        onChange={(e) => setReportFilters(prev => ({ ...prev, password: e.target.value }))}
                                                        placeholder="Enter password to encrypt PDF"
                                                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                                                    />
                                                    <Lock className="w-4 h-4 text-slate-400 absolute right-2 top-1.5" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    Leave blank for an unprotected PDF.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'general', title: 'General Overview', desc: 'Summary of all key metrics and performance.', icon: Activity, color: 'blue' },
                                            { id: 'applications', title: 'Applications Report', desc: 'Detailed breakdown of application statuses.', icon: FileText, color: 'purple' },
                                            { id: 'disbursements', title: 'Financial Aid Report', desc: 'Summary of budget utilization and grants.', icon: PhilippinePeso, color: 'emerald' },
                                            { id: 'schools', title: 'Partner Schools Report', desc: 'Distribution of scholars across institutions.', icon: Users, color: 'orange' }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => handleGenerateReport(type.id)}
                                                disabled={generatingReport}
                                                className="flex items-center gap-4 p-4 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50"
                                            >
                                                <div className={`p-3 bg-${type.color}-100 text-${type.color}-600 rounded-lg group-hover:scale-110 transition-transform`}>
                                                    <type.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900">{type.title}</h4>
                                                    <p className="text-xs text-slate-500">{type.desc}</p>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {generatingReport && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="text-sm font-bold text-slate-700">Preparing your PDF...</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default StreamlinedDashboard;
