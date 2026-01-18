import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3 } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import AIInsightsPanel from '../AIInsightsPanel';

const AnalyticsReport = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call to fetch analytics data
            // For now, using mock data structure
            const mockData = {
                monthlyEnrollment: [],
                programDistribution: [],
                gpaDistribution: [],
                yearLevelDistribution: [],
                genderDistribution: []
            };
            setChartData(mockData);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Comprehensive analytics and AI-powered insights
                    </p>
                </div>
                <button
                    onClick={fetchAnalyticsData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* AI Insights Panel */}
            <AIInsightsPanel />

            {/* Analytics Charts */}
            {loading ? (
                <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">Loading analytics data...</p>
                    </div>
                </div>
            ) : (
                <AnalyticsCharts chartData={chartData} />
            )}
        </div>
    );
};

export default AnalyticsReport;
