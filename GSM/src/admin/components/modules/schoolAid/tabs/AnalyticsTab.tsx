import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  PhilippinePeso,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  SubmoduleConfig,
  ProcessingMetrics,
  ScholarshipApplication,
  ApplicationStatus
} from '../types';
import { schoolAidService } from '../services/schoolAidService';

interface AnalyticsTabProps {
  submodule: SubmoduleConfig;
  activeTab: string;
  activeSubmodule: string;
  selectedApplications: string[];
  setSelectedApplications: (ids: string[]) => void;
  modalState: any;
  setModalState: (state: any) => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  submodule,
  activeTab,
  activeSubmodule
}) => {
  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    totalApplications: 0,
    approvedApplications: 0,
    processingApplications: 0,
    disbursedApplications: 0,
    failedApplications: 0,
    totalAmount: 0,
    disbursedAmount: 0,
    pendingAmount: 0,
    averageProcessingTime: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeSubmodule, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [metricsData, chartData] = await Promise.all([
        schoolAidService.getMetrics(),
        schoolAidService.getAnalyticsData('payments', dateRange)
      ]);

      setMetrics(metricsData);
      
      // Process chart data - ensure it has the expected structure
      if (chartData) {
        setChartData({
          dailyDisbursements: chartData.dailyDisbursements || [],
          statusDistribution: chartData.statusDistribution || [],
          schoolPerformance: chartData.schoolPerformance || [],
          monthlyTrends: chartData.monthlyTrends || []
        });
      } else {
        setChartData({
          dailyDisbursements: [],
          statusDistribution: [],
          schoolPerformance: [],
          monthlyTrends: []
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setChartData({
        dailyDisbursements: [],
        statusDistribution: [],
        schoolPerformance: [],
        monthlyTrends: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color, 
    trend,
    format = 'number'
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>
            {format === 'currency' ? formatCurrency(Number(value)) :
             format === 'percentage' ? `${value}%` :
             formatNumber(Number(value))}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          title="Total Applications"
          value={metrics.totalApplications}
          subtitle="All time"
          color="text-blue-600"
        />
        <MetricCard
          icon={CheckCircle}
          title="Disbursed"
          value={metrics.disbursedApplications}
          subtitle={`${metrics.successRate}% success rate`}
          color="text-green-600"
          trend="+12%"
        />
        <MetricCard
          icon={PhilippinePeso}
          title="Total Amount"
          value={metrics.totalAmount}
          subtitle="All disbursements"
          color="text-purple-600"
          format="currency"
        />
        <MetricCard
          icon={Clock}
          title="Avg Processing Time"
          value={metrics.averageProcessingTime}
          subtitle="Days to complete"
          color="text-orange-600"
          format="number"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Disbursements Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Disbursements</h3>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData?.dailyDisbursements && chartData.dailyDisbursements.length > 0 ? (
              chartData.dailyDisbursements.slice(-7).map((day: any, index: number) => {
                const maxAmount = Math.max(...chartData.dailyDisbursements.map((d: any) => d.amount || 0), 1);
                const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                return (
                  <div key={day.date || index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${Math.max(heightPercent * 2, 5)}px` }}
                      title={`${formatCurrency(day.amount || 0)} - ${day.count || 0} scholars`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                      {day.date ? new Date(day.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-500 py-12">
                <p>No disbursement data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-4">
            {chartData?.statusDistribution && chartData.statusDistribution.length > 0 ? (
              chartData.statusDistribution.map((item: any, index: number) => (
                <div key={item.status || index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${item.color || 'bg-gray-500'} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.status || 'Unknown'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.count || 0}</div>
                    <div className="text-xs text-gray-500">{item.percentage || 0}%</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No status data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* School Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Schools by Disbursement</h3>
        <div className="space-y-4">
          {chartData?.schoolPerformance && chartData.schoolPerformance.length > 0 ? (
            chartData.schoolPerformance.map((school: any, index: number) => (
              <div key={school.school || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{school.school || 'Unknown School'}</div>
                    <div className="text-xs text-gray-500">{school.scholars || 0} scholars • {school.avgTime || 0} days avg</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(school.disbursed || 0)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No school performance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Financial Reports</h3>
          <div className="flex gap-2">
            <select className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatCurrency(metrics.disbursedAmount)}
            </div>
            <div className="text-sm text-gray-600">Total Disbursed</div>
          </div>
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatCurrency(metrics.pendingAmount)}
            </div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </div>
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <div className="text-sm text-gray-600">Total Allocated</div>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Custom Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>Financial Summary</option>
              <option>Application Status Report</option>
              <option>School Performance Report</option>
              <option>Processing Time Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { action: 'Payment Processed', user: 'John Admin', timestamp: '2024-10-16 14:30', details: 'Juan Dela Cruz - ₱15,000' },
            { action: 'Application Approved', user: 'Sarah Finance', timestamp: '2024-10-16 13:45', details: 'Maria Santos - Ateneo de Manila' },
            { action: 'Payment Failed', user: 'System', timestamp: '2024-10-16 12:15', details: 'Pedro Reyes - Retry required' },
            { action: 'Batch Processing Started', user: 'Mike Admin', timestamp: '2024-10-16 10:00', details: '15 applications' },
            { action: 'Payment Completed', user: 'System', timestamp: '2024-10-16 09:30', details: 'Ana Garcia - ₱16,000' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  <div className="text-xs text-gray-500">{activity.details}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{activity.user}</div>
                <div className="text-xs text-gray-400">{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="space-y-4">
          {chartData?.monthlyTrends && chartData.monthlyTrends.length > 0 ? (
            chartData.monthlyTrends.map((month: any, index: number) => (
              <div key={month.month || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{month.month || 'Unknown Month'}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-blue-600">{month.applications || 0}</div>
                    <div className="text-xs text-gray-500">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-600">{month.disbursed || 0}</div>
                    <div className="text-xs text-gray-500">Disbursed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-purple-600">{formatCurrency(month.amount || 0)}</div>
                    <div className="text-xs text-gray-500">Amount</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No monthly trends data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSubmodule) {
      case 'dashboard':
        return renderDashboard();
      case 'reports':
        return renderReports();
      case 'history':
        return renderHistory();
      case 'trends':
        return renderTrends();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default AnalyticsTab;
