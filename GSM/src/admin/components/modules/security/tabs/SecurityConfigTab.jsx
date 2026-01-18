import React from 'react';
import { CheckCircle } from 'lucide-react';
import SecuritySettings from '../../settings/SecuritySettings';

const SecurityConfigTab = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Configuration</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Type</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                                <option value="clamd">ClamAV Daemon (Recommended)</option>
                                <option value="clamscan">ClamAV CLI</option>
                                <option value="virustotal">VirusTotal API</option>
                                <option value="defender">Windows Defender</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Scan Timeout (seconds)</label>
                            <input
                                type="number"
                                defaultValue="30"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                            <input
                                type="number"
                                defaultValue="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fallback Policy</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                                <option value="reject">Reject (Recommended)</option>
                                <option value="allow">Allow</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Allowed File Types</h4>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input type="checkbox" defaultChecked className="mr-2" />
                                <span className="text-sm text-gray-700">PDF Documents</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" defaultChecked className="mr-2" />
                                <span className="text-sm text-gray-700">JPEG Images</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" defaultChecked className="mr-2" />
                                <span className="text-sm text-gray-700">PNG Images</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm text-gray-700">Word Documents</span>
                            </label>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Scanner Health</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-green-800 font-medium">Scanner is healthy and operational</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                                Last virus definition update: 2 hours ago
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                            Save Configuration
                        </button>
                        <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                            Test Scanner
                        </button>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Update Definitions
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SecuritySettings />
            </div>
        </div>
    );
};

export default SecurityConfigTab;
