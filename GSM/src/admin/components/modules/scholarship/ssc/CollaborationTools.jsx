import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bell, 
  Calendar, 
  Users, 
  FileText, 
  Plus, 
  Search,
  Send,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Hash
} from 'lucide-react';

function CollaborationTools() {
  const [activeTab, setActiveTab] = useState('discussions');
  const [discussions, setDiscussions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Mock data - replace with actual API calls
        const mockDiscussions = [
          {
            id: 'DISC-001',
            title: 'Application Review for APP-2024-001',
            applicationId: 'APP-2024-001',
            studentName: 'Juan Dela Cruz',
            createdBy: 'Dr. Maria Santos',
            createdAt: '2024-01-15T10:30:00Z',
            lastMessage: 'I recommend approval based on academic performance',
            lastMessageBy: 'Prof. Juan Cruz',
            lastMessageAt: '2024-01-15T14:45:00Z',
            participants: ['Dr. Maria Santos', 'Prof. Juan Cruz', 'Dr. Ana Reyes'],
            messageCount: 8,
            status: 'active',
            priority: 'high'
          },
          {
            id: 'DISC-002',
            title: 'Appeal Discussion for APL-2024-001',
            applicationId: 'APP-2024-002',
            studentName: 'Maria Garcia',
            createdBy: 'Prof. Juan Cruz',
            createdAt: '2024-01-14T09:15:00Z',
            lastMessage: 'Additional documents have been submitted',
            lastMessageBy: 'Dr. Ana Reyes',
            lastMessageAt: '2024-01-14T16:20:00Z',
            participants: ['Prof. Juan Cruz', 'Dr. Ana Reyes'],
            messageCount: 5,
            status: 'active',
            priority: 'medium'
          },
          {
            id: 'DISC-003',
            title: 'Policy Update Discussion',
            applicationId: null,
            studentName: null,
            createdBy: 'Dr. Maria Santos',
            createdAt: '2024-01-13T11:00:00Z',
            lastMessage: 'New eligibility criteria approved by committee',
            lastMessageBy: 'Dr. Maria Santos',
            lastMessageAt: '2024-01-13T11:00:00Z',
            participants: ['Dr. Maria Santos', 'Prof. Juan Cruz', 'Dr. Ana Reyes'],
            messageCount: 12,
            status: 'resolved',
            priority: 'low'
          }
        ];

        const mockNotifications = [
          {
            id: 'NOTIF-001',
            type: 'new_application',
            title: 'New Application Received',
            message: 'APP-2024-004 from Pedro Santos requires review',
            timestamp: '2024-01-15T15:30:00Z',
            read: false,
            priority: 'high'
          },
          {
            id: 'NOTIF-002',
            type: 'appeal',
            title: 'Appeal Submitted',
            message: 'APL-2024-002 appeal requires committee review',
            timestamp: '2024-01-15T14:20:00Z',
            read: false,
            priority: 'medium'
          },
          {
            id: 'NOTIF-003',
            type: 'meeting',
            title: 'Meeting Reminder',
            message: 'SSC Committee Meeting in 30 minutes',
            timestamp: '2024-01-15T13:30:00Z',
            read: true,
            priority: 'low'
          },
          {
            id: 'NOTIF-004',
            type: 'decision',
            title: 'Decision Required',
            message: 'APP-2024-003 evaluation deadline approaching',
            timestamp: '2024-01-15T12:15:00Z',
            read: true,
            priority: 'high'
          }
        ];

        const mockMeetings = [
          {
            id: 'MEET-001',
            title: 'SSC Committee Meeting - January 2024',
            date: '2024-01-20',
            time: '14:00',
            duration: '2 hours',
            location: 'Conference Room A',
            attendees: ['Dr. Maria Santos', 'Prof. Juan Cruz', 'Dr. Ana Reyes'],
            agenda: [
              'Review pending applications',
              'Discuss policy updates',
              'Appeal cases review'
            ],
            status: 'scheduled',
            minutes: null
          },
          {
            id: 'MEET-002',
            title: 'Emergency Appeal Review',
            date: '2024-01-18',
            time: '10:00',
            duration: '1 hour',
            location: 'Virtual Meeting',
            attendees: ['Dr. Maria Santos', 'Prof. Juan Cruz'],
            agenda: [
              'Urgent appeal case review',
              'Decision on special circumstances'
            ],
            status: 'completed',
            minutes: 'Meeting completed. Appeal approved with conditions.'
          }
        ];

        setDiscussions(mockDiscussions);
        setNotifications(mockNotifications);
        setMeetings(mockMeetings);
      } catch (err) {
        setError('Failed to load collaboration data');
        console.error('Error loading collaboration data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      resolved: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.active;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_application: FileText,
      appeal: AlertTriangle,
      meeting: Calendar,
      decision: CheckCircle
    };
    const Icon = icons[type] || Bell;
    return <Icon className="h-5 w-5" />;
  };

  const handleCreateDiscussion = () => {
    setShowDiscussionModal(true);
  };

  const handleCreateMeeting = () => {
    setShowMeetingModal(true);
  };

  const handleViewDiscussion = (discussion) => {
    setSelectedDiscussion(discussion);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaboration Tools</h1>
        <p className="text-gray-600">Discussion threads, notifications, and meeting management</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'discussions', label: 'Discussions', count: discussions.length },
            { id: 'notifications', label: 'Notifications', count: notifications.filter(n => !n.read).length },
            { id: 'meetings', label: 'Meetings', count: meetings.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div>
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateDiscussion}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </button>
          </div>

          {/* Discussions List */}
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{discussion.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(discussion.priority)}`}>
                        {discussion.priority.toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(discussion.status)}`}>
                        {discussion.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {discussion.applicationId && (
                      <p className="text-sm text-gray-600 mb-2">
                        Application: {discussion.applicationId} - {discussion.studentName}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-700 mb-3">{discussion.lastMessage}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Created by {discussion.createdBy}</span>
                        <span>•</span>
                        <span>{discussion.messageCount} messages</span>
                        <span>•</span>
                        <span>{discussion.participants.length} participants</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Last message by {discussion.lastMessageBy}</span>
                        <span>•</span>
                        <span>{new Date(discussion.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDiscussion(discussion)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Discussion"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900" title="Join Discussion">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications ({notifications.filter(n => !n.read).length} unread)
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${!notification.read ? 'text-blue-600' : 'text-gray-400'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority.toUpperCase()}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div>
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleCreateMeeting}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </button>
          </div>

          {/* Meetings List */}
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Date:</span> {meeting.date}</p>
                        <p><span className="font-medium">Time:</span> {meeting.time}</p>
                        <p><span className="font-medium">Duration:</span> {meeting.duration}</p>
                        <p><span className="font-medium">Location:</span> {meeting.location}</p>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Attendees:</span> {meeting.attendees.length}</p>
                        <div className="flex flex-wrap gap-1">
                          {meeting.attendees.map((attendee, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              <User className="h-3 w-3 mr-1" />
                              {attendee}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Agenda</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {meeting.agenda.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {meeting.minutes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Meeting Minutes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {meeting.minutes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900" title="View Meeting">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900" title="Edit Meeting">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Discussion</h3>
              <button
                onClick={() => setShowDiscussionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discussion Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter discussion title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application (Optional)</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Application</option>
                  <option value="APP-2024-001">APP-2024-001 - Juan Dela Cruz</option>
                  <option value="APP-2024-002">APP-2024-002 - Maria Garcia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start the discussion..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDiscussionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDiscussionModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Discussion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollaborationTools;
