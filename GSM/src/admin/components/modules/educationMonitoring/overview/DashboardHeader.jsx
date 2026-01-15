import React from 'react';
import { FileBarChart, Download, RefreshCw, Calendar } from 'lucide-react';

const DashboardHeader = ({ onExportData, onGenerateReport, loading, onRefresh, lastUpdated }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Title Section */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white truncate">
                            Education Monitoring
                        </h1>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Live</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                        {lastUpdated 
                            ? `Last updated: ${lastUpdated.toLocaleTimeString()}` 
                            : 'Real-time analytics dashboard for student academic progress'}
                    </p>
                </div>
                
                {/* Actions Section */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {onRefresh && (
                        <button 
                            onClick={onRefresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    )}
                    <button 
                        onClick={() => onExportData('csv')}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                        title="Export CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button 
                        onClick={() => onGenerateReport('Academic Performance')}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50 font-medium"
                        title="Generate Report"
                    >
                        <FileBarChart className="w-4 h-4" />
                        <span className="hidden sm:inline">{loading ? 'Generating...' : 'Generate'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
