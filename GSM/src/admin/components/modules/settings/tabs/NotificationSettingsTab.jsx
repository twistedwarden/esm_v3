import React from 'react';
import { Save } from 'lucide-react';

const NotificationSettingsTab = ({ notifications, handleNotificationChange, saveNotifications, saving }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Regular Notification Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                    {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                    {key.replace(/_/g, ' ')}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {key === 'email_notifications' && 'Receive notifications via email'}
                                    {key === 'sms_alerts' && 'Receive SMS alerts for important updates'}
                                    {key === 'push_notifications' && 'Receive push notifications in browser'}
                                    {key === 'weekly_reports' && 'Receive weekly summary reports'}
                                    {key === 'system_updates' && 'Receive system maintenance notifications'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => handleNotificationChange(key, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={saveNotifications}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsTab;
