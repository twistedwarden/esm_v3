import React, { useState, useEffect } from 'react';
import { X, Building, MapPin, Phone, Mail, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { updateSchool, validateSchoolData, getSchoolClassifications } from '../../../../services/schoolService';

const EditSchoolModal = ({ isOpen, onClose, onSuccess, school }) => {
  const [formData, setFormData] = useState({
    name: '',
    campus: '',
    contact_number: '',
    email: '',
    website: '',
    classification: '',
    address: '',
    city: '',
    province: '',
    region: '',
    zip_code: '',
    is_public: false,
    is_partner_school: true,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const classifications = getSchoolClassifications();

  // Pre-fill form when school prop changes
  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        campus: school.campus || '',
        contact_number: school.contact_number || '',
        email: school.email || '',
        website: school.website || '',
        classification: school.classification || '',
        address: school.address || '',
        city: school.city || '',
        province: school.province || '',
        region: school.region || '',
        zip_code: school.zip_code || '',
        is_public: !!school.is_public,
        is_partner_school: !!school.is_partner_school,
        is_active: school.is_active !== undefined ? !!school.is_active : true,
      });
      setErrors({});
      setSubmitError('');
    }
  }, [school]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateSchoolData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await updateSchool(school.id, formData);
      if (response.success) {
        onSuccess({ ...school, ...formData, id: school.id });
        onClose();
      } else {
        setSubmitError(response.message || 'Failed to update school');
      }
    } catch (error) {
      console.error('Error updating school:', error);
      setSubmitError(error.message || 'An error occurred while updating the school');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit School</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">Update partner school information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter school name"
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Campus</label>
                  <input
                    type="text"
                    name="campus"
                    value={formData.campus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter campus name"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Classification *
                  </label>
                  <select
                    name="classification"
                    value={formData.classification}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.classification ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select classification</option>
                    {classifications.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.classification && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.classification}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.contact_number ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="+63 2 1234-5678"
                    disabled={isSubmitting}
                  />
                  {errors.contact_number && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_number}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.email ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="info@school.edu.ph"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.website ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="https://www.school.edu.ph"
                    disabled={isSubmitting}
                  />
                  {errors.website && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.website}</p>}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter complete address"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter city"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Province</label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter province"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter region"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter ZIP code"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* School Properties */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">School Properties</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_public"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="edit_is_public" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                    Public School
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_partner_school"
                    name="is_partner_school"
                    checked={formData.is_partner_school}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="edit_is_partner_school" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                    Partner School
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchoolModal;
