import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  TestTube, 
  RefreshCw,
  CreditCard,
  Mail,
  Bell,
  Shield,
  Users,
  Workflow,
  PhilippinePeso,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { SubmoduleConfig } from '../types';
import { schoolAidService } from '../services/schoolAidService';

interface SettingsTabProps {
  submodule: SubmoduleConfig;
  activeTab: string;
  activeSubmodule: string;
  selectedApplications: string[];
  setSelectedApplications: (ids: string[]) => void;
  modalState: any;
  setModalState: (state: any) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  submodule,
  activeTab,
  activeSubmodule
}) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [activeSubmodule]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await schoolAidService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (path: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newSettings;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await schoolAidService.updateSettings(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (testType: string) => {
    setTestResults((prev: any) => ({
      ...prev,
      [testType]: { status: 'testing', message: 'Testing...' }
    }));

    try {
      const result = await schoolAidService.testConfiguration(testType);
      setTestResults((prev: any) => ({
        ...prev,
        [testType]: {
          status: result.success ? 'success' : 'error',
          message: result.message
        }
      }));
    } catch (error) {
      setTestResults((prev: any) => ({
        ...prev,
        [testType]: {
          status: 'error',
          message: 'Test failed - check configuration'
        }
      }));
    }
  };

  const renderPaymentConfig = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Gateway Configuration</h3>
        
        {/* Bank Transfer */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Bank Transfer</h4>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment_config?.bank_transfer?.enabled || false}
                onChange={(e) => handleSettingChange('payment_config.bank_transfer.enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enabled</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.payment_config?.bank_transfer?.bank_name || ''}
                onChange={(e) => handleSettingChange('payment_config.bank_transfer.bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.payment_config?.bank_transfer?.account_number || ''}
                onChange={(e) => handleSettingChange('payment_config.bank_transfer.account_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit</label>
              <input
                type="number"
                value={settings.payment_config?.bank_transfer?.daily_limit || 0}
                onChange={(e) => handleSettingChange('payment_config.bank_transfer.daily_limit', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processing Time</label>
              <input
                type="text"
                value={settings.payment_config?.bank_transfer?.processing_time || ''}
                onChange={(e) => handleSettingChange('payment_config.bank_transfer.processing_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* GCash */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <PhilippinePeso className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">GCash</h4>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payment_config?.gcash?.enabled || false}
                onChange={(e) => handleSettingChange('payment_config.gcash.enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enabled</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
              <input
                type="text"
                value={settings.payment_config?.gcash?.merchant_id || ''}
                onChange={(e) => handleSettingChange('payment_config.gcash.merchant_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit</label>
              <input
                type="number"
                value={settings.payment_config?.gcash?.daily_limit || 0}
                onChange={(e) => handleSettingChange('payment_config.gcash.daily_limit', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => handleTest('payment_config')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <TestTube className="w-4 h-4" />
            Test Configuration
          </button>
          {testResults.payment_config && (
            <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
              testResults.payment_config.status === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {testResults.payment_config.status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testResults.payment_config.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications?.email?.enabled || false}
              onChange={(e) => handleSettingChange('notifications.email.enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Server</label>
            <input
              type="text"
              value={settings.notifications?.email?.smtp_server || ''}
              onChange={(e) => handleSettingChange('notifications.email.smtp_server', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={settings.notifications?.email?.smtp_port || ''}
              onChange={(e) => handleSettingChange('notifications.email.smtp_port', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={settings.notifications?.email?.username || ''}
            onChange={(e) => handleSettingChange('notifications.email.username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleTest('email')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <TestTube className="w-4 h-4" />
            Test Email
          </button>
          {testResults.email && (
            <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
              testResults.email.status === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {testResults.email.status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testResults.email.message}
            </div>
          )}
        </div>
      </div>

      {/* SMS Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications?.sms?.enabled || false}
              onChange={(e) => handleSettingChange('notifications.sms.enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={settings.notifications?.sms?.provider || ''}
              onChange={(e) => handleSettingChange('notifications.sms.provider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Twilio">Twilio</option>
              <option value="Vonage">Vonage</option>
              <option value="Local">Local Provider</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={settings.notifications?.sms?.api_key || ''}
              onChange={(e) => handleSettingChange('notifications.sms.api_key', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleTest('sms')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <TestTube className="w-4 h-4" />
            Test SMS
          </button>
          {testResults.sms && (
            <div className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
              testResults.sms.status === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {testResults.sms.status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testResults.sms.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h3>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.workflow?.auto_approval?.enabled || false}
              onChange={(e) => handleSettingChange('workflow.auto_approval.enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Enable Auto-Approval</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">Automatically approve applications that meet criteria</p>
        </div>

        {settings.workflow?.auto_approval?.enabled && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Auto-Approval Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.workflow?.auto_approval?.criteria?.gpa_threshold || 0}
                  onChange={(e) => handleSettingChange('workflow.auto_approval.criteria.gpa_threshold', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Threshold</label>
                <input
                  type="number"
                  value={settings.workflow?.auto_approval?.criteria?.income_threshold || 0}
                  onChange={(e) => handleSettingChange('workflow.auto_approval.criteria.income_threshold', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Completeness</label>
                <input
                  type="number"
                  value={settings.workflow?.auto_approval?.criteria?.document_completeness || 0}
                  onChange={(e) => handleSettingChange('workflow.auto_approval.criteria.document_completeness', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Approval Steps</h4>
          <div className="space-y-3">
            {settings.workflow?.approval_steps?.map((step: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-3">Step {step.step}</span>
                  <span className="text-sm text-gray-700">{step.role}</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={step.required}
                      onChange={(e) => handleSettingChange(`workflow.approval_steps.${index}.required`, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-600">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={step.auto_approve}
                      onChange={(e) => handleSettingChange(`workflow.approval_steps.${index}.auto_approve`, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-600">Auto-approve</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Escalation Settings</h4>
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.workflow?.escalation?.enabled || false}
                onChange={(e) => handleSettingChange('workflow.escalation.enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Enable Escalation</span>
            </label>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.workflow?.escalation?.timeout_hours || 72}
                  onChange={(e) => handleSettingChange('workflow.escalation.timeout_hours', Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Escalate to</label>
                <select
                  value={settings.workflow?.escalation?.escalate_to || ''}
                  onChange={(e) => handleSettingChange('workflow.escalation.escalate_to', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles & Permissions</h3>
        
        <div className="space-y-4">
          {settings.permissions?.roles?.map((role: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">{role.name}</h4>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {role.users} users
                  </span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">Edit Role</button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {role.permissions.map((permission: string, permIndex: number) => (
                  <div key={permIndex} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700 capitalize">
                      {permission.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Users className="w-4 h-4" />
            Add New Role
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSubmodule) {
      case 'payment_config':
        return renderPaymentConfig();
      case 'notifications':
        return renderNotifications();
      case 'workflow':
        return renderWorkflow();
      case 'permissions':
        return renderPermissions();
      default:
        return renderPaymentConfig();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{submodule.label}</h2>
          <p className="text-sm text-gray-600 mt-1">{submodule.description}</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <div className="flex items-center text-sm text-orange-600">
              <Info className="w-4 h-4 mr-1" />
              Unsaved changes
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default SettingsTab;
