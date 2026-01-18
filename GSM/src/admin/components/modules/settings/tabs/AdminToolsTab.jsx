import React, { useState } from 'react';
import { Database, Download, RefreshCw, AlertTriangle } from 'lucide-react';

const AdminToolsTab = ({
    handleConfirmAction,
    exportData,
    clearCache,
    refreshSystemData,
    backupSystem,
    t
}) => {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('Data Management')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => backupSystem()}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-900 dark:text-white">{t('System Backup')}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('Create a full system backup')}</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => exportData('all')}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-900 dark:text-white">{t('Export Data')}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('Download all system data')}</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => clearCache()}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-slate-900 dark:text-white">{t('Clear Cache')}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('Clear system cache')}</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-red-800">{t('Danger Zone')}</h4>
                        <p className="text-sm text-red-700 mt-1">
                            {t('Advanced system actions. Please proceed with caution.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminToolsTab;
