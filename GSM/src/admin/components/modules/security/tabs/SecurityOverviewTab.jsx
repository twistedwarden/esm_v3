import React from 'react';
import {
    Activity,
    CheckCircle,
    AlertTriangle,
    Clock,
    TrendingUp,
    TrendingDown,
    Shield
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
                <p className={`text-lg sm:text-2xl font-bold ${color}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
            </div>
            <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
            </div>
        </div>
        {trend && (
            <div className="mt-2 flex items-center text-xs sm:text-sm">
                {trend > 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
                ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
                )}
                <span className={`${trend > 0 ? 'text-green-600' : 'text-red-600'} truncate`}>
                    {Math.abs(trend)}% from last period
                </span>
            </div>
        )}
    </div>
);

const SecurityOverviewTab = ({ statistics, filters }) => {
    if (!statistics) return null;

    const getScannerHealthColor = (percentage) => {
        if (percentage > 90) return 'text-green-600';
        if (percentage > 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="Total Scans"
                    value={statistics.overview.total_scans.toLocaleString()}
                    icon={Activity}
                    color="text-blue-600"
                    subtitle={`Last ${filters.days} days`}
                />
                <StatCard
                    title="Clean Files"
                    value={statistics.overview.clean_scans.toLocaleString()}
                    icon={CheckCircle}
                    color="text-green-600"
                    subtitle={`${statistics.overview.clean_percentage}% clean rate`}
                />
                <StatCard
                    title="Threats Blocked"
                    value={statistics.overview.infected_scans.toLocaleString()}
                    icon={AlertTriangle}
                    color="text-red-600"
                    subtitle="Malicious files detected"
                />
                <StatCard
                    title="Avg Scan Time"
                    value={`${statistics.overview.avg_scan_time}s`}
                    icon={Clock}
                    color="text-purple-600"
                    subtitle="Performance metric"
                />
            </div>

            {/* Scanner Health */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanner Health</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`text-3xl font-bold ${getScannerHealthColor(statistics.scanner_health.uptime_percentage)}`}>
                            {statistics.scanner_health.uptime_percentage}%
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Uptime</p>
                            <p className="text-xs text-gray-500">
                                {statistics.scanner_health.recent_scans} scans in last 24h
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${statistics.scanner_health.status === 'healthy'
                        ? 'bg-green-100 text-green-800'
                        : statistics.scanner_health.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {statistics.scanner_health.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Threat Breakdown */}
            {statistics.threat_breakdown && statistics.threat_breakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Breakdown</h3>
                    <div className="space-y-3">
                        {statistics.threat_breakdown.map((threat, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    <span className="font-medium text-gray-900">{threat.threat_name}</span>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                    {threat.count} detections
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityOverviewTab;
