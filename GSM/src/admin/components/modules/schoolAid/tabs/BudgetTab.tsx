import React, { useState, useEffect } from 'react';
import {
  PhilippinePeso,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { schoolAidService } from '../services/schoolAidService';

interface Budget {
  id?: number;
  budget_type: string;
  school_year: string;
  total_budget: number;
  allocated_budget: number;
  disbursed_budget: number;
  remaining_budget: number;
  description?: string;
  is_active: boolean;
}

interface BudgetTabProps {
  submodule?: any;
  activeTab?: string;
  activeSubmodule?: string;
}

const BudgetTab: React.FC<BudgetTabProps> = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Budget>>({
    budget_type: 'scholarship_benefits',
    school_year: '',
    total_budget: 0,
    description: '',
  });
  const [customBudgetType, setCustomBudgetType] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Get current school year
  const getCurrentSchoolYear = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schoolAidService.getBudgets();
      setBudgets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    setFormData({
      budget_type: 'scholarship_benefits',
      school_year: getCurrentSchoolYear(),
      total_budget: 0,
      description: '',
    });
    setCustomBudgetType('');
    setShowCustomInput(false);
    setShowAddForm(true);
    setEditingBudget(null);
  };

  const handleEditBudget = (budget: Budget) => {
    const isCustomType = !['financial_support', 'scholarship_benefits'].includes(budget.budget_type);
    setFormData({
      budget_type: isCustomType ? 'other' : budget.budget_type,
      school_year: budget.school_year,
      total_budget: budget.total_budget,
      description: budget.description || '',
    });
    setCustomBudgetType(isCustomType ? budget.budget_type : '');
    setShowCustomInput(isCustomType);
    setEditingBudget(budget);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBudget(null);
    setFormData({
      budget_type: 'scholarship_benefits',
      school_year: getCurrentSchoolYear(),
      total_budget: 0,
      description: '',
    });
    setCustomBudgetType('');
    setShowCustomInput(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the actual budget type to use
    const actualBudgetType = formData.budget_type === 'other'
      ? customBudgetType.trim()
      : formData.budget_type;

    if (!actualBudgetType || !formData.school_year || !formData.total_budget) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.total_budget <= 0) {
      setError('Total budget must be greater than 0');
      return;
    }

    if (formData.budget_type === 'other' && !customBudgetType.trim()) {
      setError('Please enter a custom budget type');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolAidService.createOrUpdateBudget({
        budget_type: actualBudgetType,
        school_year: formData.school_year,
        total_budget: formData.total_budget,
        description: formData.description,
      });

      setSuccess(editingBudget ? 'Budget updated successfully!' : 'Budget created successfully!');
      setShowAddForm(false);
      setEditingBudget(null);
      setFormData({
        budget_type: 'scholarship_benefits',
        school_year: getCurrentSchoolYear(),
        total_budget: 0,
        description: '',
      });

      // Refresh budgets
      await fetchBudgets();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
      console.error('Error saving budget:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getBudgetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'financial_support': 'Financial Support',
      'scholarship_benefits': 'Scholarship Benefits',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBudgetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'financial_support': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'scholarship_benefits': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  // Group budgets by school year
  const budgetsByYear = budgets.reduce((acc, budget) => {
    if (!acc[budget.school_year]) {
      acc[budget.school_year] = [];
    }
    acc[budget.school_year].push(budget);
    return acc;
  }, {} as Record<string, Budget[]>);

  const schoolYears = Object.keys(budgetsByYear).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-slate-400">Loading budgets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Budget Management</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Set and manage budgets per school year. Choose from predefined types or create custom budget types.
          </p>
        </div>
        <button
          onClick={handleAddBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Budget</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingBudget ? 'Edit Budget' : 'Add New Budget'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Budget Type *
                </label>
                <select
                  value={formData.budget_type}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, budget_type: value });
                    setShowCustomInput(value === 'other');
                    if (value !== 'other') {
                      setCustomBudgetType('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="scholarship_benefits">Scholarship Benefits</option>
                  <option value="financial_support">Financial Support</option>
                  <option value="other">Other (Custom)</option>
                </select>
                {showCustomInput && (
                  <input
                    type="text"
                    value={customBudgetType}
                    onChange={(e) => setCustomBudgetType(e.target.value)}
                    placeholder="Enter custom budget type"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    required={showCustomInput}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  School Year *
                </label>
                <input
                  type="text"
                  value={formData.school_year}
                  onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                  placeholder="2026-2027"
                  pattern="\d{4}-\d{4}"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Format: YYYY-YYYY</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Total Budget (₱) *
              </label>
              <input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Optional description for this budget allocation"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingBudget ? 'Update Budget' : 'Create Budget'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <PhilippinePeso className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">No budgets configured yet</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
            Click "Add Budget" to create your first budget allocation
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {schoolYears.map((schoolYear) => (
            <div key={schoolYear} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    School Year {schoolYear}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgetsByYear[schoolYear].map((budget) => (
                    <div
                      key={budget.id}
                      className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getBudgetTypeColor(budget.budget_type)}`}>
                            {getBudgetTypeLabel(budget.budget_type)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditBudget(budget)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit budget"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Total Budget</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(budget.total_budget)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Disbursed</p>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(budget.disbursed_budget)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Remaining</p>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(budget.remaining_budget)}
                            </p>
                          </div>
                        </div>

                        {budget.description && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                            {budget.description}
                          </p>
                        )}

                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500 dark:text-slate-400">Utilization</span>
                            <span className="font-medium text-gray-700 dark:text-slate-300">
                              {budget.total_budget > 0
                                ? ((budget.disbursed_budget / budget.total_budget) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min((budget.disbursed_budget / budget.total_budget) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetTab;
