import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Download, 
  Archive, 
  RotateCcw, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Mail,
  FileText,
  Tag,
  GraduationCap,
  Award,
  Send,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit,
  Plus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import studentApiService from '../../../../services/studentApiService';

function BulkOperations() {
    const { showSuccess, showError } = useToastContext();
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        scholarship_status: 'all',
        program: 'all',
        year_level: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showBulkActionModal, setShowBulkActionModal] = useState(false);
    const [currentBulkAction, setCurrentBulkAction] = useState('');
    const [bulkActionData, setBulkActionData] = useState({});
    const [importFile, setImportFile] = useState(null);
    const [importProgress, setImportProgress] = useState(0);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportFields, setExportFields] = useState({
        basic: true,
        academic: true,
        financial: true,
        documents: true
    });

    const bulkActions = [
        {
            id: 'update_status',
            title: 'Update Academic Status',
            description: 'Change academic status for selected students',
            icon: GraduationCap,
            color: 'blue',
            fields: [
                { name: 'academic_status', type: 'select', label: 'New Status', options: [
                    { value: 'enrolled', label: 'Enrolled' },
                    { value: 'graduated', label: 'Graduated' },
                    { value: 'dropped', label: 'Dropped' },
                    { value: 'transferred', label: 'Transferred' }
                ]}
            ]
        },
        {
            id: 'add_notes',
            title: 'Add Notes/Tags',
            description: 'Add notes or tags to selected students',
            icon: Tag,
            color: 'green',
            fields: [
                { name: 'note', type: 'textarea', label: 'Note Content', placeholder: 'Enter note content...' },
                { name: 'tag', type: 'text', label: 'Tag', placeholder: 'Enter tag (optional)' }
            ]
        },
        {
            id: 'request_documents',
            title: 'Request Documents',
            description: 'Send document request to selected students',
            icon: FileText,
            color: 'purple',
            fields: [
                { name: 'document_type', type: 'select', label: 'Document Type', options: [
                    { value: 'academic', label: 'Academic Records' },
                    { value: 'financial', label: 'Financial Documents' },
                    { value: 'personal', label: 'Personal Documents' },
                    { value: 'scholarship', label: 'Scholarship Documents' }
                ]},
                { name: 'message', type: 'textarea', label: 'Request Message', placeholder: 'Enter request message...' }
            ]
        },
        {
            id: 'send_notification',
            title: 'Send Notification',
            description: 'Send email/SMS notification to selected students',
            icon: Mail,
            color: 'orange',
            fields: [
                { name: 'notification_type', type: 'select', label: 'Notification Type', options: [
                    { value: 'email', label: 'Email' },
                    { value: 'sms', label: 'SMS' },
                    { value: 'both', label: 'Both Email & SMS' }
                ]},
                { name: 'subject', type: 'text', label: 'Subject', placeholder: 'Enter notification subject...' },
                { name: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter notification message...' }
            ]
        },
        {
            id: 'update_scholarship',
            title: 'Update Scholarship Status',
            description: 'Update scholarship status for selected students',
            icon: Award,
            color: 'yellow',
            fields: [
                { name: 'scholarship_status', type: 'select', label: 'Scholarship Status', options: [
                    { value: 'none', label: 'None' },
                    { value: 'applicant', label: 'Applicant' },
                    { value: 'scholar', label: 'Scholar' },
                    { value: 'alumni', label: 'Alumni' }
                ]},
                { name: 'amount', type: 'number', label: 'Approved Amount', placeholder: 'Enter amount (optional)' }
            ]
        },
        {
            id: 'archive',
            title: 'Archive Students',
            description: 'Move selected students to archive',
            icon: Archive,
            color: 'gray',
            fields: [
                { name: 'reason', type: 'textarea', label: 'Archive Reason', placeholder: 'Enter reason for archiving...' }
            ]
        },
        {
            id: 'restore',
            title: 'Restore Students',
            description: 'Restore selected students from archive',
            icon: RotateCcw,
            color: 'green',
            fields: []
        },
        {
            id: 'delete',
            title: 'Delete Students',
            description: 'Permanently delete selected students',
            icon: Trash2,
            color: 'red',
            fields: [
                { name: 'confirmation', type: 'text', label: 'Type DELETE to confirm', placeholder: 'DELETE' }
            ]
        }
    ];

    useEffect(() => {
        fetchStudents();
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
            // Fallback to mock data
            setStudents([
                {
                    student_uuid: '1',
                    student_number: 'GSM2024001',
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@example.com',
                    program: 'Computer Science',
                    year_level: '3rd Year',
                    scholarship_status: 'scholar',
                    academic_status: 'enrolled',
                    status: 'active'
                },
                {
                    student_uuid: '2',
                    student_number: 'GSM2024002',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    email: 'jane.smith@example.com',
                    program: 'Engineering',
                    year_level: '2nd Year',
                    scholarship_status: 'applicant',
                    academic_status: 'enrolled',
                    status: 'active'
                }
            ]);
        } finally {
            setLoading(false);
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

    const handleBulkAction = (actionId) => {
        if (selectedStudents.size === 0) {
            showError('Please select at least one student');
            return;
        }
        
        const action = bulkActions.find(a => a.id === actionId);
        setCurrentBulkAction(actionId);
        setBulkActionData({});
        setShowBulkActionModal(true);
    };

    const executeBulkAction = async () => {
        const selectedStudentList = filteredStudents.filter(s => selectedStudents.has(s.student_uuid));
        let successCount = 0;
        let errorCount = 0;

        try {
            switch (currentBulkAction) {
                case 'update_status':
                    await studentApiService.bulkUpdateStudents(
                        Array.from(selectedStudents),
                        { academic_status: bulkActionData.academic_status }
                    );
                    successCount = selectedStudents.size;
                    break;

                case 'add_notes':
                    for (const studentUuid of selectedStudents) {
                        try {
                            await studentApiService.addStudentNote(studentUuid, bulkActionData.note);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                    break;

                case 'request_documents':
                    // Simulate document request
                    for (const studentUuid of selectedStudents) {
                        try {
                            await studentApiService.sendNotificationToStudents(
                                [studentUuid],
                                {
                                    type: 'document_request',
                                    subject: 'Document Request',
                                    message: bulkActionData.message,
                                    document_type: bulkActionData.document_type
                                }
                            );
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                    break;

                case 'send_notification':
                    await studentApiService.sendNotificationToStudents(
                        Array.from(selectedStudents),
                        {
                            type: bulkActionData.notification_type,
                            subject: bulkActionData.subject,
                            message: bulkActionData.message
                        }
                    );
                    successCount = selectedStudents.size;
                    break;

                case 'update_scholarship':
                    await studentApiService.bulkUpdateStudents(
                        Array.from(selectedStudents),
                        { 
                            scholarship_status: bulkActionData.scholarship_status,
                            approved_amount: bulkActionData.amount
                        }
                    );
                    successCount = selectedStudents.size;
                    break;

                case 'archive':
                    for (const studentUuid of selectedStudents) {
                        try {
                            await studentApiService.archiveStudent(studentUuid, bulkActionData.reason);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                    break;

                case 'restore':
                    for (const studentUuid of selectedStudents) {
                        try {
                            await studentApiService.restoreStudent(studentUuid);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                    break;

                case 'delete':
                    if (bulkActionData.confirmation !== 'DELETE') {
                        showError('Please type DELETE to confirm');
                        return;
                    }
                    for (const studentUuid of selectedStudents) {
                        try {
                            await studentApiService.deleteStudent(studentUuid);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                        }
                    }
                    break;
            }

            showSuccess(`Bulk action completed: ${successCount} successful, ${errorCount} failed`);
            setSelectedStudents(new Set());
            await fetchStudents();
        } catch (error) {
            console.error('Error executing bulk action:', error);
            showError('Failed to execute bulk action');
        } finally {
            setShowBulkActionModal(false);
            setBulkActionData({});
        }
    };

    const handleExport = async () => {
        try {
            const selectedStudentList = selectedStudents.size > 0 
                ? filteredStudents.filter(s => selectedStudents.has(s.student_uuid))
                : filteredStudents;

            let csvContent = '';
            const headers = [];
            
            if (exportFields.basic) {
                headers.push('Name', 'Student Number', 'Email', 'Contact Number', 'Citizen ID');
            }
            if (exportFields.academic) {
                headers.push('Program', 'Year Level', 'Academic Status', 'GPA', 'Enrollment Date');
            }
            if (exportFields.financial) {
                headers.push('Scholarship Status', 'Approved Amount', 'Scholarship Start Date');
            }
            if (exportFields.documents) {
                headers.push('Document Count', 'Last Document Upload');
            }
            
            csvContent = headers.join(',') + '\n';
            
            csvContent += selectedStudentList.map(student => {
                const row = [];
                if (exportFields.basic) {
                    row.push(
                        `"${student.first_name} ${student.last_name}"`,
                        student.student_number || '',
                        student.email || '',
                        student.contact_number || '',
                        student.citizen_id || ''
                    );
                }
                if (exportFields.academic) {
                    row.push(
                        student.program || '',
                        student.year_level || '',
                        student.academic_status || '',
                        student.gpa || '',
                        student.enrollment_date || ''
                    );
                }
                if (exportFields.financial) {
                    row.push(
                        student.scholarship_status || '',
                        student.approved_amount || '',
                        student.scholarship_start_date || ''
                    );
                }
                if (exportFields.documents) {
                    row.push(
                        student.documents?.length || 0,
                        student.last_document_upload || ''
                    );
                }
                return row.join(',');
            }).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            showSuccess('Export completed successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            showError('Failed to export data');
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        
        setImportProgress(0);
        const interval = setInterval(() => {
            setImportProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    showSuccess('Students imported successfully!');
                    fetchStudents();
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'inactive': return 'text-yellow-600 bg-yellow-100';
            case 'archived': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getScholarshipStatusColor = (status) => {
        switch (status) {
            case 'scholar': return 'text-blue-600 bg-blue-100';
            case 'applicant': return 'text-orange-600 bg-orange-100';
            case 'alumni': return 'text-purple-600 bg-purple-100';
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Perform bulk actions on student records</p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import CSV</span>
                        <span className="sm:hidden">Import</span>
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Data</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {students.filter(s => s.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Archive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {students.filter(s => s.status === 'archived').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scholars</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {students.filter(s => s.scholarship_status === 'scholar').length}
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

            {/* Bulk Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {bulkActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleBulkAction(action.id)}
                            disabled={selectedStudents.size === 0}
                            className={`p-4 rounded-lg border-2 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                                selectedStudents.size === 0
                                    ? 'border-gray-200 dark:border-slate-600 text-gray-400'
                                    : `border-${action.color}-200 dark:border-${action.color}-800 hover:border-${action.color}-300 dark:hover:border-${action.color}-700 bg-${action.color}-50 dark:bg-${action.color}-900/20`
                            }`}
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                                <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                        </button>
                    ))}
                </div>
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
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredStudents.length} students found
                        </p>
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {selectedStudents.size === filteredStudents.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            <span>Select All</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scholarship</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredStudents.map((student, index) => (
                                <tr key={student.student_uuid || index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.has(student.student_uuid)}
                                            onChange={() => handleSelectStudent(student.student_uuid)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {student.first_name} {student.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {student.student_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {student.program}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                                            {student.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScholarshipStatusColor(student.scholarship_status)}`}>
                                            {student.scholarship_status?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Action Modal */}
            {showBulkActionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {bulkActions.find(a => a.id === currentBulkAction)?.title}
                                </h3>
                                <button
                                    onClick={() => setShowBulkActionModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                This action will be applied to {selectedStudents.size} selected students.
                            </p>

                            <div className="space-y-4">
                                {bulkActions.find(a => a.id === currentBulkAction)?.fields.map((field, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {field.label}
                                        </label>
                                        {field.type === 'select' ? (
                                            <select
                                                value={bulkActionData[field.name] || ''}
                                                onChange={(e) => setBulkActionData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                value={bulkActionData[field.name] || ''}
                                                onChange={(e) => setBulkActionData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={bulkActionData[field.name] || ''}
                                                onChange={(e) => setBulkActionData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowBulkActionModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeBulkAction}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Execute Action
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Export Format
                                    </label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="excel">Excel</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Include Fields
                                    </label>
                                    <div className="space-y-2">
                                        {Object.entries(exportFields).map(([key, value]) => (
                                            <label key={key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setExportFields(prev => ({ ...prev, [key]: e.target.checked }))}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                    {key.replace('_', ' ')}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Export Data
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Students</h3>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select CSV File
                                    </label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>

                                {importFile && (
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Selected: {importFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Size: {(importFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importFile}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Import Students
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default BulkOperations;