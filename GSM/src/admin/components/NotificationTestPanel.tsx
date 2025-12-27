import React, { useState } from 'react';
import { Bell, TestTube, X, CheckCircle, AlertCircle, Clock, Users, FileText } from 'lucide-react';
import notificationService from '../../services/notificationService';

const NotificationTestPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNewApplication = () => {
    const mockApplication = {
      id: 'test-001',
      student_name: 'John Doe',
      scholarship_category: 'Academic Excellence',
      student_id: 'STU-001',
      education_level: 'College'
    };
    
    notificationService.notifyNewApplication(mockApplication);
    addTestResult('New application notification sent');
  };

  const testApplicationReview = () => {
    const mockApplication = {
      id: 'test-002',
      student_name: 'Jane Smith',
      scholarship_category: 'Financial Aid',
      student_id: 'STU-002',
      education_level: 'High School'
    };
    
    notificationService.notifyApplicationReview(mockApplication, 'reviewed');
    addTestResult('Application review notification sent');
  };

  const testInterviewScheduled = () => {
    const mockInterview = {
      id: 'int-001',
      application_id: 'test-003',
      student_id: 'STU-003',
      student_name: 'Mike Johnson',
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    notificationService.notifyInterviewScheduled(mockInterview);
    addTestResult('Interview scheduled notification sent');
  };

  const testFinalApproval = () => {
    const mockApplication = {
      id: 'test-004',
      student_name: 'Sarah Wilson',
      scholarship_category: 'Merit Scholarship',
      student_id: 'STU-004',
      education_level: 'College'
    };
    
    notificationService.notifyFinalApproval(mockApplication);
    addTestResult('Final approval notification sent');
  };

  const testBulkAction = () => {
    notificationService.notifyBulkAction('reviewed', 5);
    addTestResult('Bulk action notification sent');
  };

  const testSystemEvent = () => {
    notificationService.notifySystemEvent('maintenance', 'System maintenance scheduled for tonight');
    addTestResult('System event notification sent');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Notification Test Panel"
        >
          <TestTube className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notification Test Panel
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testNewApplication}
            className="flex items-center space-x-2 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>New App</span>
          </button>
          
          <button
            onClick={testApplicationReview}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Review</span>
          </button>
          
          <button
            onClick={testInterviewScheduled}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-sm transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Interview</span>
          </button>
          
          <button
            onClick={testFinalApproval}
            className="flex items-center space-x-2 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approval</span>
          </button>
          
          <button
            onClick={testBulkAction}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-sm transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Bulk</span>
          </button>
          
          <button
            onClick={testSystemEvent}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>

        {/* Test Results */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Results</h4>
            <button
              onClick={clearResults}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400">
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-500">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1 font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPanel;
