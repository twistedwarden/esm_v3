import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { LoadingData } from '../../ui/LoadingSpinner';
import AnimatedCard, { InfoCard } from '../../ui/AnimatedCard';
import AnimatedContainer, { AnimatedGrid, AnimatedList } from '../../ui/AnimatedContainer';
import { transitions } from '../../../../utils/transitions';
import archivedDataService from '../../../../services/archivedDataService';

const ArchivedOverview = () => {
  const { showSuccess, showError } = useToastContext();
  const [archivedData, setArchivedData] = useState({
    users: [],
    applications: [],
    documents: [],
    logs: []
  });
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToRestore, setItemToRestore] = useState(null);

  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Items', icon: Database, count: 0 },
    { id: 'users', label: 'Users', icon: User, count: 0 },
    { id: 'applications', label: 'Applications', icon: FileText, count: 0 },
    { id: 'documents', label: 'Documents', icon: FileText, count: 0 },
    { id: 'logs', label: 'Logs', icon: Clock, count: 0 }
  ]);

  useEffect(() => {
    fetchArchivedData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedCategory, searchTerm, archivedData]);

  const fetchArchivedData = async () => {
    setLoading(true);
    try {
      const response = await archivedDataService.getArchivedData();
      
      if (response.success) {
        setArchivedData(response.data);
        
        // Update category counts
        setCategories(prevCategories => 
          prevCategories.map(category => ({
            ...category,
            count: category.id === 'all' 
              ? Object.values(response.data).flat().length
              : response.data[category.id]?.length || 0
          }))
        );
      } else {
        throw new Error(response.message || 'Failed to fetch archived data');
      }
    } catch (error) {
      console.error('Error fetching archived data:', error);
      
      // Fallback to mock data if API fails
      const mockData = {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'citizen',
            deletedAt: '2024-01-15T10:30:00Z',
            deletedBy: 'Admin User',
            reason: 'Account closure request'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'staff',
            deletedAt: '2024-01-14T14:20:00Z',
            deletedBy: 'System Admin',
            reason: 'Inactive account cleanup'
          }
        ],
        applications: [
          {
            id: 1,
            applicantName: 'Alice Johnson',
            scholarshipType: 'Merit Scholarship',
            status: 'rejected',
            deletedAt: '2024-01-13T09:15:00Z',
            deletedBy: 'Admin User',
            reason: 'Duplicate application'
          }
        ],
        documents: [
          {
            id: 1,
            name: 'Transcript_2023.pdf',
            type: 'transcript',
            size: '2.5 MB',
            deletedAt: '2024-01-12T16:45:00Z',
            deletedBy: 'System Admin',
            reason: 'File corruption'
          }
        ],
        logs: [
          {
            id: 1,
            action: 'User Login',
            user: 'test@example.com',
            deletedAt: '2024-01-11T11:30:00Z',
            deletedBy: 'System Admin',
            reason: 'Data retention policy'
          }
        ]
      };

      setArchivedData(mockData);
      
      // Update category counts
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          count: category.id === 'all' 
            ? Object.values(mockData).flat().length
            : mockData[category.id]?.length || 0
        }))
      );
      
      showError('Using offline data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let data = [];
    
    if (selectedCategory === 'all') {
      data = Object.values(archivedData).flat();
    } else {
      data = archivedData[selectedCategory] || [];
    }

    if (searchTerm) {
      data = data.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(data);
  };

  const handleRestore = async (item) => {
    try {
      const category = selectedCategory === 'all' ? 
        Object.keys(archivedData).find(key => archivedData[key].includes(item)) : 
        selectedCategory;
      
      const response = await archivedDataService.restoreItem(category, item.id);
      
      if (response.success) {
        showSuccess(`${item.name || item.applicantName || item.action} has been restored successfully`);
        
        // Remove from archived data
        if (category && archivedData[category]) {
          setArchivedData(prev => ({
            ...prev,
            [category]: prev[category].filter(i => i.id !== item.id)
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to restore item');
      }
      
      setShowRestoreModal(false);
      setItemToRestore(null);
    } catch (error) {
      console.error('Error restoring item:', error);
      showError('Failed to restore item');
    }
  };

  const handlePermanentDelete = async (item) => {
    try {
      const category = selectedCategory === 'all' ? 
        Object.keys(archivedData).find(key => archivedData[key].includes(item)) : 
        selectedCategory;
      
      const response = await archivedDataService.permanentDeleteItem(category, item.id);
      
      if (response.success) {
        showSuccess(`${item.name || item.applicantName || item.action} has been permanently deleted`);
        
        // Remove from archived data
        if (category && archivedData[category]) {
          setArchivedData(prev => ({
            ...prev,
            [category]: prev[category].filter(i => i.id !== item.id)
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to permanently delete item');
      }
      
      setShowDeleteModal(false);
      setItemToRestore(null);
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      showError('Failed to permanently delete item');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemIcon = (item) => {
    if (item.email) return User;
    if (item.applicantName) return FileText;
    if (item.action) return Clock;
    return FileText;
  };

  const getItemTitle = (item) => {
    return item.name || item.applicantName || item.action || 'Unknown Item';
  };

  const getItemSubtitle = (item) => {
    if (item.email) return item.email;
    if (item.scholarshipType) return item.scholarshipType;
    if (item.type) return item.type;
    if (item.user) return item.user;
    return '';
  };

  if (loading) {
    return <LoadingData module="archived" />;
  }

  return (
    <AnimatedContainer variant="page" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Archive className="w-8 h-8 text-orange-500" />
            Archived Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and restore deleted data from the system
          </p>
        </div>
        <button
          onClick={fetchArchivedData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {categories.slice(1).map((category) => (
          <motion.div
            key={category.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {category.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.count}
                </p>
              </div>
              <category.icon className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search archived items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Archived Items List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Archived Items ({filteredData.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          <AnimatePresence>
            {filteredData.map((item, index) => {
              const IconComponent = getItemIcon(item);
              // Create a unique key that includes the item type to avoid collisions
              const itemType = item.email ? 'user' : item.applicantName ? 'application' : item.action ? 'log' : 'document';
              return (
                <motion.div
                  key={`${itemType}-${item.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <IconComponent className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getItemTitle(item)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {getItemSubtitle(item)}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Deleted: {formatDate(item.deletedAt)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            By: {item.deletedBy}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Reason: {item.reason}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setItemToRestore(item);
                          setShowRestoreModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => {
                          setItemToRestore(item);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredData.length === 0 && (
          <div className="p-12 text-center">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No archived items found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'No items have been archived yet'}
            </p>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && itemToRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <RotateCcw className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Restore Item
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to restore "{getItemTitle(itemToRestore)}"? 
              This will move it back to its original location.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setItemToRestore(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(itemToRestore)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Restore
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteModal && itemToRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Permanent Delete
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to permanently delete "{getItemTitle(itemToRestore)}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToRestore(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(itemToRestore)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatedContainer>
  );
};

export default ArchivedOverview;
