/**
 * Notification Service for Scholarship Module
 * Handles real-time notifications for scholarship processes
 */

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Subscribe to notification events
   * @param {string} eventType - Type of event to listen for
   * @param {Function} callback - Callback function to execute
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  /**
   * Unsubscribe from notification events
   * @param {string} eventType - Type of event
   * @param {Function} callback - Callback function to remove
   */
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  /**
   * Emit notification event
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
  }

  /**
   * Create a notification object
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Notification object
   */
  createNotification(type, title, message, metadata = {}) {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      metadata,
      priority: metadata.priority || 'normal'
    };
  }

  /**
   * Add notification to queue
   * @param {Object} notification - Notification object
   */
  addToQueue(notification) {
    this.notificationQueue.push(notification);
    this.processQueue();
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      await this.processNotification(notification);
    }

    this.isProcessing = false;
  }

  /**
   * Process individual notification
   * @param {Object} notification - Notification object
   */
  async processNotification(notification) {
    try {
      // Store notification in localStorage for persistence
      this.storeNotification(notification);

      // Emit notification event
      this.emit('notification', notification);

      // Emit specific type event
      this.emit(notification.type, notification);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        this.showBrowserNotification(notification);
      }

      console.log('Notification processed:', notification);
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  }

  /**
   * Store notification in localStorage
   * @param {Object} notification - Notification object
   */
  storeNotification(notification) {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      stored.unshift(notification); // Add to beginning
      
      // Keep only last 100 notifications
      if (stored.length > 100) {
        stored.splice(100);
      }
      
      localStorage.setItem('admin_notifications', JSON.stringify(stored));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Get stored notifications
   * @returns {Array} Array of notifications
   */
  getStoredNotifications() {
    try {
      return JSON.parse(localStorage.getItem('admin_notifications') || '[]');
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    try {
      const stored = this.getStoredNotifications();
      const notification = stored.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        localStorage.setItem('admin_notifications', JSON.stringify(stored));
        this.emit('notificationRead', { id: notificationId });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    try {
      const stored = this.getStoredNotifications();
      stored.forEach(notification => {
        notification.read = true;
      });
      localStorage.setItem('admin_notifications', JSON.stringify(stored));
      this.emit('allNotificationsRead', {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    try {
      localStorage.removeItem('admin_notifications');
      this.emit('notificationsCleared', {});
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Show browser notification
   * @param {Object} notification - Notification object
   */
  showBrowserNotification(notification) {
    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'high',
        silent: notification.priority === 'low'
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    try {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Scholarship-specific notification methods

  /**
   * Notify about new scholarship application
   * @param {Object} application - Application data
   */
  notifyNewApplication(application) {
    const notification = this.createNotification(
      'scholarship_new_application',
      'New Scholarship Application',
      `New application from ${application.student_name} for ${application.scholarship_category}`,
      {
        priority: 'high',
        applicationId: application.id,
        studentId: application.student_id,
        category: application.scholarship_category,
        level: application.education_level
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about application review
   * @param {Object} application - Application data
   * @param {string} action - Review action (reviewed, rejected, compliance)
   */
  notifyApplicationReview(application, action) {
    let title, message;
    
    switch (action) {
      case 'reviewed':
        title = 'Application Reviewed';
        message = `Application from ${application.student_name} has been reviewed and approved`;
        break;
      case 'rejected':
        title = 'Application Rejected';
        message = `Application from ${application.student_name} has been rejected`;
        break;
      case 'compliance':
        title = 'Application Flagged for Compliance';
        message = `Application from ${application.student_name} has been flagged for compliance review`;
        break;
      default:
        title = 'Application Status Updated';
        message = `Application from ${application.student_name} status has been updated`;
    }

    const notification = this.createNotification(
      'scholarship_application_review',
      title,
      message,
      {
        priority: 'normal',
        applicationId: application.id,
        studentId: application.student_id,
        action,
        category: application.scholarship_category
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about interview scheduling
   * @param {Object} interview - Interview data
   */
  notifyInterviewScheduled(interview) {
    const notification = this.createNotification(
      'scholarship_interview_scheduled',
      'Interview Scheduled',
      `Interview scheduled for ${interview.student_name} on ${new Date(interview.scheduled_date).toLocaleDateString()}`,
      {
        priority: 'normal',
        applicationId: interview.application_id,
        studentId: interview.student_id,
        interviewId: interview.id,
        scheduledDate: interview.scheduled_date
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about interview completion
   * @param {Object} interview - Interview data
   * @param {string} result - Interview result (passed, failed)
   */
  notifyInterviewCompleted(interview, result) {
    const notification = this.createNotification(
      'scholarship_interview_completed',
      'Interview Completed',
      `Interview for ${interview.student_name} has been completed - ${result}`,
      {
        priority: 'normal',
        applicationId: interview.application_id,
        studentId: interview.student_id,
        interviewId: interview.id,
        result
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about final approval
   * @param {Object} application - Application data
   */
  notifyFinalApproval(application) {
    const notification = this.createNotification(
      'scholarship_final_approval',
      'Scholarship Approved',
      `Scholarship application from ${application.student_name} has been finally approved`,
      {
        priority: 'high',
        applicationId: application.id,
        studentId: application.student_id,
        category: application.scholarship_category,
        level: application.education_level
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about bulk actions
   * @param {string} action - Action type
   * @param {number} count - Number of applications
   */
  notifyBulkAction(action, count) {
    let title, message;
    
    switch (action) {
      case 'reviewed':
        title = 'Bulk Review Complete';
        message = `${count} application(s) have been marked as reviewed`;
        break;
      case 'rejected':
        title = 'Bulk Rejection Complete';
        message = `${count} application(s) have been rejected`;
        break;
      case 'compliance':
        title = 'Bulk Compliance Complete';
        message = `${count} application(s) have been flagged for compliance`;
        break;
      default:
        title = 'Bulk Action Complete';
        message = `${count} application(s) have been processed`;
    }

    const notification = this.createNotification(
      'scholarship_bulk_action',
      title,
      message,
      {
        priority: 'normal',
        action,
        count
      }
    );
    this.addToQueue(notification);
  }

  /**
   * Notify about system events
   * @param {string} event - Event type
   * @param {string} message - Event message
   * @param {Object} metadata - Additional metadata
   */
  notifySystemEvent(event, message, metadata = {}) {
    const notification = this.createNotification(
      'system_event',
      'System Event',
      message,
      {
        priority: 'low',
        event,
        ...metadata
      }
    );
    this.addToQueue(notification);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
