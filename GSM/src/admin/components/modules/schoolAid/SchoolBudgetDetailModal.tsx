import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    TrendingUp,
    ChevronRight,
    History,
    Info,
    ExternalLink,
    Loader2
} from 'lucide-react';
import dayjs from 'dayjs';

import { API_CONFIG } from '../../../../config/api';
import { PartnerSchoolBudget, PartnerSchoolBudgetWithdrawal } from './types';

interface BudgetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: PartnerSchoolBudget;
    onUpdate: () => void;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
    isOpen,
    onClose,
    budget,
    // onUpdate,
}) => {
    const [withdrawals, setWithdrawals] = useState<PartnerSchoolBudgetWithdrawal[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && budget) {
            fetchWithdrawals();
        }
    }, [isOpen, budget]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/partner-school/withdrawals?school_id=${budget.school_id}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setWithdrawals(data.data);
            } else {
                setWithdrawals([]);
            }
        } catch (err) {
            console.error('Failed to load withdrawals');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handleViewDocument = (id: number) => {
        const url = `${API_CONFIG.AID_SERVICE.BASE_URL}/api/partner-school/withdrawals/${id}/proof`;
        window.open(url, '_blank');
    };

    const usagePercent = budget.allocated_amount > 0
        ? (budget.disbursed_amount / budget.allocated_amount) * 100
        : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl font-bold">
                            {budget.school_name[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{budget.school_name}</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                Budget Overview • AY {budget.academic_year}
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${budget.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {budget.status}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Main Stats Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Allocated</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(budget.allocated_amount)}</p>
                        </div>
                        <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Disbursed</p>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(budget.disbursed_amount)}</p>
                                <div className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 rounded">{usagePercent.toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-600 dark:bg-blue-600">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Available Balance</p>
                            <p className="text-lg font-bold text-white mt-1">{formatCurrency(budget.available_amount)}</p>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                Budget Utilization
                            </h3>
                            <span className="text-sm font-bold text-blue-600">{usagePercent.toFixed(1)}% used</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden border border-gray-100 dark:border-slate-600">
                            <div
                                className={`h-full transition-all duration-700 ease-out rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Timeline & Meta */}
                    <div className="flex flex-wrap gap-6 py-4 border-y border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allocation Date</p>
                                <p className="text-sm text-gray-900 dark:text-white font-semibold">{dayjs(budget.allocation_date).format('MMM DD, YYYY')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500">
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expiry Date</p>
                                <p className="text-sm text-gray-900 dark:text-white font-semibold">{budget.expiry_date ? dayjs(budget.expiry_date).format('MMM DD, YYYY') : 'Lifetime'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 font-bold">
                        <button className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs text-gray-600 dark:text-slate-300 transition-colors">
                            Adjust Amount
                        </button>
                        <button className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs text-gray-600 dark:text-slate-300 transition-colors">
                            Extend Expiry
                        </button>
                        <button className="flex items-center justify-center p-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs text-gray-600 dark:text-slate-300 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Recent Trans */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-4 h-4 text-gray-400" />
                                Recent Withdrawals
                            </h3>
                            <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 group">
                                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
                            ) : withdrawals.length === 0 ? (
                                <div className="py-8 text-center text-xs text-gray-500 italic">No withdrawals found for this period.</div>
                            ) : (
                                withdrawals.map(w => (
                                    <div key={w.id} className="p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm uppercase">
                                                {w.purpose[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">{w.purpose}</p>
                                                <p className="text-[10px] text-gray-400">{dayjs(w.withdrawal_date).format('MMM DD, YYYY')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-red-600">-{formatCurrency(w.amount)}</p>
                                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Recorded</p>
                                            </div>
                                            {w.proof_document_path && (
                                                <button
                                                    onClick={() => handleViewDocument(w.id)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="View Proof"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

