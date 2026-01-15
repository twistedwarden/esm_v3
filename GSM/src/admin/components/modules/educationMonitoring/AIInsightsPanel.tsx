import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Info,
  X
} from 'lucide-react';
import { getAIInsights, getAIStatus, getFilterOptions } from '../../../../services/monitoringService';
import type { AIInsightsResponse, AIStatus, AIRecommendation } from '../../../../services/monitoringService';

interface FilterOptions {
  programs: string[];
  year_levels: string[];
  terms: string[];
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}

interface AIInsightsPanelProps {
  className?: string;
  compact?: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ className = '', compact = false }) => {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    highlights: true,
    summary: !compact,
    recommendations: true
  });
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    program: '',
    term: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statusData, optionsData] = await Promise.all([
        getAIStatus().catch(() => null),
        getFilterOptions().catch(() => null)
      ]);
      
      setStatus(statusData);
      if (optionsData) {
        setFilterOptions({
          programs: optionsData.school_years || [],
          year_levels: [],
          terms: [],
          date_range: optionsData.date_range || { earliest: null, latest: null }
        });
      }
      
      await loadInsights();
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to connect to monitoring service');
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      
      const data = await getAIInsights(activeFilters);
      setInsights(data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadInsights();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ date_from: '', date_to: '', program: '', term: '' });
    loadInsights();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
      };
      case 'medium': return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
      };
      default: return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
      };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading && !insights) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
          <span className="text-slate-600 dark:text-slate-400">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">AI Monitoring Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status?.provider === 'template' ? 'Template analysis' : `${status?.provider || 'AI'} powered`}
                {insights?.from_cache && ' • Cached'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={loadInsights}
              disabled={loading}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {insights && (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {/* Highlights Section */}
          <div>
            <button
              onClick={() => toggleSection('highlights')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-slate-900 dark:text-white text-sm">Key Highlights</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {insights.insights.highlights.length}
                </span>
              </div>
              {expandedSections.highlights ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            
            {expandedSections.highlights && (
              <div className="px-4 pb-4 space-y-2">
                {insights.insights.highlights.map((highlight, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {highlight.toLowerCase().includes('increase') || highlight.toLowerCase().includes('improved') || highlight.toLowerCase().includes('growth') ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : highlight.toLowerCase().includes('decrease') || highlight.toLowerCase().includes('risk') || highlight.toLowerCase().includes('decline') ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{highlight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Section */}
          {!compact && (
            <div>
              <button
                onClick={() => toggleSection('summary')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-slate-900 dark:text-white text-sm">Summary</span>
                </div>
                {expandedSections.summary ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.summary && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {insights.insights.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Section */}
          <div>
            <button
              onClick={() => toggleSection('recommendations')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-slate-900 dark:text-white text-sm">Recommendations</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {insights.insights.recommendations.length}
                </span>
              </div>
              {expandedSections.recommendations ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            
            {expandedSections.recommendations && (
              <div className="px-4 pb-4 space-y-2">
                {insights.insights.recommendations.map((rec: AIRecommendation, index: number) => {
                  const styles = getPriorityStyles(rec.priority);
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {getPriorityIcon(rec.priority)}
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles.badge}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {rec.area.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{rec.action}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {insights ? new Date(insights.generated_at).toLocaleString() : 'No data'}
          </span>
          {insights?.latency_ms && (
            <span>{insights.latency_ms.toFixed(0)}ms</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
