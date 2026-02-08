
/**
 * Scholarship Analytics Service API Client
 * 
 * Provides methods to interact with the scholarship_service API
 * for comprehensive analytics and Gemini insights.
 */

import { getScholarshipServiceUrl } from '../config/api';

const SCHOLARSHIP_API_URL = getScholarshipServiceUrl('').replace(/\/$/, '');

const getAuthToken = (): string | null => localStorage.getItem('auth_token');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const response = await fetch(`${SCHOLARSHIP_API_URL}${endpoint}`, {
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

// Types
export interface FailureReason {
    reason: string;
    count: number;
    percentage: number;
}

export interface FinancialDistribution {
    range: string;
    approved: number;
    rejected: number;
    total: number;
}

export interface FamilyBackgroundImpact {
    factor: string;
    impact: number;
    applications: number;
}

export interface GPAImpact {
    gpa: string;
    approved: number;
    rejected: number;
}

export interface MonthlyTrend {
    month: string;
    applications: number;
    approved: number;
    rejected: number;
}

export interface DocumentCompleteness {
    category: string;
    value: number;
}

export interface ComprehensiveAnalytics {
    failureReasons: FailureReason[];
    financialDistribution: FinancialDistribution[];
    familyBackgroundImpact: FamilyBackgroundImpact[];
    gpaVsApproval: GPAImpact[];
    monthlyTrends: MonthlyTrend[];
    documentCompleteness: DocumentCompleteness[];
    summary: {
        totalApplications: number;
        approvalRate: number;
        avgProcessingTime: number;
        totalAidDistributed: number;
    };
}

export interface GeminiKeyFinding {
    title: string;
    description: string;
    recommendation: string;
}

export interface GeminiInsights {
    keyFindings: GeminiKeyFinding[];
    failureAnalysis: {
        primaryReasons: string[];
        correlations: string[];
    };
    recommendations: string[];
    riskFactors: string[];
    successPatterns: string[];
}

// API Methods

/**
 * Get comprehensive analytics data
 */
export const getComprehensiveAnalytics = async (
    timeRange: 'all' | 'year' | 'quarter' | 'month' = 'all',
    category: string = 'all'
): Promise<ComprehensiveAnalytics> => {
    const params = new URLSearchParams({ timeRange, category });
    const response = await apiFetch(`/api/analytics/comprehensive?${params.toString()}`);
    return response.data;
};

/**
 * Generate Gemini AI insights based on analytics data
 */
export const generateGeminiInsights = async (
    analyticsData: ComprehensiveAnalytics,
    focusAreas: string[] = ['failure_reasons', 'financial_patterns', 'family_background', 'academic_performance']
): Promise<GeminiInsights> => {
    const response = await apiFetch('/api/analytics/gemini-insights', {
        method: 'POST',
        body: JSON.stringify({ analyticsData, focusAreas }),
    });
    return response.data;
};

/**
 * Export analytics report as PDF
 */
export const exportAnalyticsReport = async (
    timeRange: string = 'all',
    category: string = 'all'
): Promise<Blob> => {
    const token = getAuthToken();
    const params = new URLSearchParams({ timeRange, category });

    const response = await fetch(`${SCHOLARSHIP_API_URL}/api/analytics/export?${params.toString()}`, {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        throw new Error('Failed to export analytics report');
    }

    return await response.blob();
};

export default {
    getComprehensiveAnalytics,
    generateGeminiInsights,
    exportAnalyticsReport
};
