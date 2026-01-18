import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Plus,
    Calendar,
    PhilippinePeso,
    Upload,
    X,
    Check,
    AlertCircle,
    Eye,
    Loader2,
    TrendingDown
} from 'lucide-react';
import dayjs from 'dayjs';
import { API_CONFIG } from '../../config/api';
import { PartnerSchoolBudget, PartnerSchoolBudgetWithdrawal } from '../../admin/components/modules/schoolAid/types';

interface PartnerSchoolBudgetManagementProps {
    schoolId: number;
}

const PartnerSchoolBudgetManagement: React.FC<PartnerSchoolBudgetManagementProps> = ({ schoolId }) => {
    const [budget, setBudget] = useState<PartnerSchoolBudget | null>(null);
    const [withdrawals, setWithdrawals] = useState<PartnerSchoolBudgetWithdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        amount: '',
        purpose: '',
        withdrawal_date: dayjs().format('YYYY-MM-DD'),
        notes: '',
        proof_document: null as File | null
    });

    useEffect(() => {
        fetchBudget();
        fetchWithdrawals();
    }, [schoolId]);

    const fetchBudget = async () => {
        try {
            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/foundation/schools/${schoolId}/budget`);
            const data = await response.json();
            if (data.success) {
                setBudget(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch budget:', err);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/partner-school/withdrawals?school_id=${schoolId}`);
            const data = await response.json();
            if (data.success) {
                setWithdrawals(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.proof_document) {
            setError('Proof document is required');
            return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!budget || parseFloat(formData.amount) > budget.available_amount) {
            setError('Insufficient budget funds');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const formDataToSend = new FormData();
            formDataToSend.append('school_id', schoolId.toString());
            formDataToSend.append('amount', formData.amount);
            formDataToSend.append('purpose', formData.purpose);
            formDataToSend.append('withdrawal_date', formData.withdrawal_date);
            if (formData.notes) {
                formDataToSend.append('notes', formData.notes);
            }
            formDataToSend.append('proof_document', formData.proof_document);

            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/partner-school/withdrawals`, {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await response.json();

            if (data.success) {
                // Reset form
                setFormData({
                    amount: '',
                    purpose: '',
                    withdrawal_date: dayjs().format('YYYY-MM-DD'),
                    notes: '',
                    proof_document: null
                });
                setShowModal(false);

                // Refresh data
                fetchBudget();
                fetchWithdrawals();
            } else {
                setError(data.message || 'Failed to record withdrawal');
            }
        } catch (err) {
            setError('An error occurred while recording the withdrawal');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, proof_document: e.target.files[0] });
        }
    };

    if (loading && withdrawals.length === 0) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const usagePercent = budget && budget.allocated_amount > 0
        ? (budget.disbursed_amount / budget.allocated_amount) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Budget Overview Card */}
            {budget && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wide opacity-90">Available School Budget</h3>
                                <p className="text-xs opacity-75">AY {budget.academic_year}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${budget.status === 'active' ? 'bg-green-400/30 text-white' : 'bg-red-400/30 text-white'
                            }`}>
                            {budget.status}
                        </span>
                    </div>

                    <div className="mb-4">
                        <p className="text-4xl font-black mb-2">{formatCurrency(budget.available_amount)}</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                                <div
                                    className={`h-full transition-all duration-700 ${usagePercent >= 90 ? 'bg-red-300' : usagePercent >= 70 ? 'bg-yellow-300' : 'bg-green-300'
                                        }`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold">{usagePercent.toFixed(0)}% Used</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-xs opacity-75 mb-1">Allocated</p>
                            <p className="text-lg font-bold">{formatCurrency(budget.allocated_amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-75 mb-1">Disbursed</p>
                            <p className="text-lg font-bold">{formatCurrency(budget.disbursed_amount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Record Withdrawal Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Withdrawals</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Record your budget usage with proof documents
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    disabled={!budget || budget.status !== 'active'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    Record Withdrawal
                </button>
            </div>

            {/* Withdrawals List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {withdrawals.length === 0 ? (
                    <div className="p-12 text-center">
                        <TrendingDown className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No withdrawals recorded yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Click "Record Withdrawal" to get started
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recorded</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {withdrawals.map((withdrawal) => (
                                    <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {dayjs(withdrawal.withdrawal_date).format('MMM DD, YYYY')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{withdrawal.purpose}</div>
                                            {withdrawal.notes && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{withdrawal.notes}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                                -{formatCurrency(withdrawal.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={`${API_CONFIG.AID_SERVICE.BASE_URL}/storage/${withdrawal.proof_document_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Proof
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {dayjs(withdrawal.created_at).format('MMM DD, YYYY')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Record Withdrawal Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Record Budget Withdrawal</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {budget && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Available: {formatCurrency(budget.available_amount)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Withdrawal Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            required
                                            value={formData.withdrawal_date}
                                            onChange={(e) => setFormData({ ...formData, withdrawal_date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Purpose <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white"
                                    placeholder="e.g., Scholarship for Student X, Educational Supplies"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white resize-none"
                                    placeholder="Additional details about this withdrawal..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Proof Document <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="proof-upload"
                                        required
                                    />
                                    <label htmlFor="proof-upload" className="cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        {formData.proof_document ? (
                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                                                <Check className="w-4 h-4" />
                                                {formData.proof_document.name}
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                    Click to upload proof document
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    PDF, JPG, JPEG, PNG (Max 5MB)
                                                </p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Recording...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Record Withdrawal
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerSchoolBudgetManagement;
