// Utility functions for soft delete functionality
import { getScholarshipServiceUrl } from '../config/api';

/**
 * Soft delete an item by moving it to archived state
 * @param {string} category - The category of the item (users, applications, documents, etc.)
 * @param {number} itemId - The ID of the item to soft delete
 * @param {string} reason - The reason for deletion
 * @param {string} deletedBy - The user who deleted the item
 * @returns {Promise<Object>} - The result of the soft delete operation
 */
export const softDeleteItem = async (category, itemId, reason = 'No reason provided', deletedBy = 'System') => {
  try {
    const response = await fetch(`${getScholarshipServiceUrl('/api')}/archived/soft-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        category,
        item_id: itemId,
        reason,
        deleted_by: deletedBy
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error soft deleting item:', error);
    throw error;
  }
};

/**
 * Restore a soft-deleted item
 * @param {string} category - The category of the item
 * @param {number} itemId - The ID of the item to restore
 * @returns {Promise<Object>} - The result of the restore operation
 */
export const restoreItem = async (category, itemId) => {
  try {
    const response = await fetch(`${getScholarshipServiceUrl('/api')}/archived/${category}/${itemId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error restoring item:', error);
    throw error;
  }
};

/**
 * Permanently delete an item from archived state
 * @param {string} category - The category of the item
 * @param {number} itemId - The ID of the item to permanently delete
 * @returns {Promise<Object>} - The result of the permanent delete operation
 */
export const permanentDeleteItem = async (category, itemId) => {
  try {
    const response = await fetch(`${getScholarshipServiceUrl('/api')}/archived/${category}/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    throw error;
  }
};

/**
 * Get the current user's information for deletion tracking
 * @returns {Object} - User information
 */
export const getCurrentUserInfo = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return {
        id: user.id,
        name: user.name || user.first_name + ' ' + user.last_name,
        email: user.email
      };
    }
    return {
      id: 'unknown',
      name: 'System',
      email: 'system@example.com'
    };
  } catch (error) {
    console.error('Error getting current user info:', error);
    return {
      id: 'unknown',
      name: 'System',
      email: 'system@example.com'
    };
  }
};

/**
 * Create a confirmation dialog for soft delete
 * @param {string} itemName - The name of the item to be deleted
 * @param {string} itemType - The type of the item
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
export const confirmSoftDelete = (itemName, itemType = 'item') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${itemName}"?\n\n` +
      `This ${itemType} will be moved to the archived section and can be restored later.\n\n` +
      `Click OK to delete or Cancel to keep the ${itemType}.`
    );
    resolve(confirmed);
  });
};

/**
 * Create a confirmation dialog for permanent delete
 * @param {string} itemName - The name of the item to be permanently deleted
 * @param {string} itemType - The type of the item
 * @returns {Promise<boolean>} - True if user confirms, false otherwise
 */
export const confirmPermanentDelete = (itemName, itemType = 'item') => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: This action cannot be undone!\n\n` +
      `Are you sure you want to permanently delete "${itemName}"?\n\n` +
      `This ${itemType} will be completely removed from the system and cannot be restored.\n\n` +
      `Type "DELETE" in the next prompt to confirm.`
    );
    
    if (confirmed) {
      const typed = window.prompt(
        `To confirm permanent deletion, type "DELETE" (case sensitive):`
      );
      resolve(typed === 'DELETE');
    } else {
      resolve(false);
    }
  });
};

/**
 * Format deletion reason for display
 * @param {string} reason - The deletion reason
 * @returns {string} - Formatted reason
 */
export const formatDeletionReason = (reason) => {
  if (!reason || reason === 'No reason provided') {
    return 'No reason provided';
  }
  return reason.charAt(0).toUpperCase() + reason.slice(1);
};

/**
 * Get deletion date in a readable format
 * @param {string} deletedAt - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDeletionDate = (deletedAt) => {
  if (!deletedAt) return 'Unknown';
  
  const date = new Date(deletedAt);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if an item is soft deleted
 * @param {Object} item - The item to check
 * @returns {boolean} - True if item is soft deleted
 */
export const isSoftDeleted = (item) => {
  return item && (item.deleted_at || item.deletedAt || item.archived_at || item.archivedAt);
};

/**
 * Get soft delete metadata from an item
 * @param {Object} item - The item to get metadata from
 * @returns {Object} - Soft delete metadata
 */
export const getSoftDeleteMetadata = (item) => {
  if (!isSoftDeleted(item)) {
    return null;
  }

  return {
    deletedAt: item.deleted_at || item.deletedAt || item.archived_at || item.archivedAt,
    deletedBy: item.deleted_by || item.deletedBy || item.archived_by || item.archivedBy,
    reason: item.deletion_reason || item.deletionReason || item.archived_reason || item.archivedReason
  };
};
