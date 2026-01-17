import React, { useState, useEffect } from 'react';
import PartnerSchoolBudgetWidget from '../pages/partnerSchool/PartnerSchoolBudgetWidget';
import { useAuthStore } from '../store/v1authStore';
import { useToastContext } from '../components/providers/ToastProvider';
import {
    Plus,
    FileText,
    XCircle,
    Upload,
    Loader2
} from 'lucide-react';
import { fetchFundRequests, submitFundRequest } from '../services/partnerSchoolService';
import dayjs from 'dayjs';

import { API_CONFIG } from '../config/api';

const PartnerSchoolFunds = ({ schoolId }) => {
    const { token } = useAuthStore();
    const { success, error } = useToastContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await fetchFundRequests(token, schoolId);
            setRequests(data);
        } catch (err) {
            error('Failed to load budget withdrawals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && schoolId) {
            loadRequests();
        }
    }, [token, schoolId, refreshKey]);

    const handleSuccess = (msg = 'Withdrawal recorded successfully') => {
        setIsModalOpen(false);
        setRefreshKey(prev => prev + 1);
        success(msg);
    };

    const handleViewProof = (id) => {
        window.open(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/partner-school/withdrawals/${id}/proof`, '_blank');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Budget Overview Widget */}
            <div className="w-full">
                <PartnerSchoolBudgetWidget schoolId={schoolId} refreshTrigger={refreshKey} />
            </div>

            {/* Fund Requests Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Budget Withdrawals
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Record your budget usage with proof documents.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Record Withdrawal
                    </button>
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Purpose</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                                <th className="py-3 px-4 text-right">Documents</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-500">Loading withdrawals...</p>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">
                                        No withdrawals recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                                            {dayjs(req.withdrawal_date).format('MMM DD, YYYY')}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                                            <div className="font-medium">{req.purpose}</div>
                                            {req.notes && <div className="text-xs text-gray-400 truncate max-w-xs">{req.notes}</div>}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                                            -₱{parseFloat(req.amount).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {req.proof_document_path && (
                                                <button
                                                    onClick={() => handleViewProof(req.id)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    View Proof
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Modal */}
            {isModalOpen && (
                <RequestFundsModal
                    schoolId={schoolId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => handleSuccess('Withdrawal recorded successfully')}
                />
            )}

            {/* Liquidation Modal */}

        </div>
    );
};



const RequestFundsModal = ({ schoolId, onClose, onSuccess }) => {
    const { token } = useAuthStore();
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [withdrawalDate, setWithdrawalDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            alert('Proof document is required');
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('school_id', schoolId);
            formData.append('amount', amount);
            formData.append('purpose', purpose);
            formData.append('withdrawal_date', withdrawalDate);
            formData.append('notes', notes);
            formData.append('proof_document', file);

            await submitFundRequest(token, formData);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to record withdrawal');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Record Budget Withdrawal</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            Withdrawal Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                            <input
                                type="number"
                                required
                                min="1"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            Withdrawal Date
                        </label>
                        <input
                            type="date"
                            required
                            value={withdrawalDate}
                            onChange={e => setWithdrawalDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            Purpose
                        </label>
                        <input
                            type="text"
                            required
                            value={purpose}
                            onChange={e => setPurpose(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. Tuition fee batch 1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            Additional Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
                            placeholder="Optional explanation..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            Proof Document (Required)
                        </label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative group">
                            <input
                                type="file"
                                required
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => setFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {file ? file.name : "Click to upload proof of usage"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Record Withdrawal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PartnerSchoolFunds;
