import React from 'react';
import { FileText } from 'lucide-react';

const ScanLogsTab = ({ logs }) => {

    const getStatusIcon = (status) => {
        // We will receive getStatusIcon via props or just define it here?
        // Since it relies on imported icons, better to keep it here or shared.
        // Actually, importing icons is cleaner here.
        return null; // Placeholder as we render inside table directly? 
        // No, the original code used a helper. I'll include the helper logic or simplify.
    };
    // To make it self-contained, I'll import icons and define helpers inside.
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Scan Logs</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{log.file_name}</div>
                                            <div className="text-sm text-gray-500">{log.mime_type}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge isClean={log.is_clean} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.threat_name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.scan_duration ? `${log.scan_duration}s` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.first_name} {log.last_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper component for status
import { CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

const StatusBadge = ({ isClean }) => {
    const status = isClean ? 'clean' : 'infected';

    let colorClass = 'text-gray-600 bg-gray-100';
    let Icon = Activity;
    let label = 'Unknown';

    if (status === 'clean') {
        colorClass = 'text-green-600 bg-green-100';
        Icon = CheckCircle;
        label = 'Clean';
    } else if (status === 'infected') {
        colorClass = 'text-red-600 bg-red-100';
        Icon = AlertTriangle;
        label = 'Infected';
    }

    return (
        <div className="flex items-center">
            <Icon className={`h-4 w-4 ${status === 'clean' ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                {label}
            </span>
        </div>
    );
};

export default ScanLogsTab;
