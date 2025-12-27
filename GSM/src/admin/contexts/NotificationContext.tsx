import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scholarshipApiService } from '../../services/scholarshipApiService';
import notificationService from '../../services/notificationService';
import axios from 'axios';
import { getScholarshipServiceUrl } from '../../config/api';

interface NotificationCounts {
  scholarship: {
    applications: number;
    total: number;
  };
  schoolAid: {
    applications: number;
    total: number;
  };
  studentRegistry: {
    newStudents: number;
    total: number;
  };
  auditLogs: {
    newLogs: number;
    total: number;
  };
  security: {
    threats: number;
    total: number;
  };
}

interface NotificationContextType {
  notificationCounts: NotificationCounts;
  refreshNotifications: () => Promise<void>;
  markAsRead: (module: keyof NotificationCounts, subModule?: string) => void;
  triggerNotification: (module: keyof NotificationCounts, subModule?: string) => void;
  triggerScholarshipNotification: (type: string, data: any) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    scholarship: { applications: 0, total: 0 },
    schoolAid: { applications: 0, total: 0 },
    studentRegistry: { newStudents: 0, total: 0 },
    auditLogs: { newLogs: 0, total: 0 },
    security: { threats: 0, total: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotificationCounts = async () => {
    setIsLoading(true);
    try {
      const SCHOLARSHIP_API = getScholarshipServiceUrl('/api');
      
      // Fetch scholarship application counts
      let scholarshipApplications = 0;
      try {
        const response = await fetch(`${SCHOLARSHIP_API}/applications/counts`);
        if (response.ok) {
          const data = await response.json();
          scholarshipApplications = data.data?.submitted || 0;
        }
      } catch (error) {
        console.warn('Scholarship API not available:', error);
      }
      
      // Fetch user counts for student registry notifications
      let newUsers = 0;
      try {
        const usersResponse = await axios.get(`${SCHOLARSHIP_API}/users`);
        if (usersResponse.data.success) {
          const userData = usersResponse.data.data;
          let allUsers = [];
          
          if (Array.isArray(userData)) {
            allUsers = userData;
          } else {
            allUsers = [
              ...(userData.citizens || []),
              ...(userData.staff || []),
              ...(userData.admins || []),
              ...(userData.ps_reps || [])
            ];
          }
          
          // Count users created in the last 24 hours
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          newUsers = allUsers.filter(user => {
            const createdAt = new Date(user.created_at || user.createdAt);
            return createdAt > oneDayAgo;
          }).length;
        }
      } catch (error) {
        console.warn('Users API not available:', error);
      }
      
      // Fetch school aid application counts (mock data for now)
      const schoolAidCount = 0; // Replace with actual API call
      
      // Fetch audit log counts (mock data for now)
      const auditLogCount = 0; // Replace with actual API call
      
      // Fetch security threat counts (mock data for now)
      const securityThreatCount = 0; // Replace with actual API call

      setNotificationCounts({
        scholarship: {
          applications: scholarshipApplications,
          total: scholarshipApplications,
        },
        schoolAid: {
          applications: schoolAidCount,
          total: schoolAidCount,
        },
        studentRegistry: {
          newStudents: newUsers,
          total: newUsers,
        },
        auditLogs: {
          newLogs: auditLogCount,
          total: auditLogCount,
        },
        security: {
          threats: securityThreatCount,
          total: securityThreatCount,
        },
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotificationCounts();
  };

  const markAsRead = (module: keyof NotificationCounts, subModule?: string) => {
    setNotificationCounts(prev => {
      const newCounts = { ...prev };
      if (subModule) {
        // Mark specific sub-module as read
        if (module === 'scholarship' && subModule === 'applications') {
          newCounts.scholarship.applications = 0;
        } else if (module === 'schoolAid' && subModule === 'applications') {
          newCounts.schoolAid.applications = 0;
        } else if (module === 'studentRegistry' && subModule === 'newStudents') {
          newCounts.studentRegistry.newStudents = 0;
        } else if (module === 'auditLogs' && subModule === 'newLogs') {
          newCounts.auditLogs.newLogs = 0;
        } else if (module === 'security' && subModule === 'threats') {
          newCounts.security.threats = 0;
        }
      } else {
        // Mark entire module as read
        newCounts[module] = { ...newCounts[module], total: 0 };
      }
      
      // Recalculate total for the module
      const moduleCounts = newCounts[module];
      if (typeof moduleCounts === 'object' && 'applications' in moduleCounts) {
        moduleCounts.total = Object.values(moduleCounts).reduce((sum, count) => 
          typeof count === 'number' ? sum + count : sum, 0
        );
      }
      
      return newCounts;
    });
  };

  const triggerNotification = (module: keyof NotificationCounts, subModule?: string) => {
    console.log(`Triggering notification for ${module}${subModule ? `/${subModule}` : ''}`);
    setNotificationCounts(prev => {
      const newCounts = { ...prev };
      if (subModule) {
        // Increment specific sub-module count
        if (module === 'scholarship' && subModule === 'applications') {
          newCounts.scholarship.applications += 1;
        } else if (module === 'schoolAid' && subModule === 'applications') {
          newCounts.schoolAid.applications += 1;
        } else if (module === 'studentRegistry' && subModule === 'newStudents') {
          newCounts.studentRegistry.newStudents += 1;
        } else if (module === 'auditLogs' && subModule === 'newLogs') {
          newCounts.auditLogs.newLogs += 1;
        } else if (module === 'security' && subModule === 'threats') {
          newCounts.security.threats += 1;
        }
      } else {
        // Increment entire module count
        if (module === 'scholarship') {
          newCounts.scholarship.applications += 1;
        } else if (module === 'schoolAid') {
          newCounts.schoolAid.applications += 1;
        } else if (module === 'studentRegistry') {
          newCounts.studentRegistry.newStudents += 1;
        } else if (module === 'auditLogs') {
          newCounts.auditLogs.newLogs += 1;
        } else if (module === 'security') {
          newCounts.security.threats += 1;
        }
      }
      
      // Recalculate total for the module
      const moduleCounts = newCounts[module];
      if (typeof moduleCounts === 'object' && 'applications' in moduleCounts) {
        moduleCounts.total = Object.values(moduleCounts).reduce((sum, count) => 
          typeof count === 'number' ? sum + count : sum, 0
        );
      }
      
      console.log('Updated notification counts:', newCounts);
      return newCounts;
    });
  };

  useEffect(() => {
    fetchNotificationCounts();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchNotificationCounts, 30000);
    
    // Listen for user registration events
    const handleUserRegistered = () => {
      triggerNotification('studentRegistry', 'newStudents');
    };
    
    window.addEventListener('userRegistered', handleUserRegistered);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('userRegistered', handleUserRegistered);
    };
  }, []);

  // Initialize notification service
  useEffect(() => {
    // Request notification permission
    notificationService.requestPermission();

    // Listen for scholarship notifications
    const handleScholarshipNotification = (notification: any) => {
      if (notification.type.startsWith('scholarship_')) {
        triggerNotification('scholarship', 'applications');
      }
    };

    notificationService.subscribe('scholarship_new_application', handleScholarshipNotification);
    notificationService.subscribe('scholarship_application_review', handleScholarshipNotification);
    notificationService.subscribe('scholarship_interview_scheduled', handleScholarshipNotification);
    notificationService.subscribe('scholarship_interview_completed', handleScholarshipNotification);
    notificationService.subscribe('scholarship_final_approval', handleScholarshipNotification);
    notificationService.subscribe('scholarship_bulk_action', handleScholarshipNotification);

    return () => {
      notificationService.unsubscribe('scholarship_new_application', handleScholarshipNotification);
      notificationService.unsubscribe('scholarship_application_review', handleScholarshipNotification);
      notificationService.unsubscribe('scholarship_interview_scheduled', handleScholarshipNotification);
      notificationService.unsubscribe('scholarship_interview_completed', handleScholarshipNotification);
      notificationService.unsubscribe('scholarship_final_approval', handleScholarshipNotification);
      notificationService.unsubscribe('scholarship_bulk_action', handleScholarshipNotification);
    };
  }, []);

  const triggerScholarshipNotification = (type: string, data: any) => {
    switch (type) {
      case 'new_application':
        notificationService.notifyNewApplication(data);
        break;
      case 'application_review':
        notificationService.notifyApplicationReview(data.application, data.action);
        break;
      case 'interview_scheduled':
        notificationService.notifyInterviewScheduled(data);
        break;
      case 'interview_completed':
        notificationService.notifyInterviewCompleted(data.interview, data.result);
        break;
      case 'final_approval':
        notificationService.notifyFinalApproval(data);
        break;
      case 'bulk_action':
        notificationService.notifyBulkAction(data.action, data.count);
        break;
      default:
        console.warn('Unknown scholarship notification type:', type);
    }
  };

  const value: NotificationContextType = {
    notificationCounts,
    refreshNotifications,
    markAsRead,
    triggerNotification,
    triggerScholarshipNotification,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
