import axios from 'axios';
import { getScholarshipServiceUrl } from '../config/api';

class ArchivedDataService {
  constructor() {
    this.baseURL = getScholarshipServiceUrl('/api');
  }

  // Get all archived data
  async getArchivedData() {
    try {
      const response = await axios.get(`${this.baseURL}/archived`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching archived data:', error);
      throw error;
    }
  }

  // Get archived data by category
  async getArchivedDataByCategory(category) {
    try {
      const response = await axios.get(`${this.baseURL}/archived/${category}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching archived ${category}:`, error);
      throw error;
    }
  }

  // Restore an archived item
  async restoreItem(category, itemId) {
    try {
      const response = await axios.post(`${this.baseURL}/archived/${category}/${itemId}/restore`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error restoring ${category} item:`, error);
      throw error;
    }
  }

  // Permanently delete an archived item
  async permanentDeleteItem(category, itemId) {
    try {
      const response = await axios.delete(`${this.baseURL}/archived/${category}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error permanently deleting ${category} item:`, error);
      throw error;
    }
  }

  // Get archived data statistics
  async getArchivedStats() {
    try {
      const response = await axios.get(`${this.baseURL}/archived/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching archived stats:', error);
      throw error;
    }
  }

  // Search archived data
  async searchArchivedData(query, category = 'all') {
    try {
      const response = await axios.get(`${this.baseURL}/archived/search`, {
        params: {
          q: query,
          category: category
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching archived data:', error);
      throw error;
    }
  }

  // Bulk restore items
  async bulkRestoreItems(category, itemIds) {
    try {
      const response = await axios.post(`${this.baseURL}/archived/${category}/bulk-restore`, {
        item_ids: itemIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error bulk restoring ${category} items:`, error);
      throw error;
    }
  }

  // Bulk permanent delete items
  async bulkPermanentDeleteItems(category, itemIds) {
    try {
      const response = await axios.post(`${this.baseURL}/archived/${category}/bulk-delete`, {
        item_ids: itemIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error bulk deleting ${category} items:`, error);
      throw error;
    }
  }

  // Get archived item details
  async getArchivedItemDetails(category, itemId) {
    try {
      const response = await axios.get(`${this.baseURL}/archived/${category}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching archived ${category} item details:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const archivedDataService = new ArchivedDataService();
export default archivedDataService;
