import React, { useState, useEffect } from 'react';
import {
    X,
    Wallet,
    Calendar,
    AlertCircle,
    Info,
    Loader2,
    ChevronDown
} from 'lucide-react';
import dayjs from 'dayjs';
import { useToastContext } from '../../../../components/providers/ToastProvider';

import { API_CONFIG } from '../../../../config/api';

interface MainBudget {
    id: number;
    budget_type: string;
    total_budget: number;
    allocated_budget: number;
    remaining_budget: number; // Changed from available_budget to match API
    school_year: string;
}

interface School {
    id: number;
    name: string;
}

interface AllocateBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    academicYear: string;
}

export const AllocateBudgetModal: React.FC<AllocateBudgetModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    academicYear,
}) => {
    const [mainBudgets, setMainBudgets] = useState<MainBudget[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const { success, error } = useToastContext();

    const [formData, setFormData] = useState({
        source_budget_id: '',
        school_id: '',
        school_name: '',
        academic_year: academicYear,
        allocated_amount: '',
        allocation_date: dayjs().format('YYYY-MM-DD'),
        expiry_date: dayjs().month(5).date(30).format('YYYY-MM-DD'), // June 30
        notes: '',
    });

    const [selectedMainBudget, setSelectedMainBudget] = useState<MainBudget | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setFetchingData(true);
        try {
            const [budgetsRes, schoolsRes] = await Promise.all([
                fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/school-aid/budgets`),
                fetch(`${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/api/schools?is_partner_school=true&per_page=100`)
            ]);

            const budgetsData = await budgetsRes.json();
            const schoolsData = await schoolsRes.json();

            // Handle budgets response structure { success: true, budgets: [...] }
            if (budgetsData.success && Array.isArray(budgetsData.budgets)) {
                setMainBudgets(budgetsData.budgets);
            } else if (Array.isArray(budgetsData)) {
                setMainBudgets(budgetsData); // Fallback
            } else {
                setMainBudgets([]);
            }

            // Handle schools response structure (paginated)
            if (schoolsData.success) {
                const schoolsList = schoolsData.data?.data || schoolsData.data;
                setSchools(Array.isArray(schoolsList) ? schoolsList : []);
            }
        } catch (err) {
            error('Failed to load initial data');
            console.error(err);
        } finally {
            setFetchingData(false);
        }
    };

    const handleMainBudgetChange = (budgetId: string) => {
        const budget = mainBudgets.find((b) => b.id === parseInt(budgetId));
        setSelectedMainBudget(budget || null);
        setFormData({ ...formData, source_budget_id: budgetId });
    };

    const handleSchoolChange = (schoolId: string) => {
        const school = schools.find((s) => s.id === parseInt(schoolId));
        setFormData({
            ...formData,
            school_id: schoolId,
            school_name: school?.name || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.source_budget_id || !formData.school_id || !formData.allocated_amount) {
            error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_CONFIG.AID_SERVICE.BASE_URL}/api/foundation/partner-budgets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_budget_id: parseInt(formData.source_budget_id),
                    school_id: parseInt(formData.school_id),
                    school_name: formData.school_name,
                    academic_year: formData.academic_year,
                    allocated_amount: parseFloat(formData.allocated_amount),
                    allocation_date: formData.allocation_date,
                    expiry_date: formData.expiry_date,
                    notes: formData.notes,
                }),
            });

            const data = await response.json();

            if (data.success) {
                success(data.message);
                onSuccess();
                handleClose();
            } else {
                error(data.message || 'Failed to allocate budget');
            }
        } catch (err) {
            error('An error occurred while allocating budget');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            source_budget_id: '',
            school_id: '',
            school_name: '',
            academic_year: academicYear,
            allocated_amount: '',
            allocation_date: dayjs().format('YYYY-MM-DD'),
            expiry_date: dayjs().month(5).date(30).format('YYYY-MM-DD'),
            notes: '',
        });
        setSelectedMainBudget(null);
        onClose();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const afterAllocation = selectedMainBudget && formData.allocated_amount
        ? selectedMainBudget.remaining_budget - parseFloat(formData.allocated_amount)
        : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Allocate Partner Budget</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Transfer funds from foundation pool to school</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {fetchingData ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Fetching active pools...</p>
                            </div>
                        ) : (
                            <>
                                {/* Budget Info Alert */}
                                {selectedMainBudget && (
                                    <div className={`p-4 rounded-xl flex gap-3 border transition-all ${afterAllocation < 0
                                        ? 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                                        : 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400'
                                        }`}>
                                        {afterAllocation < 0 ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                                        <div className="text-sm">
                                            <p className="font-bold">Summary</p>
                                            <p className="mt-0.5 opacity-90">
                                                Pool Balance: <span className="font-bold">{formatCurrency(selectedMainBudget.remaining_budget)}</span>
                                            </p>
                                            {formData.allocated_amount && (
                                                <p className="mt-0.5 opacity-90">
                                                    Resulting Balance: <span className={`font-bold ${afterAllocation < 0 ? 'underline' : ''}`}>{formatCurrency(afterAllocation)}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 gap-5">
                                    {/* Source Pool */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Source Foundation Pool</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.source_budget_id}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMainBudgetChange(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm font-semibold appearance-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white outline-none"
                                            >
                                                <option value="">Select pool...</option>
                                                {mainBudgets.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.budget_type} ({formatCurrency(b.remaining_budget)})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Partner School */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Recipient Partner School</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.school_id}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSchoolChange(e.target.value)}
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm font-semibold appearance-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white outline-none"
                                            >
                                                <option value="">Select school...</option>
                                                {schools.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Academic Year */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Academic Year</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 2024-2025"
                                                value={formData.academic_year}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, academic_year: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Allocation Amount (PHP)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.allocated_amount}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allocated_amount: e.target.value })}
                                                className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl font-black text-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Allocation Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.allocation_date}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allocation_date: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Expiry Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={formData.expiry_date}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expiry_date: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Internal Notes</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Add any internal remarks here..."
                                            value={formData.notes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-black text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || fetchingData || (!!formData.allocated_amount && afterAllocation < 0)}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 ${loading || fetchingData || (!!formData.allocated_amount && afterAllocation < 0)
                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                }`}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {afterAllocation < 0 ? 'Exceeds Pool' : loading ? 'Processing' : 'Confirm Allocation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AllocateBudgetModal;
