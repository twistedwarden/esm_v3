import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { scholarshipApiService } from '../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';

export default function AcademicPeriods() {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [statusActionPayload, setStatusActionPayload] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const { success: showSuccess, error: showError } = useToastContext();

    const loadPeriods = async () => {
        try {
            setLoading(true);
            const data = await scholarshipApiService.getAcademicPeriods();
            setPeriods(data);
        } catch (err) {
            console.error(err);
            showError('Failed to load academic periods');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPeriods();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            academic_year: formData.get('academic_year'),
            period_type: formData.get('period_type'),
            period_number: parseInt(formData.get('period_number')),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            application_deadline: formData.get('application_deadline'),
            status: formData.get('status'),
            is_current: formData.get('is_current') === 'on'
        };

        try {
            await scholarshipApiService.createAcademicPeriod(data);
            showSuccess('Academic Key Period created successfully!');
            setShowCreateModal(false);
            loadPeriods();
        } catch (err) {
            showError(err.message || 'Failed to create period');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedPeriod) return;
        const formData = new FormData(e.target);
        const data = {
            academic_year: formData.get('academic_year'),
            period_type: formData.get('period_type'),
            period_number: parseInt(formData.get('period_number')),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            application_deadline: formData.get('application_deadline'),
            status: formData.get('status'),
            is_current: formData.get('is_current') === 'on'
        };

        try {
            await scholarshipApiService.updateAcademicPeriod(selectedPeriod.id, data);
            showSuccess('Academic Period updated successfully!');
            setShowEditModal(false);
            loadPeriods();
        } catch (err) {
            showError(err.message || 'Failed to update period');
        }
    };

    const handleStatusToggle = (period) => {
        const newStatus = period.status === 'open' ? 'closed' : 'open';

        if (newStatus === 'closed') {
            setStatusActionPayload({ period, newStatus });
            setShowStatusConfirmModal(true);
        } else {
            // Open immediately if opening
            executeStatusChange(period, newStatus);
        }
    };

    const executeStatusChange = async (period, newStatus) => {
        try {
            // Optimistic update
            setPeriods(periods.map(p =>
                p.id === period.id ? { ...p, status: newStatus } : p
            ));

            await scholarshipApiService.updateAcademicPeriod(period.id, {
                status: newStatus
            });
            showSuccess(`Academic Period ${newStatus === 'open' ? 'opened' : 'closed'} successfully`);
        } catch (err) {
            // Revert on failure
            setPeriods(periods.map(p =>
                p.id === period.id ? { ...p, status: period.status } : p
            ));
            showError('Failed to update status');
        } finally {
            setShowStatusConfirmModal(false);
            setStatusActionPayload(null);
        }
    };

    const confirmStatusChange = () => {
        if (statusActionPayload) {
            executeStatusChange(statusActionPayload.period, statusActionPayload.newStatus);
        }
    };

    const handleDelete = async () => {
        if (!selectedPeriod) return;
        try {
            await scholarshipApiService.deleteAcademicPeriod(selectedPeriod.id);
            showSuccess('Academic Period deleted successfully!');
            setShowDeleteModal(false);
            loadPeriods();
        } catch (err) {
            showError('Failed to delete period');
        }
    };

    const openEditModal = (period) => {
        setSelectedPeriod(period);
        setShowEditModal(true);
    };

    const openDeleteModal = (period) => {
        setSelectedPeriod(period);
        setShowDeleteModal(true);
    };

    const getStatusBadge = (status) => {
        return status === 'open' ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" /> Open
            </span>
        ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="w-3 h-3 mr-1" /> Closed
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academic Periods</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage school years, semesters/trimesters, and application deadlines.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-orange-500/30"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Period
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 animate-pulse">Loading periods...</div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">Academic Year</th>
                                <th className="p-4 font-medium">Period</th>
                                <th className="p-4 font-medium">Key Dates</th>
                                <th className="p-4 font-medium">Deadline</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {periods.map((period) => (
                                <tr key={period.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${period.is_current ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {period.academic_year}
                                            {period.is_current && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">
                                        {period.period_type === 'Semester' ? (period.period_number === 1 ? '1st Semester' : period.period_number === 2 ? '2nd Semester' : 'Summer') :
                                            period.period_type === 'Trimester' ? (period.period_number === 1 ? '1st Trimester' : period.period_number === 2 ? '2nd Trimester' : '3rd Trimester') : period.period_number}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div>Start: {new Date(period.start_date).toLocaleDateString()}</div>
                                        <div>End: {new Date(period.end_date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center text-sm font-medium text-orange-600 dark:text-orange-400">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(period.application_deadline).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleStatusToggle(period)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${period.status === 'open' ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${period.status === 'open' ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className={`ml-2 text-sm font-medium ${period.status === 'open' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {period.status === 'open' ? 'Open' : 'Closed'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openEditModal(period)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openDeleteModal(period)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && createPortal(
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Academic Period</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                                <input name="academic_year" type="text" placeholder="e.g. 2024-2025" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select name="period_type" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                                        <option value="Semester">Semester</option>
                                        <option value="Trimester">Trimester</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Number</label>
                                    <input name="period_number" type="number" min="1" max="3" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input name="start_date" type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                    <input name="end_date" type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Application Deadline</label>
                                <input name="application_deadline" type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select name="status" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <input name="is_current" type="checkbox" className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">Set as Current Period</label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg">Create</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Modal */}
            {showEditModal && selectedPeriod && createPortal(
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Academic Period</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</button>
                        </div>
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                                <input name="academic_year" defaultValue={selectedPeriod.academic_year} type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select name="period_type" defaultValue={selectedPeriod.period_type} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                                        <option value="Semester">Semester</option>
                                        <option value="Trimester">Trimester</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Number</label>
                                    <input name="period_number" defaultValue={selectedPeriod.period_number} type="number" min="1" max="3" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input name="start_date" defaultValue={selectedPeriod.start_date.split('T')[0]} type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                    <input name="end_date" defaultValue={selectedPeriod.end_date.split('T')[0]} type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Application Deadline</label>
                                <input name="application_deadline" defaultValue={selectedPeriod.application_deadline.split('T')[0]} type="date" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select name="status" defaultValue={selectedPeriod.status} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <input name="is_current" defaultChecked={selectedPeriod.is_current} type="checkbox" className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">Set as Current Period</label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedPeriod && createPortal(
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Period</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete this academic period? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Status Confirmation Modal */}
            {showStatusConfirmModal && createPortal(
                <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Close Period</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Closing this academic period will <strong>immediately stop</strong> all new scholarship applications and renewals.
                            <br /><br />
                            Are you sure you want to proceed?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowStatusConfirmModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Confirm Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
