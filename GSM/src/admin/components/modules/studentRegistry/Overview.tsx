import React, { useState, useEffect } from 'react';
import {
    UserPlus, Clock, FileText, Download, Upload
} from 'lucide-react';
import StudentStats from './components/StudentStats';
import StudentFormModal from './components/StudentFormModal';
import studentApiService from '../../../../services/studentApiService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { Loader2 } from 'lucide-react';

interface OverviewProps {
    onPageChange?: (id: string, tabId?: string) => void;
}

const Overview: React.FC<OverviewProps> = ({ onPageChange }) => {
    const { showSuccess } = useToastContext();
    const [recentStudents, setRecentStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchRecentStudents();
    }, []);

    const fetchRecentStudents = async () => {
        try {
            const response = await studentApiService.getStudents({
                per_page: 5,
                sort: 'created_at',
                order: 'desc'
            });
            const res = response as any;
            const data = res.data?.data || res.data || [];
            setRecentStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch recent students:', error);
            // Don't show error toast on initial load to avoid annoyance, just log
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Registry Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        System snapshot and quick actions
                    </p>
                </div>
                {/* <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Student</span>
                </button> */}
            </div>

            {/* Statistics Cards */}
            <StudentStats />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Registrations */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            Recent Registrations
                        </h2>
                        <button
                            onClick={() => onPageChange?.('studentRegistry-directory')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : recentStudents.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {recentStudents.map((student, index) => (
                                <div key={student.student_uuid || index} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 font-bold">
                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {student.first_name} {student.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {student.program} • {student.year_level}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {student.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(student.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            No recent registrations found
                        </div>
                    )}
                </div>

                {/* Quick Actions & Links */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => onPageChange?.('studentRegistry-tools')}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Import Students</p>
                                    <p className="text-xs text-gray-500">Bulk upload via CSV/Excel</p>
                                </div>
                            </button>
                            <button
                                onClick={() => onPageChange?.('studentRegistry-tools')}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Download className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                                    <p className="text-xs text-gray-500">Download registry reports</p>
                                </div>
                            </button>
                            <button
                                onClick={() => onPageChange?.('studentRegistry-tools')}
                                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Generate Reports</p>
                                    <p className="text-xs text-gray-500">View analytics & stats</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <StudentFormModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchRecentStudents();
                    showSuccess('Student added successfully');
                }}
            />
        </div>
    );
};

export default Overview;
