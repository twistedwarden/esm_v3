import React, { useState, useEffect } from 'react';
import { X, School, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuthServiceUrl, getScholarshipServiceUrl } from '../../../../config/api';

const SchoolAssignmentModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(user?.assigned_school_id || null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch schools when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSchools();
      setSelectedSchoolId(user?.assigned_school_id || null);
    }
  }, [isOpen, user]);

  // Filter schools based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = schools.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.campus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
  }, [searchTerm, schools]);

  const fetchSchools = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${getScholarshipServiceUrl('/api')}/schools?per_page=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSchools(data.data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch schools');
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSchool = async () => {
    if (!selectedSchoolId) {
      setError('Please select a school to assign');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${getAuthServiceUrl(`/api/users/${user.id}/assign-school`)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          school_id: selectedSchoolId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to assign school');
      }
    } catch (err) {
      console.error('Error assigning school:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignSchool = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${getAuthServiceUrl(`/api/users/${user.id}/unassign-school`)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to unassign school');
      }
    } catch (err) {
      console.error('Error unassigning school:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSchool = schools.find(school => school.id === selectedSchoolId);

  // Show modal when open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <School className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assign School</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Assign a school to {user?.first_name} {user?.last_name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Current Assignment */}
          {user?.assigned_school_id && selectedSchool && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Currently Assigned</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{selectedSchool.name}</p>
                  {selectedSchool.campus && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">{selectedSchool.campus}</p>
                  )}
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {[selectedSchool.city, selectedSchool.region].filter(Boolean).join(', ')}
                  </p>
                </div>
                <button
                  onClick={handleUnassignSchool}
                  disabled={submitting}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  Unassign
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Schools List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-2 text-gray-600 dark:text-slate-400">Loading schools...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredSchools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSchoolId === school.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {school.name}
                        </h4>
                        {selectedSchoolId === school.id && (
                          <CheckCircle className="w-4 h-4 text-orange-500 ml-2 flex-shrink-0" />
                        )}
                      </div>
                      {school.campus && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{school.campus}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {[school.city, school.region].filter(Boolean).join(', ')}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          school.is_partner_school 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {school.is_partner_school ? 'Partner School' : 'Regular School'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          school.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {school.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSchools.length === 0 && !loading && (
                <div className="text-center py-8">
                  <School className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">No schools found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssignSchool}
            disabled={!selectedSchoolId || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : (
              'Assign School'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolAssignmentModal;
