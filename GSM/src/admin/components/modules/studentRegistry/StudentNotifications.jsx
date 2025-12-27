import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  Filter, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Save, 
  RefreshCw,
  MessageSquare,
  Phone,
  FileText,
  Calendar,
  User,
  GraduationCap,
  Award,
  Settings,
  Bell,
  BellOff,
  Archive,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import studentApiService from '../../../../services/studentApiService';

function StudentNotifications() {
    const { showSuccess, showError } = useToastContext();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        scholarship_status: 'all',
        program: 'all',
        year_level: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [composeData, setComposeData] = useState({
        type: 'email',
        subject: '',
        message: '',
        template: '',
        priority: 'normal',
        scheduled: false,
        scheduledDate: '',
        scheduledTime: ''
    });
    const [templateData, setTemplateData] = useState({
        name: '',
        type: 'email',
        subject: '',
        message: '',
        variables: []
    });
    const [notificationHistory, setNotificationHistory] = useState([]);

    const notificationTypes = [
        { id: 'email', name: 'Email', icon: Mail, color: 'blue' },
        { id: 'sms', name: 'SMS', icon: Phone, color: 'green' },
        { id: 'both', name: 'Both Email & SMS', icon: MessageSquare, color: 'purple' }
    ];

    const priorityLevels = [
        { id: 'low', name: 'Low', color: 'gray' },
        { id: 'normal', name: 'Normal', color: 'blue' },
        { id: 'high', name: 'High', color: 'orange' },
        { id: 'urgent', name: 'Urgent', color: 'red' }
    ];

    const defaultTemplates = [
        {
            id: 1,
            name: 'Welcome Message',
            type: 'email',
            subject: 'Welcome to GSM Student Registry!',
            message: 'Dear {{first_name}},\n\nWelcome to the GSM Student Registry system. Your account has been created successfully.\n\nStudent Number: {{student_number}}\nProgram: {{program}}\n\nBest regards,\nGSM Team',
            variables: ['first_name', 'student_number', 'program']
        },
        {
            id: 2,
            name: 'Scholarship Award',
            type: 'email',
            subject: 'Congratulations! Scholarship Awarded',
            message: 'Dear {{first_name}},\n\nCongratulations! You have been awarded a scholarship.\n\nAmount: {{approved_amount}}\nStart Date: {{scholarship_start_date}}\n\nPlease check your student portal for more details.\n\nBest regards,\nGSM Team',
            variables: ['first_name', 'approved_amount', 'scholarship_start_date']
        },
        {
            id: 3,
            name: 'Document Request',
            type: 'email',
            subject: 'Document Submission Required',
            message: 'Dear {{first_name}},\n\nPlease submit the following documents:\n\n{{document_list}}\n\nDeadline: {{deadline}}\n\nThank you,\nGSM Team',
            variables: ['first_name', 'document_list', 'deadline']
        },
        {
            id: 4,
            name: 'Status Update',
            type: 'email',
            subject: 'Account Status Update',
            message: 'Dear {{first_name}},\n\nYour account status has been updated to: {{status}}\n\nPlease contact us if you have any questions.\n\nBest regards,\nGSM Team',
            variables: ['first_name', 'status']
        }
    ];

    useEffect(() => {
        fetchStudents();
        fetchNotifications();
        setTemplates(defaultTemplates);
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchTerm, filters]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await studentApiService.getStudents({ per_page: 1000 });
            // Handle paginated response - data is in response.data.data
            setStudents(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            showError('Failed to fetch students');
            // Set empty array instead of mock data
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            // Mock notification history
            setNotificationHistory([
                {
                    id: 1,
                    type: 'email',
                    subject: 'Welcome to GSM Student Registry!',
                    recipients: 25,
                    status: 'sent',
                    sent_at: '2024-01-15 10:30:00',
                    created_by: 'Admin'
                },
                {
                    id: 2,
                    type: 'sms',
                    subject: 'Document submission reminder',
                    recipients: 10,
                    status: 'sent',
                    sent_at: '2024-01-14 14:20:00',
                    created_by: 'Admin'
                },
                {
                    id: 3,
                    type: 'email',
                    subject: 'Scholarship award notification',
                    recipients: 5,
                    status: 'pending',
                    sent_at: null,
                    created_by: 'Admin'
                }
            ]);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const filterStudents = () => {
        let filtered = [...students];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Other filters
        if (filters.status !== 'all') {
            filtered = filtered.filter(student => student.status === filters.status);
        }
        if (filters.scholarship_status !== 'all') {
            filtered = filtered.filter(student => student.scholarship_status === filters.scholarship_status);
        }
        if (filters.program !== 'all') {
            filtered = filtered.filter(student => student.program === filters.program);
        }
        if (filters.year_level !== 'all') {
            filtered = filtered.filter(student => student.year_level === filters.year_level);
        }

        setFilteredStudents(filtered);
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(student => student.student_uuid)));
        }
    };

    const handleSelectStudent = (studentUuid) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentUuid)) {
            newSelected.delete(studentUuid);
        } else {
            newSelected.add(studentUuid);
        }
        setSelectedStudents(newSelected);
    };

    const handleTemplateSelect = (template) => {
        setComposeData(prev => ({
            ...prev,
            subject: template.subject,
            message: template.message,
            template: template.name
        }));
    };

    const processMessage = (message, student) => {
        let processedMessage = message;
        
        // Replace variables with student data
        processedMessage = processedMessage.replace(/\{\{first_name\}\}/g, student.first_name || '');
        processedMessage = processedMessage.replace(/\{\{last_name\}\}/g, student.last_name || '');
        processedMessage = processedMessage.replace(/\{\{student_number\}\}/g, student.student_number || '');
        processedMessage = processedMessage.replace(/\{\{email\}\}/g, student.email || '');
        processedMessage = processedMessage.replace(/\{\{program\}\}/g, student.program || '');
        processedMessage = processedMessage.replace(/\{\{year_level\}\}/g, student.year_level || '');
        processedMessage = processedMessage.replace(/\{\{scholarship_status\}\}/g, student.scholarship_status || '');
        processedMessage = processedMessage.replace(/\{\{approved_amount\}\}/g, student.approved_amount || '');
        processedMessage = processedMessage.replace(/\{\{scholarship_start_date\}\}/g, student.scholarship_start_date || '');
        processedMessage = processedMessage.replace(/\{\{status\}\}/g, student.status || '');
        
        return processedMessage;
    };

    const sendNotification = async () => {
        if (selectedStudents.size === 0) {
            showError('Please select at least one student');
            return;
        }

        if (!composeData.subject.trim() || !composeData.message.trim()) {
            showError('Please fill in subject and message');
            return;
        }

        try {
            const selectedStudentList = filteredStudents.filter(s => selectedStudents.has(s.student_uuid));
            
            // Process message for each student
            const notifications = selectedStudentList.map(student => ({
                student_uuid: student.student_uuid,
                type: composeData.type,
                subject: composeData.subject,
                message: processMessage(composeData.message, student),
                priority: composeData.priority,
                scheduled: composeData.scheduled,
                scheduled_date: composeData.scheduled ? `${composeData.scheduledDate} ${composeData.scheduledTime}` : null
            }));

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            showSuccess(`Notification sent to ${selectedStudents.size} students`);
            setSelectedStudents(new Set());
            setShowComposeModal(false);
            setComposeData({
                type: 'email',
                subject: '',
                message: '',
                template: '',
                priority: 'normal',
                scheduled: false,
                scheduledDate: '',
                scheduledTime: ''
            });
            
            // Add to history
            const newNotification = {
                id: Date.now(),
                type: composeData.type,
                subject: composeData.subject,
                recipients: selectedStudents.size,
                status: 'sent',
                sent_at: new Date().toISOString(),
                created_by: 'Admin'
            };
            setNotificationHistory(prev => [newNotification, ...prev]);
            
        } catch (error) {
            console.error('Error sending notification:', error);
            showError('Failed to send notification');
        }
    };

    const saveTemplate = () => {
        if (!templateData.name.trim() || !templateData.subject.trim() || !templateData.message.trim()) {
            showError('Please fill in all required fields');
            return;
        }

        const newTemplate = {
            id: Date.now(),
            ...templateData,
            variables: extractVariables(templateData.message)
        };

        setTemplates(prev => [...prev, newTemplate]);
        showSuccess('Template saved successfully');
        setShowTemplateModal(false);
        setTemplateData({
            name: '',
            type: 'email',
            subject: '',
            message: '',
            variables: []
        });
    };

    const extractVariables = (message) => {
        const matches = message.match(/\{\{(\w+)\}\}/g);
        return matches ? [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))] : [];
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'failed': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'normal': return 'text-blue-600 bg-blue-100';
            case 'low': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Student Notifications</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Send notifications to students via email and SMS</p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    >
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">History</span>
                        <span className="sm:hidden">History</span>
                    </button>
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm sm:text-base"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Templates</span>
                        <span className="sm:hidden">Templates</span>
                    </button>
                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Compose</span>
                        <span className="sm:hidden">Compose</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudents.size}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Send className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Templates</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent Today</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notificationHistory.filter(n => n.sent_at && new Date(n.sent_at).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search students by name, student number, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        <span className="sm:hidden">Filter</span>
                    </button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Scholarship Status
                                    </label>
                                    <select
                                        value={filters.scholarship_status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, scholarship_status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="all">All Scholarship Status</option>
                                        <option value="none">None</option>
                                        <option value="applicant">Applicant</option>
                                        <option value="scholar">Scholar</option>
                                        <option value="alumni">Alumni</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Program
                                    </label>
                                    <select
                                        value={filters.program}
                                        onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="all">All Programs</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Business Administration">Business Administration</option>
                                        <option value="Medicine">Medicine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Year Level
                                    </label>
                                    <select
                                        value={filters.year_level}
                                        onChange={(e) => setFilters(prev => ({ ...prev, year_level: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="all">All Year Levels</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Students Info */}
            {selectedStudents.size > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                        </p>
                        <button
                            onClick={() => setSelectedStudents(new Set())}
                            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {filteredStudents.length} students found
                        </p>
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center space-x-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden sm:inline">Select All</span>
                            <span className="sm:hidden">Select All</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Name</span>
                                    <span className="sm:hidden">NAME</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Student ID</span>
                                    <span className="sm:hidden">ID</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Email</span>
                                    <span className="sm:hidden">EMAIL</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Phone</span>
                                    <span className="sm:hidden">PHONE</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Program</span>
                                    <span className="sm:hidden">PROGRA</span>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <span className="hidden sm:inline">Status</span>
                                    <span className="sm:hidden">STATUS</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredStudents.map((student, index) => (
                                <tr key={student.student_uuid || index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.has(student.student_uuid)}
                                            onChange={() => handleSelectStudent(student.student_uuid)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {student.first_name} {student.last_name}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {student.student_number}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {student.email}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {student.contact_number}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {student.program}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                                            (student.status || '').toLowerCase() === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                        }`}>
                                            <span className="hidden sm:inline">{student.status?.toUpperCase()}</span>
                                            <span className="sm:hidden">{student.status?.charAt(0)?.toUpperCase()}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compose Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compose Notification</h3>
                                <button
                                    onClick={() => setShowComposeModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Notification Type
                                        </label>
                                        <select
                                            value={composeData.type}
                                            onChange={(e) => setComposeData(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        >
                                            {notificationTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority
                                        </label>
                                        <select
                                            value={composeData.priority}
                                            onChange={(e) => setComposeData(prev => ({ ...prev, priority: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        >
                                            {priorityLevels.map(level => (
                                                <option key={level.id} value={level.id}>{level.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Template
                                    </label>
                                    <select
                                        value={composeData.template}
                                        onChange={(e) => {
                                            const template = templates.find(t => t.name === e.target.value);
                                            if (template) handleTemplateSelect(template);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="">Select a template (optional)</option>
                                        {templates.map(template => (
                                            <option key={template.id} value={template.name}>{template.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter notification subject"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        value={composeData.message}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, message: e.target.value }))}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter notification message. Use {{variable_name}} for dynamic content."
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Available variables: first_name, last_name, student_number, email, program, year_level, scholarship_status, approved_amount, status
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={composeData.scheduled}
                                        onChange={(e) => setComposeData(prev => ({ ...prev, scheduled: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Schedule for later</span>
                                </div>

                                {composeData.scheduled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={composeData.scheduledDate}
                                                onChange={(e) => setComposeData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Time
                                            </label>
                                            <input
                                                type="time"
                                                value={composeData.scheduledTime}
                                                onChange={(e) => setComposeData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Recipients:</strong> {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowComposeModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={sendNotification}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Send Notification
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Templates</h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowTemplateModal(false)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => setTemplateData({
                                            name: '',
                                            type: 'email',
                                            subject: '',
                                            message: '',
                                            variables: []
                                        })}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                    >
                                        New Template
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Template List */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Existing Templates</h4>
                                    <div className="space-y-2">
                                        {templates.map(template => (
                                            <div key={template.id} className="border border-gray-200 dark:border-slate-600 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 dark:text-white">{template.name}</h5>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{template.type}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => setTemplateData(template)}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setTemplates(prev => prev.filter(t => t.id !== template.id))}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Template Editor */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Template Editor</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Template Name
                                            </label>
                                            <input
                                                type="text"
                                                value={templateData.name}
                                                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                                placeholder="Enter template name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Type
                                            </label>
                                            <select
                                                value={templateData.type}
                                                onChange={(e) => setTemplateData(prev => ({ ...prev, type: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            >
                                                <option value="email">Email</option>
                                                <option value="sms">SMS</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Subject
                                            </label>
                                            <input
                                                type="text"
                                                value={templateData.subject}
                                                onChange={(e) => setTemplateData(prev => ({ ...prev, subject: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                                placeholder="Enter subject"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Message
                                            </label>
                                            <textarea
                                                value={templateData.message}
                                                onChange={(e) => setTemplateData(prev => ({ 
                                                    ...prev, 
                                                    message: e.target.value,
                                                    variables: extractVariables(e.target.value)
                                                }))}
                                                rows={6}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                                placeholder="Enter message template"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Use {{variable_name}} for dynamic content
                                            </p>
                                        </div>

                                        {templateData.variables.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Available Variables
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {templateData.variables.map(variable => (
                                                        <span key={variable} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                            {`{{${variable}}}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={saveTemplate}
                                            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Save Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification History</h3>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recipients</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sent At</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {notificationHistory.map((notification, index) => (
                                            <tr key={notification.id || index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        notification.type === 'email' ? 'bg-blue-100 text-blue-800' : 
                                                        notification.type === 'sms' ? 'bg-green-100 text-green-800' : 
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {notification.type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {notification.subject}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {notification.recipients}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                                                        {notification.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {notification.sent_at ? new Date(notification.sent_at).toLocaleString() : 'Pending'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {notification.created_by}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default StudentNotifications;
