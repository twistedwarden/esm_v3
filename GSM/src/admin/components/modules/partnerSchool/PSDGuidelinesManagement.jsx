import React from 'react';
import { FileText, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, GripVertical, Search, Filter } from 'lucide-react';
import {
    getGuidelines,
    createGuideline,
    updateGuideline,
    deleteGuideline,
    toggleGuidelineActive
} from '../../../../services/partnerSchoolGuidelinesService';

function PSDGuidelinesManagement() {
    const [guidelines, setGuidelines] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const [editingGuideline, setEditingGuideline] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterSection, setFilterSection] = React.useState('all');
    const [filterActive, setFilterActive] = React.useState('all');

    const [formData, setFormData] = React.useState({
        section: 'requirements',
        title: '',
        content: '',
        display_order: 0,
        is_active: true,
    });

    React.useEffect(() => {
        fetchGuidelines();
    }, []);

    const fetchGuidelines = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getGuidelines();
            setGuidelines(data);
        } catch (err) {
            console.error('Error fetching guidelines:', err);
            setError(err.message || 'Failed to load guidelines');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingGuideline(null);
        setFormData({
            section: 'requirements',
            title: '',
            content: '',
            display_order: 0,
            is_active: true,
        });
        setShowModal(true);
    };

    const handleEdit = (guideline) => {
        setEditingGuideline(guideline);
        setFormData({
            section: guideline.section,
            title: guideline.title,
            content: guideline.content,
            display_order: guideline.display_order,
            is_active: guideline.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (editingGuideline) {
                await updateGuideline(editingGuideline.id, formData);
            } else {
                await createGuideline(formData);
            }
            setShowModal(false);
            fetchGuidelines();
        } catch (err) {
            console.error('Error saving guideline:', err);
            setError(err.message || 'Failed to save guideline');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this guideline?')) {
            return;
        }

        try {
            setLoading(true);
            await deleteGuideline(id);
            fetchGuidelines();
        } catch (err) {
            console.error('Error deleting guideline:', err);
            setError(err.message || 'Failed to delete guideline');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await toggleGuidelineActive(id);
            fetchGuidelines();
        } catch (err) {
            console.error('Error toggling guideline status:', err);
            setError(err.message || 'Failed to update guideline status');
        }
    };

    const filteredGuidelines = Object.entries(guidelines).flatMap(([section, items]) => {
        if (filterSection !== 'all' && section !== filterSection) return [];
        if (filterActive !== 'all') {
            const activeFilter = filterActive === 'active';
            return items.filter(item => item.is_active === activeFilter);
        }
        if (searchTerm) {
            return items.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return items;
    });

    const sectionTitles = {
        requirements: 'Requirements',
        benefits: 'Benefits',
        responsibilities: 'Responsibilities',
        process: 'Application Process',
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guidelines Management</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Manage partner school guidelines and requirements
                            </p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Guideline
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search guidelines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <select
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Sections</option>
                            <option value="requirements">Requirements</option>
                            <option value="benefits">Benefits</option>
                            <option value="responsibilities">Responsibilities</option>
                            <option value="process">Process</option>
                        </select>
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Guidelines List */}
                {loading && !guidelines ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading guidelines...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredGuidelines.map((guideline) => (
                            <div
                                key={guideline.id}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                                                {sectionTitles[guideline.section]}
                                            </span>
                                            {guideline.is_active ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {guideline.title}
                                        </h3>
                                        <div
                                            className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: guideline.content }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleToggleActive(guideline.id)}
                                            className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                                            title={guideline.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {guideline.is_active ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <XCircle className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(guideline)}
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(guideline.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredGuidelines.length === 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Guidelines Found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {searchTerm || filterSection !== 'all' || filterActive !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Get started by creating your first guideline'}
                                </p>
                                {!searchTerm && filterSection === 'all' && filterActive === 'all' && (
                                    <button
                                        onClick={handleCreate}
                                        className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Guideline
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingGuideline ? 'Edit Guideline' : 'Create Guideline'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Section
                                </label>
                                <select
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="requirements">Requirements</option>
                                    <option value="benefits">Benefits</option>
                                    <option value="responsibilities">Responsibilities</option>
                                    <option value="process">Application Process</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter guideline title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Content
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter guideline content (HTML supported)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || !formData.title || !formData.content}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : editingGuideline ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PSDGuidelinesManagement;
