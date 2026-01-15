import React from 'react';
import { X } from 'lucide-react';
import { createApplication } from '../../../../services/partnerSchoolApplicationService';
import { getSchools, getSchoolClassifications } from '../../../../services/schoolService';

function PSDApplicationForm({ onClose, onSave, editingApplication = null }) {
    const [formData, setFormData] = React.useState({
        school_id: '',
        school_name: '',
        classification: '',
        address: '',
        city: '',
        province: '',
        region: '',
        contact_number: '',
        contact_email: '',
        contact_first_name: '',
        contact_last_name: '',
        admin_notes: '',
    });
    const [schools, setSchools] = React.useState([]);
    const [classifications, setClassifications] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        fetchSchools();
        setClassifications(getSchoolClassifications());
        if (editingApplication) {
            setFormData({
                school_id: editingApplication.school_id || '',
                school_name: editingApplication.school?.name || '',
                classification: editingApplication.school?.classification || '',
                address: editingApplication.school?.address || '',
                city: editingApplication.school?.city || '',
                province: editingApplication.school?.province || '',
                region: editingApplication.school?.region || '',
                contact_number: editingApplication.school?.contact_number || '',
                contact_email: editingApplication.school?.email || '',
                contact_first_name: '',
                contact_last_name: '',
                admin_notes: editingApplication.admin_notes || '',
            });
        }
    }, [editingApplication]);

    const fetchSchools = async () => {
        try {
            const response = await getSchools({ is_partner_school: false });
            if (response.success) {
                setSchools(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching schools:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await createApplication(formData);
            onSave();
        } catch (err) {
            console.error('Error creating application:', err);
            setError(err.message || 'Failed to create application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingApplication ? 'Edit Application' : 'Create Application'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Link to Existing School (Optional)
                        </label>
                        <select
                            value={formData.school_id}
                            onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        >
                            <option value="">Select a school...</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.id}>
                                    {school.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!formData.school_id && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    School Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter school name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Classification *
                                </label>
                                <select
                                    value={formData.classification}
                                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">Select classification...</option>
                                    {classifications.map((classification) => (
                                        <option key={classification} value={classification}>
                                            {classification}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Street address, building, etc."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Province
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.province}
                                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        placeholder="Province"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Region
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        placeholder="Region"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="09123456789"
                                />
                            </div>
                        </>
                    )}

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Creation</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            An account will be automatically created for the school contact person.
                        </p>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contact Email *
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                placeholder="contact@school.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contact First Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.contact_first_name}
                                    onChange={(e) => setFormData({ ...formData, contact_first_name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="First name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contact Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.contact_last_name}
                                    onChange={(e) => setFormData({ ...formData, contact_last_name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Admin Notes
                        </label>
                        <textarea
                            value={formData.admin_notes}
                            onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            placeholder="Internal notes (optional)"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!formData.school_id && !formData.school_name) || !formData.contact_email || !formData.contact_first_name || !formData.contact_last_name}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Application & Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PSDApplicationForm;
