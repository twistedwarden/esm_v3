import React from 'react';
import { FileBarChart, FileText, BarChart3, Eye, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const ReportsList = ({ 
    filteredReports, 
    selectedCategory, 
    reportCategories = [], 
    selectedPeriod, 
    onPeriodChange,
    onGenerateReport,
    onDownloadReport 
}) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed': 
                return { 
                    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    icon: CheckCircle
                };
            case 'processing': 
                return { 
                    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    icon: Clock
                };
            case 'failed': 
                return { 
                    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    icon: AlertTriangle
                };
            default: 
                return { 
                    bg: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
                    icon: Clock
                };
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'PDF': return <FileText className="w-4 h-4 text-red-500" />;
            case 'Excel': return <BarChart3 className="w-4 h-4 text-green-600" />;
            default: return <FileText className="w-4 h-4 text-slate-500" />;
        }
    };

    const getCategoryLabel = () => {
        if (selectedCategory === 'all') return 'Available Reports';
        const category = reportCategories.find(c => c.id === selectedCategory);
        return category ? `${category.label} Reports` : 'Reports';
    };

    return (
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {getCategoryLabel()}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} available
                    </p>
                </div>
                <select 
                    value={selectedPeriod} 
                    onChange={(e) => onPeriodChange(e.target.value)} 
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="quarterly">This Quarter</option>
                </select>
            </div>

            {/* Reports List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-700 mb-3">
                            <FileBarChart className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            No reports found
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Try selecting a different category
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const statusConfig = getStatusConfig(report.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <div 
                                key={report.id} 
                                className="p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Type Icon */}
                                    <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        {getTypeIcon(report.type)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                                    {report.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                    {report.description}
                                                </p>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            <div className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                <span className="hidden sm:inline capitalize">{report.status}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{report.category}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span>{new Date(report.date).toLocaleDateString()}</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span>{report.size}</span>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onGenerateReport(report.title)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Preview</span>
                                            </button>
                                            <button 
                                                onClick={() => onDownloadReport(report.title)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ReportsList;
