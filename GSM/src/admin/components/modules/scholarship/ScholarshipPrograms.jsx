import React, { useEffect, useMemo, useState } from 'react';
import { scholarshipApiService } from '../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  PhilippinePeso,
  Calendar,
  Award,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';

function ScholarshipPrograms() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'subcategories'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Toast Context
  const { success: showSuccess, error: showError } = useToastContext();

  // Track expanded categories in grid view
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [categories, setCategories] = useState([]);
  const [recipientStats, setRecipientStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalRecipients: 0
  });

  // Load programs data
  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError('');

      const [cats, apps, recStats] = await Promise.all([
        scholarshipApiService.getScholarshipCategories(),
        scholarshipApiService.getApplications({ per_page: 1 }),
        scholarshipApiService.getAppStatsBySubcategory()
      ]);

      setCategories(Array.isArray(cats) ? cats : []);
      setRecipientStats(recStats || {});

      setStats(prev => ({
        ...prev,
        totalApplications: apps.meta?.total || apps.data?.length || 0
      }));

    } catch (e) {
      console.error(e);
      setError('Failed to load scholarship programs');
      showError('Failed to load scholarship programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  // Process data for the two tabs
  const { categoryItems, subcategoryItems } = useMemo(() => {
    const cats = [];
    const subs = [];

    categories.forEach(cat => {
      let catRecipients = 0;
      const catSubs = [];

      // Process subcategories
      if (Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach(sub => {
          const recCount = recipientStats[sub.id] || 0;
          catRecipients += recCount;

          const subItem = {
            id: sub.id,
            name: sub.name,
            description: sub.description || cat.description || '',
            type: (sub.type || cat.type || 'special').replace('_', '-'),
            amount: sub.amount || 0,
            currentRecipients: recCount,
            status: (sub.is_active ?? cat.is_active) ? 'active' : 'paused',
            deadline: new Date().toISOString(), // Placeholder
            requirements: sub.requirements || cat.requirements || [],
            createdDate: sub.created_at || cat.created_at || '',
            isSubcategory: true,
            parentId: cat.id,
            parentName: cat.name,
            original: sub
          };

          subs.push(subItem);
          catSubs.push(subItem);
        });
      }

      // Add to categories list
      cats.push({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        type: (cat.type || 'special').replace('_', '-'),
        amount: 0,
        currentRecipients: catRecipients,
        status: cat.is_active ? 'active' : 'paused',
        createdDate: cat.created_at || new Date().toISOString(),
        isSubcategory: false,
        subcategoriesCount: (cat.subcategories || []).length,
        subcategories: catSubs, // Store for dropdown
        original: cat
      });
    });

    return { categoryItems: cats, subcategoryItems: subs };
  }, [categories, recipientStats]);

  // Determine which list to show based on active tab
  const activeList = activeTab === 'categories' ? categoryItems : subcategoryItems;

  const filteredPrograms = activeList.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Derived Stats
  const activeProgramsCount = categories.filter(c => c.is_active).length; // Active Main Categories
  const totalApplications = stats.totalApplications;

  // Calculate average award from all subcategories that have an amount
  const averageAward = subcategoryItems.length > 0
    ? subcategoryItems.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / subcategoryItems.length
    : 0;

  // Calculate total recipients
  const totalRecipients = subcategoryItems.reduce((sum, item) => sum + (item.currentRecipients || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Merit-based':
      case 'merit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Need-based':
      case 'need-based':
      case 'need_based':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Field-specific':
      case 'field_specific':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Service-based':
      case 'service':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // State for controlling fields in Create Modal
  const [createParentId, setCreateParentId] = useState('none');

  // CRUD Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const parentId = formData.get('parent_id');
    const isSubcategory = parentId && parentId !== 'none';

    try {
      if (isSubcategory) {
        // Create Subcategory
        const data = {
          category_id: parseInt(parentId),
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type').toLowerCase().replace('-', '_'),
          amount: parseFloat(formData.get('amount')) || 0,
          is_active: true
        };
        await scholarshipApiService.createScholarshipSubcategory(data);
        showSuccess('Subcategory created successfully!');
      } else {
        // Create Category
        const data = {
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type').toLowerCase().replace('-', '_'),
          is_active: true
        };
        await scholarshipApiService.createScholarshipCategory(data);
        showSuccess('Program created successfully!');
      }

      setShowCreateModal(false);
      loadPrograms();
    } catch (err) {
      console.error(err);
      showError('Failed to create program: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedProgram) return;

    // Check if it's a subcategory based on the selected program's processing
    const isSub = selectedProgram.isSubcategory;
    const formData = new FormData(e.target);

    try {
      if (isSub) {
        const data = {
          // We don't support moving categories easily yet so exclude category_id update
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type'),
          amount: parseFloat(formData.get('amount')) || 0,
        };
        await scholarshipApiService.updateScholarshipSubcategory(selectedProgram.id, data);
        showSuccess('Subcategory updated successfully!');
      } else {
        const data = {
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type'),
        };
        await scholarshipApiService.updateScholarshipCategory(selectedProgram.id, data);
        showSuccess('Program updated successfully!');
      }
      setShowEditModal(false);
      setSelectedProgram(null);
      loadPrograms();
    } catch (err) {
      console.error(err);
      showError('Failed to update program: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;
    try {
      if (selectedProgram.isSubcategory) {
        await scholarshipApiService.deleteScholarshipSubcategory(selectedProgram.id);
        showSuccess('Subcategory deleted successfully!');
      } else {
        await scholarshipApiService.deleteScholarshipCategory(selectedProgram.id);
        showSuccess('Program deleted successfully!');
      }
      setShowDeleteModal(false);
      setSelectedProgram(null);
      loadPrograms();
    } catch (err) {
      console.error(err);
      showError('Failed to delete program');
    }
  };

  const openEditModal = (program) => {
    setSelectedProgram(program);
    setShowEditModal(true);
  };

  const openDeleteModal = (program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (program) => {
    setSelectedProgram(program);
    setShowDetailsModal(true);
  }

  // Effect to reset Create Modal state when opened
  useEffect(() => {
    if (showCreateModal) {
      setCreateParentId('none');
    }
  }, [showCreateModal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Scholarship Programs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and monitor scholarship programs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-orange-500/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeProgramsCount}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalApplications}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Award Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₱{averageAward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecipients}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'categories'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Main Programs (Categories)
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'subcategories'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Specific Offerings (Subcategories)
          </button>
        </nav>
      </div>

      {/* Programs Display */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 animate-pulse">Loading programs...</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
      ) : (
        <>
          {/* CATEGORIES TAB - ACCORDION STYLE GRID */}
          {activeTab === 'categories' && viewMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {program.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {program.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(program.type)}`}>
                            {program.type}
                          </span>
                          {/* Add recipients badge for category */}
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {program.currentRecipients} Recipients
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(program)}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(program)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Dropdown Area */}
                    <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                      <button
                        onClick={() => toggleCategory(program.id)}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        <span>
                          {program.subcategoriesCount > 0
                            ? `${program.subcategoriesCount} Specific Offering${program.subcategoriesCount !== 1 ? 's' : ''}`
                            : 'No Specific Offerings'
                          }
                        </span>
                        {program.subcategoriesCount > 0 && (
                          <span className={`transform transition-transform ${expandedCategories[program.id] ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        )}
                      </button>

                      {/* Dropdown Content */}
                      {expandedCategories[program.id] && program.subcategoriesCount > 0 && (
                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                          {program.subcategories.map(sub => (
                            <div key={sub.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center text-sm">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{sub.name}</p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">₱{sub.amount ? sub.amount.toLocaleString() : '0'}</p>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="text-xs text-purple-600 dark:text-purple-400">{sub.currentRecipients} Recipients</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {sub.is_active ? 'Active' : 'Paused'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUBCATEGORIES TAB - Standard Cards */}
          {activeTab === 'subcategories' && viewMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
              {filteredPrograms.map(program => (
                <div key={program.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{program.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{program.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(program.type)}`}>{program.type}</span>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Parent: {program.parentName}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <button onClick={() => openEditModal(program)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteModal(program)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Award</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">₱{program.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recipients</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{program.currentRecipients || 0}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button onClick={() => openDetailsModal(program)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                        <Eye className="w-4 h-4 mr-2" /> Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW (Shared) */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mt-6">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">Program Name</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Recipients</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{program.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{program.description}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(program.type)}`}>
                          {program.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-medium">
                        {program.amount > 0 ? `₱${program.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white font-medium">
                        {program.currentRecipients}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openDetailsModal(program)}
                            className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit/Delete handlers... */}
                          <button
                            onClick={() => openEditModal(program)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(program)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Scholarship Program
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Parent Category
                </label>
                <select
                  name="parent_id"
                  value={createParentId}
                  onChange={(e) => setCreateParentId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                >
                  <option value="none">None (Create Top-Level Category)</option>
                  <option disabled>──────────</option>
                  {categoryItems.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select a parent to create a specific offering (subcategory), or 'None' to create a new main program type.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g., Academic Merit Scholarship"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                  placeholder="Brief description of the scholarship program..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Program Type
                  </label>
                  <select name="type" className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                    <option value="merit">Merit-based</option>
                    <option value="need_based">Need-based</option>
                    <option value="field_specific">Field-specific</option>
                    <option value="service">Service-based</option>
                    <option value="special">Special</option>
                    <option value="renewal">Renewal</option>
                  </select>
                </div>

                {createParentId !== 'none' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Award Amount (₱)
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Scholarship Program
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Parent Category
                </label>
                <select
                  name="parent_id"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium disabled:opacity-50"
                  defaultValue={selectedProgram.parentId || "none"}
                  disabled // Prevent changing parent for now to avoid complexity
                >
                  <option value="none">None (Top-Level Category)</option>
                  <option disabled>──────────</option>
                  {categoryItems.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  defaultValue={selectedProgram.name}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedProgram.description}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Program Type
                  </label>
                  <select
                    name="type"
                    defaultValue={selectedProgram.type === 'Merit-based' ? 'merit' : selectedProgram.type === 'Need-based' ? 'need_based' : selectedProgram.type}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="merit">Merit-based</option>
                    <option value="need_based">Need-based</option>
                    <option value="field_specific">Field-specific</option>
                    <option value="service">Service-based</option>
                  </select>
                </div>

                {selectedProgram.isSubcategory && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Award Amount (₱)
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedProgram.amount}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details, Delete Modals ... (Unchanged logic, kept same structure) */}
      {showDetailsModal && selectedProgram && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          {/* Details Modal Content */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Program Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedProgram.name}
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedProgram.status)}`}>
                      {selectedProgram.status}
                    </span>
                  </h3>
                  {selectedProgram.isSubcategory && (
                    <p className="text-sm text-gray-500 mt-1">Under Category: {selectedProgram.parentName}</p>
                  )}
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(selectedProgram.type)}`}>
                  {selectedProgram.type}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {selectedProgram.description}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 dark:border-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {selectedProgram.amount > 0 ? `₱${selectedProgram.amount.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div className="border border-gray-100 dark:border-slate-700 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Active Recipients</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {selectedProgram.currentRecipients}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedProgram && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Program?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>{selectedProgram.name}</strong>? This action cannot be undone.
              </p>

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md shadow-red-600/20 transition-all transform hover:-translate-y-0.5"
                >
                  Delete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScholarshipPrograms;