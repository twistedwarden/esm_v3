import React, { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    Calendar,
    Info,
    ArrowRight,
    Loader2,
    AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { API_CONFIG } from '../../config/api';

interface PartnerSchoolBudget {
    id: number;
    school_id: number;
    school_name: string;
    academic_year: string;
    allocated_amount: number;
    disbursed_amount: number;
    available_amount: number;
    status: 'active' | 'expired' | 'depleted';
    allocation_date: string;
    expiry_date: string | null;
}

interface PartnerSchoolBudgetWidgetProps {
    schoolId: number;
    refreshTrigger?: number;
}

const PartnerSchoolBudgetWidget: React.FC<PartnerSchoolBudgetWidgetProps> = ({ schoolId, refreshTrigger = 0 }) => {
    const [budget, setBudget] = useState<PartnerSchoolBudget | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBudget();
    }, [schoolId, refreshTrigger]);

    const fetchBudget = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/foundation/schools/${schoolId}/budget`);
            const data = await response.json();

            if (data.success) {
                setBudget(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to load budget information');
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

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !budget) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex gap-3 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="text-sm font-medium">{error || 'No active budget allocation found for your school. Please contact foundation admin.'}</p>
                </div>
            </div>
        );
    }

    const usagePercent = budget.allocated_amount > 0
        ? (budget.disbursed_amount / budget.allocated_amount) * 100
        : 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden max-w-xl">
            <div className="p-6 border-b border-gray-50 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Available School Budget</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">AY {budget.academic_year}</p>
                    </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${budget.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700'
                    }`}>
                    {budget.status}
                </span>
            </div>

            <div className="p-6 space-y-5">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Funds</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {formatCurrency(budget.available_amount)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-700 ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-500 shrink-0">{usagePercent.toFixed(0)}% Used</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-slate-700/50">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allocated</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(budget.allocated_amount)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disbursed</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(budget.disbursed_amount)}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-medium">Valid until <span className="text-gray-900 dark:text-slate-200 font-bold">{budget.expiry_date ? dayjs(budget.expiry_date).format('MMMM DD, YYYY') : 'N/A'}</span></p>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl flex gap-3">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                            Funds are automatically deducted from your allocation when you record a valid withdrawal.
                        </p>
                    </div>
                </div>

                <button className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-xl group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-200">View Full Disbursement History</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default PartnerSchoolBudgetWidget;
