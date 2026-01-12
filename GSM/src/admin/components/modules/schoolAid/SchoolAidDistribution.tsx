import { useState } from 'react';
import {
  FileText,
  DollarSign,
  LayoutDashboard
} from 'lucide-react';
import { TabConfig, ScholarshipApplication } from './types';
import SADOverview from './SADOverview';
import ApplicationsTab from './tabs/ApplicationsTab';
import PaymentsTab from './tabs/PaymentsTab';
import ManualDisbursementModal from './components/disbursement/ManualDisbursementModal';
import ApplicationViewModal from './components/ApplicationViewModal';
import { schoolAidService } from './services/schoolAidService';
import { useAuthStore, getFullName } from '../../../../store/v1authStore';

interface SchoolAidDistributionProps {
  onPageChange?: (id: string, tabId?: string) => void;
}

const SchoolAidDistribution = ({ onPageChange }: SchoolAidDistributionProps = {}) => {
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    application: null as ScholarshipApplication | null,
    mode: 'view' as 'view' | 'process' | 'edit'
  });
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      component: SADOverview,
      submodules: []
    },
    {
      id: 'applications',
      label: 'Processing Grants',
      icon: FileText,
      component: ApplicationsTab,
      submodules: []
    },
    {
      id: 'payments',
      label: 'Disbursement',
      icon: DollarSign,
      component: PaymentsTab,
      statusFilter: ['grants_processing'],
      submodules: []
    }
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);

  const handleProcessPayment = async (application: ScholarshipApplication, formData?: any): Promise<void> => {
    try {
      console.log('Processing payment for:', application, 'with data:', formData);

      // If form data is provided (from ManualDisbursementModal), process with that data
      if (formData) {
        // Process payment with form data - this already sets status to grants_disbursed
        const paymentRecord = await schoolAidService.processPaymentWithDetails(
          application.id,
          formData.method,
          formData.providerName,
          formData.referenceNumber,
          formData.receiptFile,
          formData.notes,
          currentUser ? currentUser.id : undefined,
          currentUser ? getFullName(currentUser) : undefined
        );

        console.log('Payment processed successfully with form data:', paymentRecord);
      } else {
        // Legacy processing (without form data)
        const paymentRecord = await schoolAidService.processPayment(application.id, 'bank_transfer');

        // Update application status to processing
        await schoolAidService.updateApplicationStatus(application.id, 'grants_processing');

        console.log('Payment processed successfully:', paymentRecord);
      }

      // Close modal after successful processing
      setModalState(prev => ({ ...prev, isOpen: false }));

      // Trigger refresh
      setLastUpdated(Date.now());

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  const handleBatchProcessPayments = async (applicationIds: string[]) => {
    try {
      console.log('Batch processing payments for:', applicationIds);

      // Update all applications to processing status
      await schoolAidService.batchUpdateApplications(applicationIds, 'grants_processing');

      // Process each payment
      for (const applicationId of applicationIds) {
        await schoolAidService.processPayment(applicationId, 'bank_transfer');
      }

      console.log('Batch payment processing completed');

      // Trigger refresh
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error batch processing payments:', error);
      throw error;
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      await schoolAidService.updateApplicationStatus(applicationId, 'approved');
      console.log('Application approved:', applicationId);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    try {
      await schoolAidService.updateApplicationStatus(applicationId, 'rejected', reason);
      console.log('Application rejected:', applicationId, reason);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  };

  const handleProcessGrant = async (application: ScholarshipApplication) => {
    try {
      // Process grant using the dedicated API endpoint
      const result = await schoolAidService.processGrant(application.id);
      console.log('Grant processing initiated for application:', application.id, result);

      // Show success message or notification
      // You can add additional logic here for grant processing
      // For example, creating disbursement records, sending notifications, etc.

      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error processing grant:', error);
      throw error;
    }
  };

  const renderTabContent = () => {
    // Show tab content when active tab config is available
    if (!activeTabConfig || !activeTabConfig.component) {
      return null;
    }

    const Component = activeTabConfig.component;
    const submoduleConfig = {
      id: activeTabConfig.id,
      label: activeTabConfig.label,
      description: '',
      component: Component,
      statusFilter: activeTabConfig.statusFilter,
      actions: []
    };

    return (
      <Component
        submodule={submoduleConfig}
        activeTab={activeTab}
        activeSubmodule={activeTab}
        selectedApplications={selectedApplications}
        setSelectedApplications={setSelectedApplications}
        modalState={modalState}
        setModalState={setModalState}
        onProcessPayment={handleProcessPayment}
        onProcessGrant={handleProcessGrant}
        onBatchProcessPayments={handleBatchProcessPayments}
        onApproveApplication={handleApproveApplication}
        onRejectApplication={handleRejectApplication}
        lastUpdated={lastUpdated}
        onPageChange={onPageChange || (() => {})}
      />
    );
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">School Aid Distribution</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
              Manage and track scholarship fund disbursements to students
            </p>
          </div>
          {selectedApplications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                {selectedApplications.length} selected
              </span>
              <button
                onClick={() => setSelectedApplications([])}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="px-3 sm:px-4 lg:px-6">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1 sm:gap-2 py-2 sm:py-3 lg:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm
                    transition-colors duration-200 relative whitespace-nowrap flex-shrink-0
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 sm:ml-2 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>


      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900">
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* View-Only Modal for Processing Grants Tab */}
      <ApplicationViewModal
        isOpen={modalState.isOpen && modalState.mode === 'view'}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        application={modalState.application}
      />

      {/* Manual Disbursement Modal for Disbursement Tab */}
      <ManualDisbursementModal
        isOpen={modalState.isOpen && modalState.mode === 'process'}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        application={modalState.application}
        onSubmit={async (data) => {
          if (modalState.application) {
            await handleProcessPayment(modalState.application, data);
          }
        }}
        isSubmitting={false}
      />
    </div>
  );
};

export default SchoolAidDistribution;

