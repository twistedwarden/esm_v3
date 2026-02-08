import React, { useState, useEffect } from 'react';
import {
    Send,
    Plus,
    Search,
    Calendar,
    PhilippinePeso,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Clock
} from 'lucide-react';
import { schoolAidService } from '../services/schoolAidService';
import { useAuthStore, getFullName } from '../../../../../store/v1authStore';
import { FundRequest } from '../types';

interface FundRequestTabProps {
    submodule?: any;
    activeTab?: string;
    activeSubmodule?: string;
}

const FundRequestTab: React.FC<FundRequestTabProps> = () => {
    const { currentUser } = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        school_year: '',
        budget_type: 'scholarship_benefits',
        requested_amount: '',
        purpose: '',
        notes: '',
    });

    // Get current school year
    const getCurrentSchoolYear = () => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        return `${currentYear}-${nextYear}`;
    };

    useEffect(() => {
        fetchFundRequests();
        // Set default school year
        setFormData(prev => ({
            ...prev,
            school_year: getCurrentSchoolYear()
        }));
    }, []);

    const fetchFundRequests = async () => {
        try {
            setLoading(true);
            const data = await schoolAidService.getFundRequests(searchTerm);
            setFundRequests(data);
        } catch (err: any) {
            console.error('Error fetching fund requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.school_year || !formData.budget_type || !formData.requested_amount || !formData.purpose) {
            setError('Please fill in all required fields');
            return;
        }

        if (parseFloat(formData.requested_amount) <= 0) {
            setError('Requested amount must be greater than 0');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            const userName = currentUser ? getFullName(currentUser) : 'Admin User';

            const result = await schoolAidService.createFundRequest({
                school_year: formData.school_year,
                budget_type: formData.budget_type,
                requested_amount: parseFloat(formData.requested_amount),
                purpose: formData.purpose,
                notes: formData.notes,
                requested_by_name: userName,
            });

            setSuccess(result.message || 'Successful request, and are waiting for approval of budget');
            setShowForm(false);

            // Reset form
            setFormData({
                school_year: getCurrentSchoolYear(),
                budget_type: 'scholarship_benefits',
                requested_amount: '',
                purpose: '',
                notes: '',
            });

            // Refresh list
            await fetchFundRequests();

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);

        } catch (err: any) {
            setError(err.message || 'Failed to submit fund request');
            console.error('Error submitting fund request:', err);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getBudgetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'financial_support': 'Financial Support',
            'scholarship_benefits': 'Scholarship Benefits',
        };
        return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Funds</h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        Submit formal fund requests for school aid budget allocation
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    {showForm ? (
                        <>
                            <FileText className="w-4 h-4" />
                            <span>View Requests</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            <span>New Request</span>
                        </>
                    )}
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
            )}

            {/* Request Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Fund Request Form
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    School Year <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.school_year}
                                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                                    placeholder="2026-2027"
                                    pattern="\d{4}-\d{4}"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Format: YYYY-YYYY</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Budget Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.budget_type}
                                    onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="scholarship_benefits">Scholarship Benefits</option>
                                    <option value="financial_support">Financial Support</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Requested Amount (₱) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.requested_amount}
                                onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Purpose / Justification <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                rows={4}
                                placeholder="Provide detailed justification for this fund request..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                placeholder="Any additional information or notes..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Submit Request</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                disabled={submitting}
                                className="px-6 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Request History */}
            {!showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchFundRequests()}
                                placeholder="Search requests..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={fetchFundRequests}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="ml-3 text-gray-600 dark:text-slate-400">Loading requests...</span>
                            </div>
                        ) : fundRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-slate-400">No fund requests found</p>
                                <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                                    Click "New Request" to submit your first fund request
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fundRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {request.school_year}
                                                    </span>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                        {getBudgetTypeLabel(request.budget_type)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    <PhilippinePeso className="w-5 h-5" />
                                                    {formatCurrency(request.requested_amount)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm font-medium">Pending</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Purpose:</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300">{request.purpose}</p>
                                            </div>

                                            {request.notes && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Notes:</p>
                                                    <p className="text-sm text-gray-700 dark:text-slate-300">{request.notes}</p>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                                                <span>Requested by: {request.requested_by_name}</span>
                                                <span>{formatDate(request.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FundRequestTab;
