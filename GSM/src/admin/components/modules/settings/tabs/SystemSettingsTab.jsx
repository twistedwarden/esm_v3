import React from 'react';
import { Save } from 'lucide-react';

const SystemSettingsTab = ({ systemSettings, handleSystemSettingChange, saveSystemSettings, saving, t }) => {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('System Preferences')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Theme')}</label>
                        <select
                            value={systemSettings.theme}
                            onChange={(e) => handleSystemSettingChange('theme', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="light">{t('Light')}</option>
                            <option value="dark">{t('Dark')}</option>
                            <option value="auto">{t('Auto')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Language')}</label>
                        <select
                            value={systemSettings.language}
                            onChange={(e) => handleSystemSettingChange('language', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fil">Filipino</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Timezone')}</label>
                        <select
                            value={systemSettings.timezone}
                            onChange={(e) => handleSystemSettingChange('timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Date Format')}</label>
                        <select
                            value={systemSettings.date_format}
                            onChange={(e) => handleSystemSettingChange('date_format', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={saveSystemSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsTab;
