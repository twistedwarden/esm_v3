import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../hooks/useToast';

function SSCMemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showToast } = useToast();

  // Real SSC member data - will be fetched from API
  const [sscMembers, setSscMembers] = useState([]);

  const roleOptions = [
    { value: 'chairperson', label: 'SSC Chairperson', stage: 'final_approval' },
    { value: 'budget_dept', label: 'Budget Department', stage: 'financial_review' },
    { value: 'accounting', label: 'Accounting Department', stage: 'financial_review' },
    { value: 'treasurer', label: 'City Treasurer', stage: 'financial_review' },
    { value: 'education_affairs', label: 'Education Affairs Unit', stage: 'academic_review' },
    { value: 'qcydo', label: 'Quezon City Youth Development Office', stage: 'academic_review' },
    { value: 'planning_dept', label: 'City Planning and Development Department', stage: 'academic_review' },
    { value: 'city_council', label: 'City Council Committee on Education', stage: 'document_verification' },
    { value: 'hrd', label: 'Human Resource Management Department', stage: 'document_verification' },
    { value: 'social_services', label: 'Social Services Development Department', stage: 'document_verification' },
    { value: 'schools_division', label: 'Schools Division Office', stage: 'academic_review' },
    { value: 'qcu', label: 'Quezon City University', stage: 'academic_review' }
  ];

  const stageOptions = [
    { value: 'document_verification', label: 'Document Verification' },
    { value: 'financial_review', label: 'Financial Review' },
    { value: 'academic_review', label: 'Academic Review' },
    { value: 'final_approval', label: 'Final Approval' }
  ];

  // Fetch SSC members from API
  const fetchSscMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
      const members = await scholarshipApiService.getSscMemberAssignments();

      setMembers(members);
      setSscMembers(members);
    } catch (err) {
      setError('Failed to load SSC members');
      console.error('Error fetching SSC members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSscMembers();
  }, []);

  const handleActivateMember = async (memberId) => {
    try {
      // API call would go here
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, is_active: true }
          : member
      ));
      showToast('Member activated successfully', 'success');
    } catch (err) {
      showToast('Failed to activate member', 'error');
    }
  };

  const handleDeactivateMember = async (memberId) => {
    try {
      // API call would go here
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, is_active: false }
          : member
      ));
      showToast('Member deactivated successfully', 'success');
    } catch (err) {
      showToast('Failed to deactivate member', 'error');
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleSaveMember = async (memberData) => {
    try {
      // API call would go here
      if (selectedMember) {
        setMembers(prev => prev.map(member => 
          member.id === selectedMember.id 
            ? { ...member, ...memberData }
            : member
        ));
        showToast('Member updated successfully', 'success');
      } else {
        const newMember = {
          id: Date.now(),
          ...memberData,
          review_count: 0,
          last_review: null
        };
        setMembers(prev => [...prev, newMember]);
        showToast('Member added successfully', 'success');
      }
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err) {
      showToast('Failed to save member', 'error');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'chairperson': 'bg-red-100 text-red-800',
      'budget_dept': 'bg-yellow-100 text-yellow-800',
      'accounting': 'bg-yellow-100 text-yellow-800',
      'treasurer': 'bg-yellow-100 text-yellow-800',
      'education_affairs': 'bg-purple-100 text-purple-800',
      'qcydo': 'bg-purple-100 text-purple-800',
      'planning_dept': 'bg-purple-100 text-purple-800',
      'city_council': 'bg-blue-100 text-blue-800',
      'hrd': 'bg-blue-100 text-blue-800',
      'social_services': 'bg-blue-100 text-blue-800',
      'schools_division': 'bg-purple-100 text-purple-800',
      'qcu': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStageBadgeColor = (stage) => {
    const colors = {
      'document_verification': 'bg-blue-100 text-blue-800',
      'financial_review': 'bg-yellow-100 text-yellow-800',
      'academic_review': 'bg-purple-100 text-purple-800',
      'final_approval': 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading SSC members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            SSC Member Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage SSC member assignments and roles
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMember(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Add Member
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {members.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Members
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-green-600">
            {members.filter(m => m.is_active).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Members
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {members.filter(m => m.review_stage === 'document_verification').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Document Reviewers
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {members.filter(m => m.review_stage === 'academic_review').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Academic Reviewers
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Review Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Review
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.ssc_role)}`}>
                      {member.role_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(member.review_stage)}`}>
                      {member.stage_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {member.review_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(member.last_review)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        Edit
                      </button>
                      {member.is_active ? (
                        <button
                          onClick={() => handleDeactivateMember(member.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateMember(member.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-slate-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {selectedMember ? 'Edit SSC Member' : 'Add SSC Member'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const memberData = {
                  user_id: parseInt(formData.get('user_id')),
                  user_name: formData.get('user_name'),
                  user_email: formData.get('user_email'),
                  ssc_role: formData.get('ssc_role'),
                  review_stage: formData.get('review_stage'),
                  is_active: formData.get('is_active') === 'on'
                };
                handleSaveMember(memberData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User ID
                    </label>
                    <input
                      type="number"
                      name="user_id"
                      defaultValue={selectedMember?.user_id || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="user_name"
                      defaultValue={selectedMember?.user_name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="user_email"
                      defaultValue={selectedMember?.user_email || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SSC Role
                    </label>
                    <select
                      name="ssc_role"
                      defaultValue={selectedMember?.ssc_role || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Role</option>
                      {roleOptions.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Review Stage
                    </label>
                    <select
                      name="review_stage"
                      defaultValue={selectedMember?.review_stage || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Stage</option>
                      {stageOptions.map(stage => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={selectedMember?.is_active !== false}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {selectedMember ? 'Update' : 'Add'} Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SSCMemberManagement;
