/**
 * Monitoring Service API Client
 * 
 * Provides methods to interact with the monitoring_service API
 * for analytics data and AI-powered insights.
 */

import { getMonitoringServiceUrl, API_CONFIG } from '../config/api';

const MONITORING_API_URL = getMonitoringServiceUrl('').replace(/\/$/, ''); // Get base URL without trailing slash

const getAuthToken = (): string | null => localStorage.getItem('auth_token');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const response = await fetch(`${MONITORING_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// ============================================================================
// Types
// ============================================================================

export interface ApplicationMetrics {
  total: number;
  pending_review: number;
  approved: number;
  rejected: number;
  processing: number;
  released: number;
  new_today: number;
  approved_today: number;
  approval_rate: number;
  avg_processing_days: number;
  by_type: {
    new: number;
    renewal: number;
  };
  by_category: {
    merit: number;
    need_based: number;
    special: number;
  };
  trend: {
    delta: number;
    delta_percent: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export interface FinancialMetrics {
  school_year: string;
  total_budget: number;
  allocated_budget: number;
  disbursed_budget: number;
  remaining_budget: number;
  utilization_rate: number;
  allocation_rate: number;
  disbursements_today: number;
  disbursed_amount_today: number;
  avg_disbursement: number;
  by_method: {
    gcash: number;
    paymaya: number;
    bank: number;
    cash: number;
  };
}

export interface SscReviewMetrics {
  total_pending: number;
  total_completed: number;
  completed_today: number;
  avg_review_hours: number;
  bottleneck_stage: string;
  by_stage: {
    document_verification: { pending: number; completed: number };
    financial_review: { pending: number; completed: number };
    academic_review: { pending: number; completed: number };
    final_approval: { pending: number; completed: number };
  };
  outcomes: {
    approved: number;
    rejected: number;
    needs_revision: number;
  };
}

export interface InterviewMetrics {
  scheduled: number;
  completed: number;
  cancelled: number;
  no_show: number;
  pass_rate: number;
  no_show_rate: number;
  completion_rate: number;
  results: {
    passed: number;
    failed: number;
    needs_followup: number;
  };
  by_type: {
    in_person: number;
    online: number;
    phone: number;
  };
}

export interface DemographicsMetrics {
  total_students: number;
  currently_enrolled: number;
  graduating: number;
  new_today: number;
  gender: {
    male: number;
    female: number;
  };
  special_categories: {
    pwd: number;
    pwd_percentage: number;
    solo_parent: number;
    indigenous: number;
    fourps_beneficiary: number;
    fourps_percentage: number;
  };
  partner_schools: number;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  context: Record<string, any>;
  is_acknowledged: boolean;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface AlertsSummary {
  total: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recent: Array<{
    id: number;
    severity: string;
    title: string;
    created_at: string;
  }>;
}

export interface DashboardMetrics {
  applications: ApplicationMetrics;
  financial: FinancialMetrics;
  ssc_reviews: SscReviewMetrics;
  interviews: InterviewMetrics;
  demographics: DemographicsMetrics;
  alerts: AlertsSummary;
  snapshot_date: string;
  generated_at: string;
}

export interface TrendDataPoint {
  date: string;
  [key: string]: any;
}

export interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  area: string;
  action: string;
}

export interface AIInsights {
  highlights: string[];
  summary: string;
  recommendations: AIRecommendation[];
}

export interface AIInsightsResponse {
  success: boolean;
  provider: string;
  generated_at: string;
  filters_applied: Record<string, any>;
  insights: AIInsights;
  supporting_metrics: any;
  from_cache: boolean;
  latency_ms?: number;
  fallback_reason?: string;
}

export interface AIStatus {
  provider: string;
  configured: boolean;
  model: string;
  cache_ttl_seconds: number;
  fallback_available: boolean;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get executive dashboard with all key KPIs
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.DASHBOARD);
  return response.data;
};

/**
 * Get application pipeline trends
 */
export const getApplicationTrends = async (days: number = 30): Promise<{ trends: TrendDataPoint[]; period_days: number }> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.APPLICATION_TRENDS(days));
  return response.data;
};

/**
 * Get financial/budget trends
 */
export const getFinancialTrends = async (days: number = 30, schoolYear?: string): Promise<{ trends: TrendDataPoint[]; period_days: number }> => {
  const endpoint = API_CONFIG.MONITORING_SERVICE.ENDPOINTS.FINANCIAL_TRENDS(days, schoolYear);
  const response = await apiFetch(endpoint);
  return response.data;
};

/**
 * Get SSC review queue trends
 */
export const getSscReviewTrends = async (days: number = 14): Promise<{ trends: TrendDataPoint[]; period_days: number }> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.SSC_REVIEW_TRENDS(days));
  return response.data;
};

/**
 * Get interview statistics trends
 */
export const getInterviewTrends = async (days: number = 30): Promise<{ trends: TrendDataPoint[]; period_days: number }> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.INTERVIEW_TRENDS(days));
  return response.data;
};

/**
 * Get demographics trends
 */
export const getDemographicsTrends = async (days: number = 30): Promise<{ trends: TrendDataPoint[]; period_days: number }> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.DEMOGRAPHICS_TRENDS(days));
  return response.data;
};

/**
 * Get alerts list
 */
export const getAlerts = async (options?: {
  status?: 'active' | 'acknowledged' | 'resolved' | 'all';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
}): Promise<{ alerts: Alert[]; total_count: number }> => {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.severity) params.append('severity', options.severity);
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const response = await apiFetch(`${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.ALERTS}${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId: number): Promise<void> => {
  await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.ALERT_ACKNOWLEDGE(alertId), { method: 'POST' });
};

/**
 * Get system health overview
 */
export const getSystemOverview = async (options?: {
  hours?: number;
  limit?: number;
}): Promise<any> => {
  const params = new URLSearchParams();
  if (options?.hours) params.append('hours', options.hours.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const response = await apiFetch(`${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.SYSTEM_OVERVIEW}${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

/**
 * Get filter options
 */
export const getFilterOptions = async (): Promise<{
  school_years: string[];
  date_range: { earliest: string | null; latest: string | null };
  available_metrics: string[];
}> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.FILTER_OPTIONS);
  return response.data;
};

/**
 * Get AI-generated insights
 * @param filters - Optional date/program/term filters
 * @param refresh - Force regeneration (clear cache)
 */
export const getAIInsights = async (filters?: {
  date_from?: string;
  date_to?: string;
  program?: string;
  term?: string;
}, refresh: boolean = false): Promise<AIInsightsResponse> => {
  const params = new URLSearchParams();
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.program) params.append('program', filters.program);
  if (filters?.term) params.append('term', filters.term);
  if (refresh) params.append('refresh', 'true');

  const queryString = params.toString();
  const response = await apiFetch(`${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.AI_INSIGHTS}${queryString ? `?${queryString}` : ''}`);
  return response;
};

/**
 * Get AI service status
 */
export const getAIStatus = async (): Promise<AIStatus> => {
  const response = await apiFetch(API_CONFIG.MONITORING_SERVICE.ENDPOINTS.AI_STATUS);
  return response.status;
};

// ============================================================================
// Legacy endpoints (backward compatibility)
// ============================================================================

export const getEnrollmentTrends = async (options?: {
  months?: number;
  groupBy?: 'program' | 'year_level';
}): Promise<any> => {
  const params = new URLSearchParams();
  if (options?.months) params.append('months', options.months.toString());
  if (options?.groupBy) params.append('group_by', options.groupBy);

  const queryString = params.toString();
  const response = await apiFetch(`${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.ENROLLMENT_TRENDS}${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

export const getPerformanceDistribution = async (term?: string): Promise<any> => {
  const params = term ? `?term=${encodeURIComponent(term)}` : '';
  const response = await apiFetch(`${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.PERFORMANCE_DISTRIBUTION}${params}`);
  return response.data;
};

/**
 * Get student academic performance with filtering
 */
export const getStudentAcademicPerformance = async (filters?: {
  min_gpa?: number;
  max_gpa?: number;
  school_id?: number;
  program?: string;
  year_level?: string;
  risk_level?: 'high' | 'medium' | 'low';
  has_grades?: boolean;
}) => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.min_gpa !== undefined) params.append('min_gpa', filters.min_gpa.toString());
    if (filters.max_gpa !== undefined) params.append('max_gpa', filters.max_gpa.toString());
    if (filters.school_id) params.append('school_id', filters.school_id.toString());
    if (filters.program) params.append('program', filters.program);
    if (filters.year_level) params.append('year_level', filters.year_level);
    if (filters.risk_level) params.append('risk_level', filters.risk_level);
    if (filters.has_grades !== undefined) params.append('has_grades', filters.has_grades.toString());
  }

  const queryString = params.toString();
  const endpoint = `${API_CONFIG.MONITORING_SERVICE.ENDPOINTS.ACADEMIC_PERFORMANCE}${queryString ? `?${queryString}` : ''}`;

  return apiFetch(endpoint);
};

// Default export
export default {
  getDashboardMetrics,
  getApplicationTrends,
  getFinancialTrends,
  getSscReviewTrends,
  getInterviewTrends,
  getDemographicsTrends,
  getAlerts,
  acknowledgeAlert,
  getSystemOverview,
  getFilterOptions,
  getAIInsights,
  getAIStatus,
  getEnrollmentTrends,
  getPerformanceDistribution,
  getStudentAcademicPerformance,
};
