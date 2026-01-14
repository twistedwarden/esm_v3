import React, { useState, useEffect } from 'react';
import TabNavigation, { AnimatedTabContent } from '../../../ui/TabNavigation';
import { LoadingDecisions } from '../../../ui/LoadingSpinner';
import StandardLoading from '../../../ui/StandardLoading';
import AnimatedContainer from '../../../ui/AnimatedContainer';
import SSCOverview from './SSCOverview';
import MyQueue from './MyQueue';
import ApplicationReview from './ApplicationReview';
import DecisionHistory from './DecisionHistory';
import SSCMemberManagement from './SSCMemberManagement';
import DocumentVerificationReview from './DocumentVerificationReview';
import FinancialReview from './FinancialReview';
import AcademicReview from './AcademicReview';
import FinalApprovalReview from './FinalApprovalReview';
import { sscRoleService } from '../../../../../services/sscRoleService';

function SSCManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState(null);

  // All available tabs
  const allTabs = [
    { id: 'overview', label: 'Overview', component: SSCOverview },
    { id: 'my-queue', label: 'My Queue', component: MyQueue },
    { id: 'document-verification', label: 'Document Verification', component: DocumentVerificationReview },
    { id: 'financial-review', label: 'Financial Review', component: FinancialReview },
    { id: 'academic-review', label: 'Academic Review', component: AcademicReview },
    { id: 'final-approval', label: 'Final Approval', component: FinalApprovalReview },
    { id: 'history', label: 'Decision History', component: DecisionHistory },
    { id: 'applications', label: 'All Applications', component: ApplicationReview },
    { id: 'members', label: 'SSC Members', component: SSCMemberManagement }
  ];

  // Fetch user's SSC roles and determine allowed tabs
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        
        // Check if user is admin
        let isAdmin = false;
        try {
          const userDataStr = localStorage.getItem('user_data');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            isAdmin = userData.role === 'admin' || userData.role === 'super_admin' || userData.is_admin;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
        
        const roles = await sscRoleService.fetchUserRoles(true); // Force refresh
        console.log('SSCManagement - User Roles:', roles);
        setUserRoles(roles);
        
        const allowed = await sscRoleService.getAllowedTabs();
        console.log('SSCManagement - Allowed Tabs:', allowed);
        
        // Admins should have access to all tabs including members
        if (isAdmin) {
          setAllowedTabs([...allowed, 'members', 'overview', 'applications', 'history']);
        } else {
          setAllowedTabs(allowed);
        }

        // Set default active tab based on user's role
        const primaryTab = await sscRoleService.getPrimaryTab();
        console.log('SSCManagement - Primary Tab:', primaryTab);
        const finalAllowedTabs = isAdmin ? [...allowed, 'members', 'overview', 'applications', 'history'] : allowed;
        if (finalAllowedTabs.includes(primaryTab)) {
          setActiveTab(primaryTab);
        } else if (finalAllowedTabs.length > 0) {
          setActiveTab(finalAllowedTabs[0]);
        }
      } catch (error) {
        console.error('Error fetching SSC roles:', error);
        // Default to overview if error
        setAllowedTabs(['overview', 'members']);
        setActiveTab('overview');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Filter tabs based on user's role
  const tabs = allTabs.filter(tab => allowedTabs.includes(tab.id));

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SSCOverview;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SSC Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Loading your SSC role information...
          </p>
        </div>
        <StandardLoading variant="module" module="ssc" message="Loading SSC management..." />
      </div>
    );
  }

  return (
    <AnimatedContainer variant="page" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SSC Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {(() => {
            console.log('SSCManagement - Header Logic:', {
              is_chairperson: userRoles?.is_chairperson,
              role_labels: userRoles?.role_labels,
              userRoles: userRoles
            });
            return userRoles?.is_chairperson 
              ? 'SSC Chairperson - Final Approval & Decision Management'
              : userRoles?.role_labels?.join(', ') || 'Scholarship Screening Committee - Application Review';
          })()}
        </p>
      </div>

      {/* SSC Sub-navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        layoutId="activeSscTab"
        variant="default"
      />

      {/* Render Active Component with smooth transition */}
      <AnimatedTabContent activeTab={activeTab}>
        <ActiveComponent />
      </AnimatedTabContent>
    </AnimatedContainer>
  );
}

export default SSCManagement;
