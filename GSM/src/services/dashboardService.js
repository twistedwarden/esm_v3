import { API_CONFIG } from '../config/api';

const AUTH_API_BASE_URL = API_CONFIG.AUTH_SERVICE.BASE_URL;

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Dashboard overview API not available, using fallback data');
    }

    // Fallback: Return mock data if API is not available
    return {
      totalApplications: 1247,
      approvedApplications: 892,
      pendingReview: 234,
      rejectedApplications: 121,
      totalBudget: 45200000,
      disbursedAmount: 32100000,
      remainingBudget: 13100000,
      activeStudents: 892,
      partnerSchools: 45,
      sscReviews: 156,
      interviewsScheduled: 89
    };
  }

  /**
   * Get application trends data
   */
  async getApplicationTrends(period = 'monthly') {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/trends?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Application trends API not available, using fallback data');
    }

    // Fallback: Return mock data
    return {
      monthly: [
        { month: 'Jan', applications: 65, approved: 45, rejected: 8 },
        { month: 'Feb', applications: 78, approved: 52, rejected: 12 },
        { month: 'Mar', applications: 90, approved: 68, rejected: 15 },
        { month: 'Apr', applications: 81, approved: 58, rejected: 11 },
        { month: 'May', applications: 96, approved: 72, rejected: 18 },
        { month: 'Jun', applications: 105, approved: 78, rejected: 22 }
      ]
    };
  }

  /**
   * Get status distribution data
   */
  async getStatusDistribution() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/status-distribution`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Status distribution API not available, using fallback data');
    }

    // Fallback: Return mock data
    return {
      approved: 45,
      pending: 30,
      rejected: 15,
      underReview: 10
    };
  }

  /**
   * Get SSC workflow data
   */
  async getSSCWorkflow() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/ssc-workflow`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('SSC workflow API not available, using fallback data');
    }

    // Fallback: Return mock data
    return {
      documentVerification: 45,
      financialReview: 32,
      academicReview: 28,
      finalApproval: 15
    };
  }

  /**
   * Get scholarship categories data
   */
  async getScholarshipCategories() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/scholarship-categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Scholarship categories API not available, using fallback data');
    }

    // Fallback: Return mock data
    return {
      'Merit Scholarship': 456,
      'Need-Based Scholarship': 321,
      'Special Program': 234,
      'Renewal': 236
    };
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 10) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/recent-activities?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Recent activities API not available, using fallback data');
    }

    // Fallback: Return mock data
    return [
      {
        id: 1,
        type: 'application',
        title: 'New scholarship application submitted',
        description: 'John Doe submitted application for Merit Scholarship',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'pending'
      },
      {
        id: 2,
        type: 'approval',
        title: 'Application approved',
        description: 'Jane Smith\'s application for Need-Based Scholarship was approved',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'approved'
      },
      {
        id: 3,
        type: 'review',
        title: 'SSC review completed',
        description: 'Financial review completed for application #12345',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        status: 'completed'
      }
    ];
  }

  /**
   * Get top schools data
   */
  async getTopSchools() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/top-schools`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Top schools API not available, using fallback data');
    }

    // Fallback: Return mock data
    return [
      { name: 'University of the Philippines', applications: 156, approved: 98 },
      { name: 'Ateneo de Manila University', applications: 134, approved: 89 },
      { name: 'De La Salle University', applications: 98, approved: 67 },
      { name: 'University of Santo Tomas', applications: 87, approved: 54 }
    ];
  }

  /**
   * Get all dashboard data
   */
  async getAllDashboardData() {
    try {
      const [
        overview,
        trends,
        statusDistribution,
        sscWorkflow,
        scholarshipCategories,
        recentActivities,
        topSchools
      ] = await Promise.all([
        this.getDashboardOverview(),
        this.getApplicationTrends(),
        this.getStatusDistribution(),
        this.getSSCWorkflow(),
        this.getScholarshipCategories(),
        this.getRecentActivities(),
        this.getTopSchools()
      ]);

      return {
        overview,
        applicationTrends: trends,
        statusDistribution,
        sscWorkflow,
        scholarshipCategories,
        recentActivities,
        topSchools,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Export dashboard report
   */
  async exportDashboardReport(format = 'csv') {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${AUTH_API_BASE_URL}/api/dashboard/export?format=${format}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
      }
    } catch (error) {
      console.warn('Export dashboard report API not available');
    }

    return false;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
