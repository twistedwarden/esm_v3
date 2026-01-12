import React, { useState, useEffect } from 'react';
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
    FileBarChart
} from 'lucide-react';
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

function SADOverview({ onPageChange, lastUpdated = null }) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [trends, setTrends] = useState([]);
    const [error, setError] = useState(null);
    
    // Get current school year (format: YYYY-YYYY)
    const getCurrentSchoolYear = () => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        return `${currentYear}-${nextYear}`;
    };
    
    const [selectedSchoolYear, setSelectedSchoolYear] = useState(getCurrentSchoolYear());
    
    // Generate school year options (current year and 2 years back)
    const getSchoolYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const options = [];
        for (let i = 0; i < 3; i++) {
            const year = currentYear - i;
            const nextYear = year + 1;
            options.push(`${year}-${nextYear}`);
        }
        return options;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Temporary mock data for scholarship budget
            const mockBudgetData = {
                total_budget: 1000000.00, // ₱1,000,000
                disbursed: 0,
                remaining: 1000000.00,
                utilization_rate: 0
            };

            let metricsData;
            try {
                const [apiMetrics, analyticsData] = await Promise.all([
                    schoolAidService.getMetrics({ school_year: selectedSchoolYear }),
                    schoolAidService.getAnalyticsData('payments', '6m')
                ]);
                metricsData = apiMetrics;
                
                // Process trends data from analytics if available, else use meaningful mock data
                if (analyticsData && analyticsData.labels) {
                    const processedTrends = analyticsData.labels.map((label, index) => ({
                        name: label,
                        amount: analyticsData.datasets[0].data[index] * 1000 // scaling for visualization
                    }));
                    setTrends(processedTrends);
                } else {
                    // Fallback trends
                    setTrends([
                        { name: 'Aug', amount: 450000 },
                        { name: 'Sep', amount: 520000 },
                        { name: 'Oct', amount: 480000 },
                        { name: 'Nov', amount: 610000 },
                        { name: 'Dec', amount: 750000 },
                        { name: 'Jan', amount: 820000 },
                    ]);
                }
            } catch (apiError) {
                console.warn('Failed to fetch metrics from API, using mock data:', apiError);
                // Use mock data if API fails
                metricsData = {
                    need_processing: 5,
                    need_disbursing: 3,
                    disbursed_count: 12,
                    total_disbursed: 245000,
                    total_budget: 1000000,
                    remaining_budget: 755000,
                    utilization_rate: 24.5,
                    budgets: {
                        scholarship_benefits: mockBudgetData
                    }
                };
                // Set fallback trends
                setTrends([
                    { name: 'Aug', amount: 450000 },
                    { name: 'Sep', amount: 520000 },
                    { name: 'Oct', amount: 480000 },
                    { name: 'Nov', amount: 610000 },
                    { name: 'Dec', amount: 750000 },
                    { name: 'Jan', amount: 820000 },
                ]);
            }

            // Ensure budgets object exists with mock data if missing
            if (!metricsData.budgets || !metricsData.budgets.scholarship_benefits) {
                metricsData.budgets = {
                    scholarship_benefits: mockBudgetData
                };
            }

            setMetrics(metricsData);

            } catch (err) {
                console.error('Error fetching SAD metrics:', err);
                // Use mock data on error
                setMetrics({
                    need_processing: 5,
                    need_disbursing: 3,
                    disbursed_count: 12,
                    total_disbursed: 245000,
                    total_budget: 1000000,
                    remaining_budget: 755000,
                    utilization_rate: 24.5,
                    budgets: {
                        scholarship_benefits: {
                            total_budget: 1000000.00,
                            disbursed: 245000.00,
                            remaining: 755000.00,
                            utilization_rate: 24.5
                        }
                    }
                });
                setTrends([
                    { name: 'Aug', amount: 450000 },
                    { name: 'Sep', amount: 520000 },
                    { name: 'Oct', amount: 480000 },
                    { name: 'Nov', amount: 610000 },
                    { name: 'Dec', amount: 750000 },
                    { name: 'Jan', amount: 820000 },
                ]);
                setError(null); // Don't show error, just use mock data
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchData();
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

    // Temporary mock data for scholarship budget (used as fallback)
    const mockScholarshipBudget = {
        total_budget: 1000000.00, // ₱1,000,000
        disbursed: 245000.00, // ₱245,000 (example disbursed amount)
        remaining: 755000.00, // ₱755,000
        utilization_rate: 24.5 // 24.5% utilized
    };

    const budgetStats = [
        {
            id: 'scholarship_benefits',
            title: 'Scholarship Budget',
            totalBudget: metrics?.budgets?.scholarship_benefits?.total_budget || mockScholarshipBudget.total_budget,
            disbursed: metrics?.budgets?.scholarship_benefits?.disbursed || mockScholarshipBudget.disbursed,
            remaining: metrics?.budgets?.scholarship_benefits?.remaining || mockScholarshipBudget.remaining,
            utilizationRate: metrics?.budgets?.scholarship_benefits?.utilization_rate || mockScholarshipBudget.utilization_rate,
            icon: FileText,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            description: 'Budget for merit, special, and renewal scholarship programs'
        }
    ];

    const distributionData = [
        { name: 'Financial Need', value: 45, color: '#3b82f6' },
        { name: 'Educational Assistance', value: 35, color: '#10b981' },
        { name: 'Emergency Aid', value: 20, color: '#f59e0b' }
    ];

    const handleGenerateReport = async () => {
        try {
            await dashboardService.generatePDFReport('disbursements', {
                overview: {
                    disbursedAmount: metrics?.total_disbursed || 0,
                    disbursedCount: metrics?.disbursed_count || 0,
                    totalApplications: metrics?.need_processing + metrics?.need_disbursing + metrics?.disbursed_count
                }
            });
        } catch (err) {
            console.error('Error generating report:', err);
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
                        >
                            {getSchoolYearOptions().map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
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
                            // For applications and payments tab within the same module
                            // We'd need to lift the tab state or use a URL hash
                            // For now, just a visual indicator
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`${stat.color} p-3 rounded-xl shadow-sm text-white transform group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center text-slate-400 group-hover:text-blue-500 transition-colors">
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
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `₱${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: '#fff'
                                    }}
                                    formatter={(value) => [`₱${value.toLocaleString()}`, 'Disbursed']}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
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
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    layout="horizontal"
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
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
        </div>
    );
}

export default SADOverview;
