import React, { useState } from 'react';
import {
    Upload, Download, CheckCircle, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
// import studentApiService from '../../../../../services/studentApiService';

const DataTools: React.FC = () => {
    const { success: showSuccess, error: showError } = useToastContext();
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [importResults, setImportResults] = useState<any>(null);
    const [showImportSettings, setShowImportSettings] = useState(false);

    // Settings state
    const [importSettings, setImportSettings] = useState({
        skipFirstRow: true,
        delimiter: ',',
        defaultStatus: 'active'
    });

    const [exportSettings, setExportSettings] = useState({
        format: 'csv',
        includeHeaders: true,
        filterActive: false
    });

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setImportFile(file);
                showSuccess('File selected successfully');
            } else {
                showError('Please select a CSV or Excel file');
            }
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        setImportStatus('importing');
        setImportProgress(0);

        try {
            // Simulation of import process
            const interval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Real implementation would be:
            // await studentApiService.importStudents(importFile, importSettings);

            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            clearInterval(interval);
            setImportProgress(100);

            setImportResults({
                total: 10,
                successful: 8,
                failed: 2,
                errors: ['Row 3: Invalid Email', 'Row 7: Duplicate ID']
            });
            setImportStatus('success');
            showSuccess('Import completed with some errors');

        } catch (error) {
            setImportStatus('error');
            showError('Import failed');
        }
    };

    const handleExport = () => {
        showSuccess(`Exporting data as ${exportSettings.format.toUpperCase()}...`);
        // Actual export logic call
    };

    const downloadTemplate = () => {
        showSuccess('Downloading template...');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Import Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Students</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bulk upload via CSV/Excel</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowImportSettings(!showImportSettings)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showImportSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden"
                            >
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={importSettings.skipFirstRow}
                                            onChange={e => setImportSettings(prev => ({ ...prev, skipFirstRow: e.target.checked }))}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Skip Header Row</span>
                                    </label>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Delimiter</span>
                                        <select
                                            value={importSettings.delimiter}
                                            onChange={e => setImportSettings(prev => ({ ...prev, delimiter: e.target.value }))}
                                            className="mt-1 block w-full text-sm border-gray-300 rounded-md dark:bg-slate-800 dark:border-slate-600 px-2 py-1"
                                        >
                                            <option value=",">Comma (,)</option>
                                            <option value=";">Semicolon (;)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileSelect}
                            accept=".csv,.xlsx,.xls"
                        />
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {importFile ? importFile.name : 'Drop file here or click to upload'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Supported: CSV, Excel</p>
                    </div>

                    {importStatus === 'importing' && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Importing...</span>
                                <span>{importProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {importStatus === 'success' && importResults && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <span className="font-medium text-green-900 dark:text-green-100">Import Complete</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-green-700">Successful: <b>{importResults.successful}</b></div>
                                <div className="text-red-700">Failed: <b>{importResults.failed}</b></div>
                            </div>
                            {importResults.errors.length > 0 && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded max-h-24 overflow-y-auto">
                                    {importResults.errors.map((err: string, i: number) => <div key={i}>• {err}</div>)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex space-x-3">
                        <button
                            onClick={handleImport}
                            disabled={!importFile || importStatus === 'importing'}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Start Import
                        </button>
                        <button
                            onClick={downloadTemplate}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                        >
                            Template
                        </button>
                    </div>
                </div>

                {/* Export Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Download registry records</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['csv', 'excel', 'json', 'pdf'].map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportSettings(prev => ({ ...prev, format: fmt }))}
                                        className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${exportSettings.format === fmt
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="uppercase text-sm font-medium">{fmt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h4>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={exportSettings.filterActive}
                                    onChange={e => setExportSettings(prev => ({ ...prev, filterActive: e.target.checked }))}
                                    className="rounded text-green-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Active Students Only</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={exportSettings.includeHeaders}
                                    onChange={e => setExportSettings(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                                    className="rounded text-green-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Include Headers</span>
                            </label>
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download Export</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTools;
