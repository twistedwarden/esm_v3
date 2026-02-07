import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, CheckCircle, Clock, DollarSign,
    Download, RefreshCw, Brain, Sparkles, AlertCircle, XCircle, GraduationCap
} from 'lucide-react';
import { getComprehensiveAnalytics, generateGeminiInsights, type ComprehensiveAnalytics } from '../../services/scholarshipAnalyticsService';

const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
};

interface AdvancedAnalyticsDashboardProps {
    token?: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = () => {
    const [analyticsData, setAnalyticsData] = useState<ComprehensiveAnalytics | null>(null);
    const [geminiInsights, setGeminiInsights] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'year' | 'quarter' | 'month'>('all');
    const [selectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedTimeRange]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const data = await getComprehensiveAnalytics(selectedTimeRange, selectedCategory);
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalyticsData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInsights = async () => {
        if (!analyticsData) return;

        setInsightsLoading(true);
        try {
            const insights = await generateGeminiInsights(analyticsData);
            setGeminiInsights(insights);
        } catch (error) {
            console.error('Error generating insights:', error);
        } finally {
            setInsightsLoading(false);
        }
    };

    const dataToUse = analyticsData || {
        failureReasons: [],
        financialDistribution: [],
        familyBackgroundImpact: [],
        gpaVsApproval: [],
        monthlyTrends: [],
        documentCompleteness: [],
        summary: {
            totalApplications: 0,
            approvalRate: 0,
            avgProcessingTime: 0,
            totalAidDistributed: 0
        }
    } as unknown as ComprehensiveAnalytics;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border-2 border-blue-200 dark:border-blue-700">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.name}:</span> {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const GeminiInsightPanel = () => (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gemini AI Insights</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered analysis of scholarship patterns</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerateInsights}
                    disabled={insightsLoading || !analyticsData}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                    {insightsLoading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Insights</span>
                        </>
                    )}
                </button>
            </div>

            {geminiInsights && (
                <div className="space-y-4 mt-6">
                    {geminiInsights.keyFindings?.length > 0 ? (
                        geminiInsights.keyFindings.map((finding: any, index: number) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{finding.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{finding.description}</p>
                                        {finding.recommendation && (
                                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-600">
                                                <p className="text-sm text-purple-900 dark:text-purple-300">
                                                    <strong>Recommendation:</strong> {finding.recommendation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-4 text-slate-500">
                            No insights generated. Click "Generate Insights" to analyze your data.
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (loading && !analyticsData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading analytics...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Fetching real-time data from database</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Scholarship Analytics Dashboard</h2>
                        <p className="text-blue-100">Real-time insights powered by AI • Live database analytics</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                            className="px-4 py-2.5 border-2 border-white/30 rounded-lg bg-white/10 backdrop-blur-sm text-white font-medium hover:bg-white/20 transition-all cursor-pointer"
                        >
                            <option value="all" className="text-gray-900">All Time</option>
                            <option value="year" className="text-gray-900">This Year</option>
                            <option value="quarter" className="text-gray-900">This Quarter</option>
                            <option value="month" className="text-gray-900">This Month</option>
                        </select>
                        <button
                            onClick={fetchAnalyticsData}
                            className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2 border-2 border-white/30"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="font-medium">Refresh</span>
                        </button>
                        <button className="px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all flex items-center space-x-2 font-medium shadow-lg">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Applications</p>
                            <h3 className="text-3xl font-bold text-white">{dataToUse.summary?.totalApplications || 0}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium mb-1">Approval Rate</p>
                            <h3 className="text-3xl font-bold text-white">{dataToUse.summary?.approvalRate || 0}%</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Avg. Processing Time</p>
                            <h3 className="text-3xl font-bold text-white">{dataToUse.summary?.avgProcessingTime || 0} <span className="text-lg">days</span></h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Clock className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm font-medium mb-1">Total Aid Distributed</p>
                            <h3 className="text-2xl font-bold text-white">₱{(dataToUse.summary?.totalAidDistributed || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gemini AI Insights */}
            <GeminiInsightPanel />

            {/* Enhanced Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Rejection Reasons */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            Top Rejection Reasons
                        </h3>
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full font-medium">
                            {dataToUse.failureReasons?.length || 0} Reasons
                        </span>
                    </div>
                    {dataToUse.failureReasons?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={dataToUse.failureReasons}>
                                <defs>
                                    <linearGradient id="rejectionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                <XAxis
                                    dataKey="reason"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={120}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill="url(#rejectionGradient)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <XCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No rejection data available</p>
                                <p className="text-sm mt-1">Data will appear as applications are processed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Financial Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            Approval by Family Income
                        </h3>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-medium">
                            Income Analysis
                        </span>
                    </div>
                    {dataToUse.financialDistribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={dataToUse.financialDistribution}>
                                <defs>
                                    <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                                    </linearGradient>
                                    <linearGradient id="rejectedGradient2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                                <Bar dataKey="approved" fill="url(#approvedGradient)" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="rejected" fill="url(#rejectedGradient2)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <DollarSign className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No financial data available</p>
                                <p className="text-sm mt-1">Data will appear as applications are processed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* GPA Impact */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                            GPA Impact on Approval
                        </h3>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                            Academic Performance
                        </span>
                    </div>
                    {dataToUse.gpaVsApproval?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={dataToUse.gpaVsApproval}>
                                <defs>
                                    <linearGradient id="gpaApprovedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="gpaRejectedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                <XAxis dataKey="gpa" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                                <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="url(#gpaApprovedGradient)" strokeWidth={2} />
                                <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fill="url(#gpaRejectedGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <GraduationCap className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No GPA data available</p>
                                <p className="text-sm mt-1">Data will appear as applications are processed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Family Background */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            Family Background Analysis
                        </h3>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full font-medium">
                            Impact Score
                        </span>
                    </div>
                    {dataToUse.familyBackgroundImpact?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dataToUse.familyBackgroundImpact}>
                                <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
                                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: '500' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <Radar name="Approval Impact %" dataKey="impact" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} strokeWidth={2} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Users className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No family background data</p>
                                <p className="text-sm mt-1">Data will appear as applications are processed</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Monthly Trends - Full Width */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Application Trends Over Time
                        </h3>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full font-medium">
                            Last 6 Months
                        </span>
                    </div>
                    {dataToUse.monthlyTrends?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={dataToUse.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                                <Line type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 7 }} />
                                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 7 }} />
                                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444' }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No trend data available</p>
                                <p className="text-sm mt-1">Data will appear as applications are processed over time</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Document Completeness */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-teal-500" />
                            Document Completeness
                        </h3>
                        <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full font-medium">
                            Submission Status
                        </span>
                    </div>
                    {dataToUse.documentCompleteness?.length > 0 && dataToUse.documentCompleteness.some((d: any) => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={dataToUse.documentCompleteness}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, percent }: any) => `${category}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {dataToUse.documentCompleteness.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.category === 'Complete' ? '#10b981' : entry.category === 'Missing 1-2' ? '#f59e0b' : '#ef4444'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No document data available</p>
                                <p className="text-sm mt-1">Data will appear as documents are submitted</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalyticsDashboard;
