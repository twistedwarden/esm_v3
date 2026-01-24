import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  PhilippinePeso,
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Bell,
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import {
  getDashboardMetrics,
  getAIInsights,
  getAlerts,
  acknowledgeAlert,
  type DashboardMetrics,
  type AIInsightsResponse,
  type Alert,
} from '../../../../services/monitoringService';

// ============================================================================
// Utility Components
// ============================================================================

const formatNumber = (num: number | string | undefined | null): string => {
  const n = Number(num) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatCurrency = (amount: number | string | undefined | null): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

interface TrendBadgeProps {
  value: number;
  suffix?: string;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ value, suffix = '%' }) => {
  const numValue = Number(value) || 0;
  if (numValue === 0) return null;
  const isPositive = numValue > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${isPositive
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
    >
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(numValue).toFixed(1)}{suffix}
    </span>
  );
};

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color,
  onClick,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const bgClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600' : ''
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {trend !== undefined && <TrendBadge value={trend} />}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {trendLabel && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{trendLabel}</p>
          )}
        </div>
        <div
          className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white shadow-sm`}
        >
          {icon}
        </div>
      </div>
      {/* Decorative element */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${bgClasses[color]}`} />
    </div>
  );
};

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'bg-blue-500',
  showLabel = true,
  size = 'md',
}) => {
  const numValue = Number(value) || 0;
  const numMax = Number(max) || 100;
  const percentage = Math.min((numValue / numMax) * 100, 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{formatNumber(numValue)}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Mini Stat Card
// ============================================================================

interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, icon, color = 'text-slate-600' }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
    {icon && <span className={color}>{icon}</span>}
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

// ============================================================================
// Alert Item Component
// ============================================================================

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (id: number) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  const severityConfig = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
    high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: AlertTriangle },
    medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
    low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Bell },
  };

  const config = severityConfig[alert.severity] || severityConfig.low;
  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-lg ${config.bg} flex items-start gap-3`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.text}`}>{alert.title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{alert.message}</p>
      </div>
      {!alert.is_acknowledged && (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="flex-shrink-0 p-1.5 rounded hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
          title="Acknowledge"
        >
          <CheckCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Pipeline Stage Card
// ============================================================================

interface PipelineStageProps {
  stage: string;
  pending: number;
  completed: number;
  isBottleneck?: boolean;
}

const PipelineStage: React.FC<PipelineStageProps> = ({ stage, pending, completed, isBottleneck }) => {
  const total = pending + completed;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  const stageLabels: Record<string, string> = {
    document_verification: 'Document Verification',
    financial_review: 'Financial Review',
    academic_review: 'Academic Review',
    final_approval: 'Final Approval',
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${isBottleneck
        ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {stageLabels[stage] || stage}
        </span>
        {isBottleneck && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-200 text-orange-700 dark:bg-orange-800 dark:text-orange-300">
            Bottleneck
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">{pending} pending</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          <span className="text-slate-600 dark:text-slate-400">{completed} done</span>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar value={completionRate} color="bg-green-500" showLabel={false} size="sm" />
      </div>
    </div>
  );
};

// ============================================================================
// Data Connection Status Component
// ============================================================================

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  isLoading: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, lastUpdated, isLoading }) => (
  <div
    title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : ''}
    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isLoading
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : isConnected
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
    {isLoading ? 'Syncing...' : isConnected ? 'Live' : 'Offline'}
  </div>
);

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => (
  <div className="text-center py-12">
    <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
      >
        {action.label}
      </button>
    )}
  </div>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [aiInsights, setAIInsights] = useState<AIInsightsResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'insights'>('overview');
  const [isConnected, setIsConnected] = useState(true);

  // PDF Export Handler
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const dateStr = new Date().toLocaleString();

    // Header
    doc.setFontSize(18);
    doc.text('Education Monitoring Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dateStr}`, 14, 28);
    doc.text(`View: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`, 14, 33);
    doc.setTextColor(0);

    let startY = 45;

    if (activeTab === 'insights' && aiInsights) {
      // --- INSIGHTS REPORT ---
      // 1. KPIS & METRICS (Added context for Insights)
      if (metrics) {
        doc.setFontSize(14);
        doc.text('Key Performance Indicators', 14, startY);
        startY += 5;

        const kpiData = [
          ['Total Applications', formatNumber(metrics.applications?.total)],
          ['Approval Rate', `${metrics.applications?.approval_rate}%`],
          ['Budget Utilized', `${metrics.financial?.utilization_rate}%`],
          ['Scheduled Interviews', `${metrics.interviews?.scheduled || 0}`]
        ];

        autoTable(doc, {
          startY: startY,
          head: [['Metric', 'Value']],
          body: kpiData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], halign: 'center' },
          columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
          styles: { fontSize: 10, cellPadding: 2 }
        });

        startY = (doc as any).lastAutoTable.finalY + 10;

        // Financial Mini-table
        autoTable(doc, {
          startY: startY,
          head: [['Financial Overview', 'Amount']],
          body: [
            ['Allocated', formatCurrency(metrics.financial?.allocated_budget)],
            ['Remaining', formatCurrency(metrics.financial?.remaining_budget)]
          ],
          theme: 'striped',
          headStyles: { fillColor: [142, 68, 173] },
          columnStyles: { 1: { halign: 'right' } }
        });

        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      // 2. AI HIGHLIGHTS
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175); // Dark Blue
      doc.text('AI Strategic Highlights', 14, startY);
      doc.setTextColor(0);
      startY += 8;

      doc.setFontSize(10);
      aiInsights.insights.highlights?.forEach((h) => {
        const splitText = doc.splitTextToSize(`• ${h}`, pageWidth - 30);
        doc.text(splitText, 14, startY);
        startY += (splitText.length * 5) + 2;
      });
      startY += 8;

      // 3. EXECUTIVE SUMMARY
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Executive Summary', 14, startY);
      doc.setTextColor(0);
      startY += 8;

      doc.setFontSize(10);
      const summaryText = doc.splitTextToSize(aiInsights.insights.summary || '', pageWidth - 28);
      doc.text(summaryText, 14, startY);
      startY += (summaryText.length * 5) + 12;

      // 4. RECOMMENDATIONS
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('Strategic Recommendations', 14, startY);
      doc.setTextColor(0);
      startY += 6;

      const recData = aiInsights.insights.recommendations?.map(r => [
        r.priority.toUpperCase(),
        r.area.replace(/_/g, ' '),
        r.action
      ]) || [];

      autoTable(doc, {
        startY: startY,
        head: [['Priority', 'Target Area', 'Actionable Insight']],
        body: recData,
        headStyles: { fillColor: [30, 64, 175] }, // Darker blue header
        styles: { fontSize: 9, cellPadding: 4, valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 40, fontStyle: 'italic' },
          2: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [240, 245, 255] }
      });

    } else if (metrics) {
      // --- METRICS REPORT (Overview & Pipeline) ---

      // Overview Table
      if (activeTab === 'overview') {
        const kpiData = [
          ['Total Applications', formatNumber(metrics.applications?.total)],
          ['Approval Rate', `${metrics.applications?.approval_rate}%`],
          ['Budget Utilized', `${metrics.financial?.utilization_rate}%`],
          ['Active Alerts', `${metrics.alerts?.total || 0}`]
        ];

        autoTable(doc, {
          startY: startY,
          head: [['Metric', 'Value']],
          body: kpiData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 12 }
        });

        startY = (doc as any).lastAutoTable.finalY + 15;

        // Budget Detail
        doc.setFontSize(12);
        doc.text('Financial Overview', 14, startY);
        startY += 5;

        autoTable(doc, {
          startY: startY,
          head: [['Category', 'Amount']],
          body: [
            ['Allocated Budget', formatCurrency(metrics.financial?.allocated_budget)],
            ['Remaining Budget', formatCurrency(metrics.financial?.remaining_budget)],
            ['Disbursed', formatCurrency(metrics.financial?.disbursed_budget)]
          ],
          theme: 'striped'
        });
      }

      // Pipeline Table
      if (activeTab === 'pipeline') {
        doc.setFontSize(14);
        doc.text('SSC Review Pipeline', 14, startY);
        startY += 8;

        const pipelineData = Object.entries(metrics.ssc_reviews?.by_stage || {}).map(([stage, count]: any) => [
          stage.replace(/_/g, ' ').toUpperCase(),
          count.pending,
          count.completed
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['Stage', 'Pending', 'Completed']],
          body: pipelineData,
          headStyles: { fillColor: [142, 68, 173] }
        });

        startY = (doc as any).lastAutoTable.finalY + 15;

        // Interview Stats
        doc.text('Interview Statistics', 14, startY);
        startY += 8;

        const interviewData = [
          ['Scheduled', metrics.interviews?.scheduled],
          ['Completed', metrics.interviews?.completed],
          ['Passed', metrics.interviews?.results?.passed],
          ['No Show', metrics.interviews?.no_show]
        ];

        autoTable(doc, {
          startY: startY,
          body: interviewData,
          theme: 'plain',
          styles: { fontSize: 11, cellPadding: 2 }
        });
      }
    }

    doc.save(`Education_Monitoring_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Fetch main dashboard metrics from database
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch dashboard metrics (from aggregated analytics tables)
      const metricsResponse = await getDashboardMetrics();

      if (metricsResponse) {
        setMetrics(metricsResponse);
        setIsConnected(true);
        console.log('Dashboard metrics loaded from database:', metricsResponse);
      }

      // Fetch alerts
      const alertsResponse = await getAlerts({ status: 'active', limit: 5 }).catch(() => ({ alerts: [], total_count: 0 }));
      setAlerts(alertsResponse.alerts || []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to connect to monitoring service. Please ensure the service is running.');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch AI insights separately (can be slower)
  const fetchAIInsights = useCallback(async (forceRefresh: boolean = false) => {
    setAILoading(true);

    try {
      const insightsResponse = await getAIInsights(undefined, forceRefresh);
      if (insightsResponse) {
        setAIInsights(insightsResponse);
        console.log('AI insights loaded:', insightsResponse);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      // AI insights are optional, don't set error
    } finally {
      setAILoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();

    // Fetch AI insights after main data loads
    const aiTimeout = setTimeout(() => {
      fetchAIInsights();
    }, 500);

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(aiTimeout);
    };
  }, [fetchDashboardData, fetchAIInsights]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Refresh AI insights manually (force regenerate, clear cache)
  const handleRefreshInsights = () => {
    fetchAIInsights(true); // true = force refresh, clears cache
  };

  // Loading state
  if (loading && !metrics) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Connecting to monitoring service...</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Loading data from database</p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && !metrics) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 dark:text-red-400 font-medium mb-2">Connection Error</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={fetchDashboardData}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry Connection
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Make sure the monitoring_service is running on port 8003
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have data
  const hasData = metrics && (
    (metrics.applications?.total || 0) > 0 ||
    (metrics.demographics?.total_students || 0) > 0 ||
    (metrics.financial?.total_budget || 0) > 0
  );

  const apps = metrics?.applications;
  const financial = metrics?.financial;
  const ssc = metrics?.ssc_reviews;
  const interviews = metrics?.interviews;
  const demographics = metrics?.demographics;
  const alertsSummary = metrics?.alerts;

  return (
    <div className="space-y-6 pb-6">
      {/* ================================================================== */}
      {/* Header Row - Z Pattern: Top line (left to right scan) */}
      {/* ================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Education Monitoring Dashboard
            </h1>
            <ConnectionStatus isConnected={isConnected} lastUpdated={lastUpdated} isLoading={loading} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lastUpdated
              ? `Data from database • Last sync: ${lastUpdated.toLocaleTimeString()}`
              : 'Scholarship Management System Analytics'}
          </p>
          {!hasData && isConnected && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ No analytics data found. Run the seeder to populate sample data.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'pipeline', label: 'Pipeline', icon: ClipboardCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* Overview Tab */}
      {/* ================================================================== */}
      {activeTab === 'overview' && (
        <>
          {/* Z-Pattern Row 1: Primary KPIs (eye travels left to right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Applications"
              value={formatNumber(apps?.total || 0)}
              subtitle={`${apps?.new_today || 0} new today`}
              icon={<FileText className="w-5 h-5" />}
              trend={apps?.trend?.delta_percent}
              trendLabel="vs last week"
              color="blue"
            />
            <KPICard
              title="Approval Rate"
              value={`${apps?.approval_rate || 0}%`}
              subtitle={`${apps?.approved || 0} approved`}
              icon={<CheckCircle className="w-5 h-5" />}
              color="green"
            />
            <KPICard
              title="Budget Utilized"
              value={`${financial?.utilization_rate || 0}%`}
              subtitle={formatCurrency(financial?.remaining_budget || 0) + ' remaining'}
              icon={<PhilippinePeso className="w-5 h-5" />}
              color="purple"
            />
            <KPICard
              title="Active Alerts"
              value={alertsSummary?.total || 0}
              subtitle={`${alertsSummary?.by_severity?.high || 0} high priority`}
              icon={<Bell className="w-5 h-5" />}
              color={alertsSummary?.by_severity?.critical ? 'red' : 'orange'}
            />
          </div>

          {/* Z-Pattern Row 2: Secondary content (diagonal scan down-left) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Application Status */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Application Pipeline
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {apps?.pending_review || 0} pending review
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat
                  label="Submitted"
                  value={formatNumber(apps?.pending_review || 0)}
                  icon={<Clock className="w-4 h-4" />}
                  color="text-amber-500"
                />
                <MiniStat
                  label="Approved"
                  value={formatNumber(apps?.approved || 0)}
                  icon={<CheckCircle className="w-4 h-4" />}
                  color="text-green-500"
                />
                <MiniStat
                  label="Rejected"
                  value={formatNumber(apps?.rejected || 0)}
                  icon={<XCircle className="w-4 h-4" />}
                  color="text-red-500"
                />
                <MiniStat
                  label="Released"
                  value={formatNumber(apps?.released || 0)}
                  icon={<PhilippinePeso className="w-4 h-4" />}
                  color="text-purple-500"
                />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Processing Progress</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {apps?.released || 0} / {apps?.total || 0}
                  </span>
                </div>
                <ProgressBar
                  value={apps?.released || 0}
                  max={apps?.total || 1}
                  color="bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              {/* Application Types */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {apps?.by_type?.new || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">New</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {apps?.by_type?.renewal || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Renewal</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {Number(apps?.avg_processing_days || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Avg Days</p>
                </div>
              </div>
            </div>

            {/* Right Column - Alerts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Alerts</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {alerts.length} active
                </span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledgeAlert} />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">All clear! No active alerts.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Z-Pattern Row 3: Additional Metrics (eye travels right across bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                Budget Overview
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Allocated</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(financial?.allocated_budget || 0)}
                    </span>
                  </div>
                  <ProgressBar
                    value={financial?.allocation_rate || 0}
                    color="bg-blue-500"
                    showLabel={false}
                    size="sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Disbursed</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(financial?.disbursed_budget || 0)}
                    </span>
                  </div>
                  <ProgressBar
                    value={financial?.utilization_rate || 0}
                    color="bg-green-500"
                    showLabel={false}
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                {financial?.disbursements_today || 0} disbursements today
              </p>
            </div>

            {/* SSC Reviews Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                SSC Reviews
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {ssc?.total_pending || 0}
                </span>
                <span className="text-sm text-slate-500">pending</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span>{ssc?.completed_today || 0} today</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{Number(ssc?.avg_review_hours || 0).toFixed(0)}h avg</span>
                </div>
              </div>
              {ssc?.bottleneck_stage && ssc.bottleneck_stage !== 'none' && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                  ⚠️ Bottleneck: {ssc.bottleneck_stage.replace('_', ' ')}
                </p>
              )}
            </div>

            {/* Interviews Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                Interviews
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {interviews?.scheduled || 0}
                </span>
                <span className="text-sm text-slate-500">scheduled</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{Number(interviews?.pass_rate || 0).toFixed(0)}% pass</span>
                </div>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{Number(interviews?.no_show_rate || 0).toFixed(0)}% no-show</span>
                </div>
              </div>
            </div>

            {/* Demographics Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                Student Demographics
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(demographics?.total_students || 0)}
                </span>
                <span className="text-sm text-slate-500">students</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {Number(demographics?.special_categories?.fourps_percentage || 0).toFixed(1)}% 4Ps
                </span>
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {Number(demographics?.special_categories?.pwd_percentage || 0).toFixed(1)}% PWD
                </span>
                <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {demographics?.partner_schools || 0} schools
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================================================================== */}
      {/* Pipeline Tab */}
      {/* ================================================================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* SSC Review Pipeline */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              SSC Review Pipeline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ssc?.by_stage &&
                Object.entries(ssc.by_stage).map(([stage, data]) => (
                  <PipelineStage
                    key={stage}
                    stage={stage}
                    pending={data.pending}
                    completed={data.completed}
                    isBottleneck={ssc.bottleneck_stage === stage}
                  />
                ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {ssc?.outcomes?.approved || 0}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Approved</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {ssc?.outcomes?.rejected || 0}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Rejected</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {ssc?.outcomes?.needs_revision || 0}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Needs Revision</p>
              </div>
            </div>
          </div>

          {/* Interview Schedule */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Interview Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {interviews?.scheduled || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Scheduled</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {interviews?.completed || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {interviews?.cancelled || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Cancelled</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {interviews?.no_show || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">No Show</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {interviews?.results?.passed || 0}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Passed</p>
              </div>
            </div>
          </div>

          {/* Application Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Application by Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Merit', value: apps?.by_category?.merit || 0, color: 'blue' },
                { label: 'Need-Based', value: apps?.by_category?.need_based || 0, color: 'green' },
                { label: 'Special', value: apps?.by_category?.special || 0, color: 'purple' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-sm text-slate-500">{formatNumber(value)}</span>
                  </div>
                  <ProgressBar
                    value={value}
                    max={apps?.total || 1}
                    color={`bg-${color}-500`}
                    size="md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* AI Insights Tab */}
      {/* ================================================================== */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {aiLoading && !aiInsights ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <Sparkles className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Generating AI insights...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">This may take a moment</p>
              </div>
            </div>
          ) : !aiInsights ? (
            <EmptyState
              title="No AI Insights Available"
              description="AI insights are being generated. Please refresh or wait a moment."
              icon={<Sparkles className="w-8 h-8 text-slate-400" />}
              action={{ label: 'Refresh Insights', onClick: handleRefreshInsights }}
            />
          ) : (
            <>
              {/* AI Highlights */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Strategic Highlights</h2>
                  </div>
                  <button
                    onClick={handleRefreshInsights}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
                <div className="space-y-2">
                  {aiInsights.insights.highlights?.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-blue-500 mt-1">•</span>
                      <p>{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Executive Summary</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {aiInsights.insights.summary}
                </p>
              </div>

              {/* Strategic Recommendations */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategic Recommendations</h2>
                <div className="space-y-4">
                  {aiInsights.insights.recommendations?.map((rec, idx) => {
                    const priorityColors = {
                      high: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
                      medium: 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20',
                      low: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
                    };
                    const priorityBadgeColors = {
                      high: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
                      medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
                      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
                    };

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${priorityColors[rec.priority as keyof typeof priorityColors] || priorityColors.low}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                            {rec.area.replace(/_/g, ' ')}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${priorityBadgeColors[rec.priority as keyof typeof priorityBadgeColors] || priorityBadgeColors.low}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{rec.action}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                <p>Insights generated by AI • Last updated: {new Date(aiInsights.generated_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default MonitoringDashboard;
