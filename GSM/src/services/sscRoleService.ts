import { scholarshipApiService } from './scholarshipApiService';

export interface SscRoleData {
  has_ssc_role: boolean;
  user_id?: number;
  roles: string[];
  stages: string[];
  is_chairperson: boolean;
  permissions: Array<{
    ssc_role: string;
    review_stage: string;
    can_review: boolean;
    can_approve: boolean;
    can_reject: boolean;
  }>;
  role_labels: string[];
  stage_labels: string[];
  assignments: Array<{
    id: number;
    ssc_role: string;
    role_label: string;
    review_stage: string;
    stage_label: string;
    is_active: boolean;
    assigned_at: string;
  }>;
}

// Role to Tab mapping - Based on SSC stage assignments
export const ROLE_TAB_MAPPING: Record<string, string[]> = {
  // Document Verification Stage
  city_council: ['overview', 'my-queue', 'document-verification'],
  hrd: ['overview', 'my-queue', 'document-verification'],
  social_services: ['overview', 'my-queue', 'document-verification'],
  
  // Financial Review Stage
  budget_dept: ['overview', 'my-queue', 'financial-review'],
  accounting: ['overview', 'my-queue', 'financial-review'],
  treasurer: ['overview', 'my-queue', 'financial-review'],
  
  // Academic Review Stage
  education_affairs: ['overview', 'my-queue', 'academic-review'],
  qcydo: ['overview', 'my-queue', 'academic-review'],
  planning_dept: ['overview', 'my-queue', 'academic-review'],
  schools_division: ['overview', 'my-queue', 'academic-review'],
  qcu: ['overview', 'my-queue', 'academic-review'],
  
  // Chairperson - has access to all stages
  chairperson: ['overview', 'my-queue', 'final-approval', 'history'],
};

// Stage to Tab ID mapping
export const STAGE_TAB_MAPPING: Record<string, string> = {
  document_verification: 'document-verification',
  financial_review: 'financial-review',
  academic_review: 'academic-review',
  final_approval: 'final-approval',
};

class SscRoleService {
  private roleData: SscRoleData | null = null;
  private cacheKey = 'ssc_role_data';
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  /**
   * Fetch user's SSC role assignments from backend
   */
  async fetchUserRoles(forceRefresh = false): Promise<SscRoleData> {
    // Check cache first
    if (!forceRefresh && this.roleData) {
      return this.roleData;
    }

    // Check session storage
    if (!forceRefresh) {
      const cached = this.getCachedRoles();
      if (cached) {
        this.roleData = cached;
        return cached;
      }
    }

    // Force clear cache for debugging
    if (forceRefresh) {
      this.clearCache();
    }

    try {
      const response = await scholarshipApiService.getUserSscRoles();
      console.log('SSC Role Service - API Response:', response);
      this.roleData = response;
      this.cacheRoles(response);
      return response;
    } catch (error) {
      console.error('Failed to fetch SSC roles:', error);
      // Return empty role data if fetch fails
      return {
        has_ssc_role: false,
        roles: [],
        stages: [],
        is_chairperson: false,
        permissions: [],
        role_labels: [],
        stage_labels: [],
        assignments: [],
      };
    }
  }

  /**
   * Get cached roles from session storage
   */
  private getCachedRoles(): SscRoleData | null {
    try {
      const cached = sessionStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > this.cacheExpiry) {
        sessionStorage.removeItem(this.cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading cached SSC roles:', error);
      return null;
    }
  }

  /**
   * Cache roles in session storage
   */
  private cacheRoles(data: SscRoleData): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching SSC roles:', error);
    }
  }

  /**
   * Clear cached role data
   */
  clearCache(): void {
    this.roleData = null;
    sessionStorage.removeItem(this.cacheKey);
  }

  /**
   * Check if user has any SSC role
   */
  async hasRole(): Promise<boolean> {
    const roles = await this.fetchUserRoles();
    return roles.has_ssc_role;
  }

  /**
   * Check if user is chairperson
   */
  async isChairperson(): Promise<boolean> {
    const roles = await this.fetchUserRoles();
    return roles.is_chairperson;
  }

  /**
   * Get allowed tabs for user based on their roles
   */
  async getAllowedTabs(): Promise<string[]> {
    const roles = await this.fetchUserRoles();
    
    if (!roles.has_ssc_role) {
      return [];
    }

    // Chairperson gets all tabs
    if (roles.is_chairperson) {
      return [...ROLE_TAB_MAPPING.chairperson, 'members'];
    }

    // Combine tabs from all user's roles
    const allowedTabs = new Set<string>();
    roles.roles.forEach((role) => {
      const tabs = ROLE_TAB_MAPPING[role] || [];
      tabs.forEach((tab) => allowedTabs.add(tab));
    });

    // All SSC members can view the members tab
    allowedTabs.add('members');

    return Array.from(allowedTabs);
  }

  /**
   * Check if user can access a specific tab
   */
  async canAccessTab(tabId: string): Promise<boolean> {
    const allowedTabs = await this.getAllowedTabs();
    return allowedTabs.includes(tabId);
  }

  /**
   * Get user's review stages
   */
  async getReviewStages(): Promise<string[]> {
    const roles = await this.fetchUserRoles();
    return roles.stages;
  }

  /**
   * Check if user can review a specific stage
   */
  async canReviewStage(stage: string): Promise<boolean> {
    const roles = await this.fetchUserRoles();
    return roles.stages.includes(stage);
  }

  /**
   * Get user's SSC roles
   */
  async getRoles(): Promise<string[]> {
    const roles = await this.fetchUserRoles();
    return roles.roles;
  }

  /**
   * Get user's permissions
   */
  async getPermissions(): Promise<SscRoleData['permissions']> {
    const roles = await this.fetchUserRoles();
    return roles.permissions;
  }

  /**
   * Get user's role assignments
   */
  async getAssignments(): Promise<SscRoleData['assignments']> {
    const roles = await this.fetchUserRoles();
    return roles.assignments;
  }

  /**
   * Get primary stage (first stage in user's assignments)
   */
  async getPrimaryStage(): Promise<string | null> {
    const stages = await this.getReviewStages();
    return stages.length > 0 ? stages[0] : null;
  }

  /**
   * Get primary tab (default tab for user's role)
   */
  async getPrimaryTab(): Promise<string> {
    const roles = await this.fetchUserRoles();
    
    if (!roles.has_ssc_role) {
      return 'overview';
    }

    // For chairperson, default to overview
    if (roles.is_chairperson) {
      return 'overview';
    }

    // For other roles, return the stage-specific tab
    const primaryStage = await this.getPrimaryStage();
    if (primaryStage && STAGE_TAB_MAPPING[primaryStage]) {
      return STAGE_TAB_MAPPING[primaryStage];
    }

    return 'my-queue'; // Fallback to my-queue
  }
}

// Export singleton instance
export const sscRoleService = new SscRoleService();
export default sscRoleService;

