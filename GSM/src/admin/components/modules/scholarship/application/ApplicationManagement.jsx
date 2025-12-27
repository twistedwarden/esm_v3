import React, { useState } from 'react';
import TabNavigation, { AnimatedTabContent } from '../../../ui/TabNavigation';
import AnimatedContainer from '../../../ui/AnimatedContainer';
import ApplicationOverview from './ApplicationOverview';
import ScholarshipApplications from './ScholarshipApplications';
// VerifiedEnrolledStudents removed - automatic verification disabled
import InterviewSchedules from './InterviewSchedules';
import EndorseToSSC from './EndorseToSSC';

function ApplicationManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', component: ApplicationOverview },
    { id: 'applications', label: 'Application Review', component: ScholarshipApplications },
    // Verified Enrolled Students tab removed - automatic verification disabled
    { id: 'interviews', label: 'Interview Schedules', component: InterviewSchedules },
    { id: 'endorse', label: 'Endorse to SSC', component: EndorseToSSC }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ApplicationOverview;

  return (
    <AnimatedContainer variant="page">
      {/* Application Sub-navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
        layoutId="activeApplicationTab"
        variant="compact"
      />

      {/* Render Active Component with smooth transition */}
      <AnimatedTabContent activeTab={activeTab}>
        <ActiveComponent />
      </AnimatedTabContent>
    </AnimatedContainer>
  );
}

export default ApplicationManagement;
