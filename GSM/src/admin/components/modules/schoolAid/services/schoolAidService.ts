// School Aid Distribution Service
import { ScholarshipApplication, PaymentRecord, ProcessingMetrics, DisbursementHistoryRecord } from '../types';
import { API_CONFIG } from '../../../../../config/api';

const API_BASE_URL = `${API_CONFIG.AID_SERVICE.BASE_URL}/api`;

class SchoolAidService {
  private buildAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;

      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.id != null) {
            headers['X-User-ID'] = String(user.id);
          }
          if (user?.role) {
            headers['X-User-Role'] = String(user.role);
          }
          if (user?.email) {
            headers['X-User-Email'] = String(user.email);
          }
          if (user?.first_name) {
            headers['X-User-First-Name'] = String(user.first_name);
          }
          if (user?.last_name) {
            headers['X-User-Last-Name'] = String(user.last_name);
          }
        }
      } catch (error) {
        console.warn('SchoolAidService: failed to parse user_data from localStorage', error);
      }
    }

    return headers;
  }
  // Applications
  async getApplications(filters?: {
    status?: string;
    search?: string;
    submodule?: string;
  }): Promise<ScholarshipApplication[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.submodule) params.append('submodule', filters.submodule);

    const response = await fetch(`${API_BASE_URL}/school-aid/applications?${params}`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }

    const data = await response.json();

    // Map backend response to frontend types to ensure all fields are present
    return data.map((app: any) => {
      // Check for nested application object (backend might return data nested)
      const appData = app.application || app;

      // Helper to extract wallet method safely
      let walletMethod = undefined;
      const digitalWallets = appData.digital_wallets || app.digital_wallets;

      if (digitalWallets) {
        let wallets = digitalWallets;
        // If it comes as a JSON string, parse it
        if (typeof wallets === 'string') {
          try {
            // Check if it looks like a JSON array
            if (wallets.trim().startsWith('[')) {
              wallets = JSON.parse(wallets);
            }
          } catch (e) {
            console.warn('Failed to parse digital_wallets', e);
          }
        }

        if (Array.isArray(wallets) && wallets.length > 0) {
          walletMethod = wallets[0];
        } else if (typeof wallets === 'string') {
          walletMethod = wallets;
        }
      }

      // Debug logging
      console.log('SchoolAidService - Mapping application:', {
        id: app.id,
        digital_wallets: digitalWallets,
        walletMethod,
        raw_app: app
      });

      return {
        ...app,
        studentName: app.studentName || app.student_name || appData.student_name || `${app.first_name || appData.first_name || ''} ${app.last_name || appData.last_name || ''}`.trim(),
        studentId: app.studentId || app.student_id || appData.student_id_number || app.student_id_number,
        paymentMethod: app.paymentMethod || app.payment_method || appData.payment_method || walletMethod,
        walletAccountNumber: app.walletAccountNumber || app.wallet_account_number || appData.wallet_account_number || app.account_number,
        schoolYear: app.schoolYear || app.school_year || appData.school_year,
        submittedDate: app.submittedDate || app.submitted_at || appData.submitted_at || app.created_at,
        approvalDate: app.approvalDate || app.approved_at || appData.approved_at,
        digitalWallets: digitalWallets,
      };
    });
  }

  async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/school-aid/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update application status: ${response.statusText}`);
    }
  }

  async processGrant(applicationId: string): Promise<any> {
    // Get user data for audit trail
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
    let userId: string | undefined;
    let userName: string | undefined;

    if (userData) {
      try {
        const user = JSON.parse(userData);
        userId = user?.id ? String(user.id) : undefined;
        userName = user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}`.trim()
          : user?.name || user?.email || undefined;
      } catch (error) {
        console.warn('Failed to parse user data:', error);
      }
    }

    const response = await fetch(`${API_BASE_URL}/school-aid/applications/${applicationId}/process-grant`, {
      method: 'POST',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        user_id: userId,
        user_name: userName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to process grant: ${response.statusText}`);
    }

    return await response.json();
  }

  async batchUpdateApplications(applicationIds: string[], status: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/school-aid/applications/batch-update`, {
      method: 'PATCH',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ applicationIds, status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch update applications: ${response.statusText}`);
    }
  }

  async revertApplicationOnCancel(params: {
    application_id?: string;
    checkout_session_id?: string;
    transaction_id?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/school-aid/applications/revert-on-cancel`, {
      method: 'POST',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to revert application status: ${response.statusText}`);
    }

    return await response.json();
  }

  // Payments
  async processPayment(applicationId: string, paymentMethod: string): Promise<PaymentRecord> {
    const response = await fetch(`${API_BASE_URL}/school-aid/payments/process`, {
      method: 'POST',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ applicationId, paymentMethod }),
    });

    if (!response.ok) {
      throw new Error(`Failed to process payment: ${response.statusText}`);
    }

    return await response.json();
  }

  async processPaymentWithDetails(
    applicationId: string,
    method: string,
    providerName: string,
    referenceNumber: string,
    receiptFile: File | null,
    notes: string,
    disbursedById?: string,
    disbursedByName?: string
  ): Promise<PaymentRecord> {
    const formData = new FormData();
    formData.append('applicationId', applicationId);
    formData.append('method', method);
    formData.append('providerName', providerName);
    formData.append('referenceNumber', referenceNumber);
    formData.append('notes', notes);
    if (disbursedById) {
      formData.append('disbursedById', disbursedById);
    }
    if (disbursedByName) {
      formData.append('disbursedByName', disbursedByName);
    }

    if (receiptFile) {
      formData.append('receiptFile', receiptFile);
    }

    const response = await fetch(`${API_BASE_URL}/school-aid/applications/${applicationId}/disburse`, {
      method: 'POST',
      headers: this.buildAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to process payment with details: ${response.statusText}`);
    }

    return await response.json();
  }

  async retryPayment(paymentId: string): Promise<PaymentRecord> {
    const response = await fetch(`${API_BASE_URL}/school-aid/payments/${paymentId}/retry`, {
      method: 'POST',
      headers: this.buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to retry payment: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPaymentRecords(filters?: { status?: string }): Promise<PaymentRecord[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/school-aid/payments?${params}`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch payment records: ${response.statusText}`);
    }

    return await response.json();
  }

  async getDisbursementHistory(filters?: {
    search?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<DisbursementHistoryRecord[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDir) params.append('sortDir', filters.sortDir);

    const response = await fetch(`${API_BASE_URL}/school-aid/disbursements?${params}`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch disbursement history: ${response.statusText}`);
    }

    return await response.json();
  }

  // Analytics
  async getMetrics(filters?: { school_year?: string }): Promise<ProcessingMetrics> {
    const params = new URLSearchParams();
    if (filters?.school_year) {
      params.append('school_year', filters.school_year);
    }

    const url = `${API_BASE_URL}/school-aid/metrics${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAnalyticsData(type: string, dateRange: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/school-aid/analytics/${type}?range=${dateRange}`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAvailableSchoolYears(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/school-aid/school-years`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch school years: ${response.statusText}`);
    }

    const data = await response.json();
    return data.school_years || [];
  }

  // Settings
  async getSettings(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/school-aid/settings`, {
      headers: this.buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    return await response.json();
  }

  async updateSettings(settings: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/school-aid/settings`, {
      method: 'PUT',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.statusText}`);
    }
  }

  async testConfiguration(type: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/school-aid/settings/test/${type}`, {
      method: 'POST',
      headers: this.buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to test configuration: ${response.statusText}`);
    }

    return await response.json();
  }

  // Budget Management
  async getBudgets(schoolYear?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (schoolYear) {
      params.append('school_year', schoolYear);
    }

    const response = await fetch(`${API_BASE_URL}/school-aid/budgets?${params.toString()}`, {
      headers: this.buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch budgets: ${response.statusText}`);
    }

    const data = await response.json();
    return data.budgets || [];
  }

  async createOrUpdateBudget(budgetData: {
    budget_type: string;
    school_year: string;
    total_budget: number;
    description?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/school-aid/budget`, {
      method: 'POST',
      headers: this.buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(budgetData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to save budget: ${response.statusText}`);
    }

    return await response.json();
  }

}

export const schoolAidService = new SchoolAidService();
