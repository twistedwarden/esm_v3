import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { scholarshipApiService } from '../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import {
    Plus,
    Edit,
    Trash2,
    FileText,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ToggleLeft,
    ToggleRight,
    Search,
    Filter,
    ClipboardList
} from 'lucide-react';

const CATEGORIES = [
    { value: 'personal', label: 'Personal' },
    { value: 'academic', label: 'Academic' },
    { value: 'financial', label: 'Financial' },
    { value: 'other', label: 'Other' }
];

const CATEGORY_COLORS = {
    personal: 'bg-blue-100 text-blue-700',
    academic: 'bg-purple-100 text-purple-700',
    financial: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-600'
};

const EMPTY_FORM = {
    name: '',
    description: '',
    category: 'personal',
    is_required: true
};

export default function RequirementsManagement() {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [readOnly, setReadOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToggleModal, setShowToggleModal] = useState(false);

    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const { success: showSuccess, error: showError } = useToastContext();

    const loadRequirements = async () => {
        try {
            setLoading(true);
            const data = await scholarshipApiService.adminGetDocumentTypes();
            setRequirements(data);
            setReadOnly(false);
        } catch (err) {
            console.error(err);
            showError('Failed to load requirements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequirements();
    }, []);

    const openCreate = () => {
        if (readOnly) { showError('Create is not available — admin API endpoint not yet configured on the backend.'); return; }
        setForm(EMPTY_FORM);
        setShowCreateModal(true);
    };

    const openEdit = (req) => {
        if (readOnly) { showError('Edit is not available — admin API endpoint not yet configured on the backend.'); return; }
        setSelected(req);
        setForm({
            name: req.name,
            description: req.description || '',
            category: req.category,
            is_required: req.is_required
        });
        setShowEditModal(true);
    };

    const openDelete = (req) => {
        if (readOnly) { showError('Delete is not available — admin API endpoint not yet configured on the backend.'); return; }
        setSelected(req);
        setShowDeleteModal(true);
    };

    const openToggle = (req) => {
        if (readOnly) { showError('Toggle is not available — admin API endpoint not yet configured on the backend.'); return; }
        setSelected(req);
        setShowToggleModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await scholarshipApiService.createDocumentType(form);
            showSuccess('Requirement created successfully!');
            setShowCreateModal(false);
            loadRequirements();
        } catch (err) {
            showError(err.message || 'Failed to create requirement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selected) return;
        try {
            setSubmitting(true);
            await scholarshipApiService.updateDocumentType(selected.id, form);
            showSuccess('Requirement updated successfully!');
            setShowEditModal(false);
            setSelected(null);
            loadRequirements();
        } catch (err) {
            showError(err.message || 'Failed to update requirement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        try {
            setSubmitting(true);
            await scholarshipApiService.deleteDocumentType(selected.id);
            showSuccess('Requirement deleted successfully!');
            setShowDeleteModal(false);
            setSelected(null);
            loadRequirements();
        } catch (err) {
            showError(err.message || 'Failed to delete requirement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async () => {
        if (!selected) return;
        try {
            setSubmitting(true);
            await scholarshipApiService.toggleDocumentType(selected.id);
            showSuccess(`Requirement ${selected.is_active ? 'deactivated' : 'activated'} successfully!`);
            setShowToggleModal(false);
            setSelected(null);
            loadRequirements();
        } catch (err) {
            showError(err.message || 'Failed to update requirement status');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = requirements.filter((r) => {
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.description || '').toLowerCase().includes(search.toLowerCase());
        const matchCategory = filterCategory === 'all' || r.category === filterCategory;
        const matchStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && r.is_active) ||
            (filterStatus === 'inactive' && !r.is_active);
        return matchSearch && matchCategory && matchStatus;
    });

    const stats = {
        total: requirements.length,
        active: requirements.filter(r => r.is_active).length,
        required: requirements.filter(r => r.is_required).length,
        inactive: requirements.filter(r => !r.is_active).length
    };

    // ── Modal helper ──────────────────────────────────────────────────────────
    const FormFields = ({ value, onChange }) => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    required
                    placeholder="e.g. Certificate of Registration"
                    value={value.name}
                    onChange={e => onChange({ ...value, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    rows={3}
                    placeholder="Describe what this document should contain..."
                    value={value.description}
                    onChange={e => onChange({ ...value, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        value={value.category}
                        onChange={e => onChange({ ...value, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submission Type</label>
                    <select
                        value={value.is_required ? 'required' : 'optional'}
                        onChange={e => onChange({ ...value, is_required: e.target.value === 'required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* ── Read-only notice ── */}
            {readOnly && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>
                        <strong>Read-only mode —</strong> the admin document-type API endpoint is not configured on the backend yet.
                        Data is loaded from the public endpoint. Create, edit, delete, and toggle actions will be available once the backend exposes <code className="bg-amber-100 px-1 rounded">/api/document-types</code>.
                    </span>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Requirements Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Define and manage documents students must upload for scholarship applications.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={readOnly}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    Add Requirement
                </button>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Requirements', value: stats.total, icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-50' },
                    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Required', value: stats.required, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' }
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`${color} p-2 rounded-lg bg-white shadow-sm`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search requirements..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                        <p className="font-medium">No requirements found</p>
                        <p className="text-sm mt-1">
                            {requirements.length === 0
                                ? 'Add your first requirement to get started.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                <th className="px-5 py-3 font-semibold text-gray-600">Requirement</th>
                                <th className="px-5 py-3 font-semibold text-gray-600">Category</th>
                                <th className="px-5 py-3 font-semibold text-gray-600">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-gray-900">{req.name}</div>
                                        {req.description && (
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[req.category] || CATEGORY_COLORS.other}`}>
                                            {req.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {req.is_required ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <AlertTriangle className="w-3 h-3" /> Required
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                Optional
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {req.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                <XCircle className="w-3 h-3" /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openToggle(req)}
                                                title={req.is_active ? 'Deactivate' : 'Activate'}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                {req.is_active
                                                    ? <ToggleRight className="w-4 h-4 text-green-600" />
                                                    : <ToggleLeft className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(req)}
                                                title="Edit"
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDelete(req)}
                                                title="Delete"
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Create Modal ── */}
            {showCreateModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Add Requirement</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Define a new document students must submit.</p>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="px-6 py-5">
                                <FormFields value={form} onChange={setForm} />
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                                >
                                    {submitting ? 'Saving…' : 'Save Requirement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Edit Modal ── */}
            {showEditModal && selected && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Requirement</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Update the details of this requirement.</p>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="px-6 py-5">
                                <FormFields value={form} onChange={setForm} />
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelected(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                                >
                                    {submitting ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Toggle Status Modal ── */}
            {showToggleModal && selected && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${selected.is_active ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                {selected.is_active
                                    ? <XCircle className="w-6 h-6 text-yellow-600" />
                                    : <CheckCircle className="w-6 h-6 text-green-600" />}
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selected.is_active ? 'Deactivate' : 'Activate'} Requirement
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">
                                {selected.is_active
                                    ? `"${selected.name}" will no longer appear in the student application form.`
                                    : `"${selected.name}" will be shown in the student application form.`}
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowToggleModal(false); setSelected(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggle}
                                disabled={submitting}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 ${selected.is_active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {submitting ? 'Processing…' : selected.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Delete Modal ── */}
            {showDeleteModal && selected && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Delete Requirement</h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Are you sure you want to delete <span className="font-medium text-gray-700">"{selected.name}"</span>?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowDeleteModal(false); setSelected(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {submitting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
