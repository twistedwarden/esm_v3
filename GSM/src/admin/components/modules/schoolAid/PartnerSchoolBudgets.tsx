import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Eye,
    Edit3,
    Wallet,
    Loader2
} from 'lucide-react';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { PartnerSchoolBudget } from './types';
import AllocateBudgetModal from './AllocateBudgetModal';
import { BudgetDetailModal } from './SchoolBudgetDetailModal';
import { API_CONFIG } from '../../../../config/api';

const PartnerSchoolBudgets: React.FC = () => {
    const [budgets, setBudgets] = useState<PartnerSchoolBudget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('2024-2025');
    const [searchTerm, setSearchTerm] = useState('');
    const [allocateModalOpen, setAllocateModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<PartnerSchoolBudget | null>(null);
    const { success, error } = useToastContext();

    useEffect(() => {
        fetchBudgets();
    }, [selectedYear]);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_CONFIG.AID_SERVICE.BASE_URL}/api/foundation/partner-budgets?academic_year=${selectedYear}`
            );
            const data = await response.json();

            if (data.success) {
                setBudgets(data.data);
            }
        } catch (err) {
            error('Failed to load budgets');
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

    const getUsagePercentage = (disbursed: number, allocated: number) => {
        return allocated > 0 ? (disbursed / allocated) * 100 : 0;
    };

    const handleViewDetails = (budget: PartnerSchoolBudget) => {
        setSelectedBudget(budget);
        setDetailModalOpen(true);
    };

    const handleBudgetAllocated = () => {
        fetchBudgets();
        success('Budget allocated successfully');
    };

    const filteredBudgets = budgets.filter(b =>
        b.school_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-blue-500" />
                        Partner School Budgets
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Manage fund allocations for private partner schools
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedYear(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 dark:text-slate-200"
                    >
                        <option value="2024-2025">2024-2025</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2025-2026">2025-2026</option>
                    </select>
                    <button
                        onClick={() => setAllocateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Allocate Budget</span>
                        <span className="sm:hidden">Allocate</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Allocated</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(budgets.reduce((sum, b) => sum + b.allocated_amount, 0))}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Disbursed</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {formatCurrency(budgets.reduce((sum, b) => sum + b.disbursed_amount, 0))}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Remaining Pool</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(budgets.reduce((sum, b) => sum + b.available_amount, 0))}
                    </p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search partner schools..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">School Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Allocation</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Usage Progress</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Available</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                        <p className="mt-2 text-sm text-gray-500">Loading budgets...</p>
                                    </td>
                                </tr>
                            ) : filteredBudgets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-gray-500">No partner budgets found for this criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBudgets.map((budget) => {
                                    const usagePercent = getUsagePercentage(budget.disbursed_amount, budget.allocated_amount);
                                    return (
                                        <tr key={budget.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">{budget.school_name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">ID: {budget.school_id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatCurrency(budget.allocated_amount)}
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className="text-gray-600 dark:text-slate-400">{formatCurrency(budget.disbursed_amount)} used</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{usagePercent.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 rounded-full ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-bold ${budget.available_amount <= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    {formatCurrency(budget.available_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${budget.status === 'active'
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50'
                                                    : budget.status === 'depleted'
                                                        ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50'
                                                    }`}>
                                                    {budget.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(budget)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Adjust Budget"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {allocateModalOpen && (
                <AllocateBudgetModal
                    isOpen={allocateModalOpen}
                    onClose={() => setAllocateModalOpen(false)}
                    onSuccess={handleBudgetAllocated}
                    academicYear={selectedYear}
                />
            )}

            {selectedBudget && (
                <BudgetDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    budget={selectedBudget}
                    onUpdate={fetchBudgets}
                />
            )}
        </div>
    );
};

export default PartnerSchoolBudgets;
