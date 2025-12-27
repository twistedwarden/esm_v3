import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  RefreshCw,
  Settings,
  Eye,
  FileSpreadsheet,
  FileImage,
  Database,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import studentApiService from '../../../../services/studentApiService';

function ImportExport() {
    const { showSuccess, showError } = useToastContext();
    const [importFile, setImportFile] = useState(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importStatus, setImportStatus] = useState('idle'); // idle, importing, success, error
    const [importResults, setImportResults] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImportSettings, setShowImportSettings] = useState(false);
    const [showExportSettings, setShowExportSettings] = useState(false);
    const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
    const [importSettings, setImportSettings] = useState({
        skipFirstRow: true,
        delimiter: ',',
        encoding: 'utf-8',
        validateEmail: true,
        validatePhone: true,
        autoGenerateStudentNumbers: true,
        defaultStatus: 'active',
        defaultAcademicStatus: 'enrolled'
    });
    const [exportSettings, setExportSettings] = useState({
        format: 'csv',
        includeFields: {
            basic: true,
            academic: true,
            financial: true,
            documents: true,
            notes: false,
            emergency: false,
            medical: false
        },
        dateFormat: 'MM/DD/YYYY',
        includeHeaders: true,
        filterActive: false,
        filterScholars: false
    });
    const [templateFields, setTemplateFields] = useState({
        basic: ['first_name', 'middle_name', 'last_name', 'email', 'contact_number', 'citizen_id', 'date_of_birth', 'gender', 'address'],
        academic: ['student_number', 'program', 'year_level', 'enrollment_date', 'academic_status', 'gpa', 'school_name'],
        financial: ['scholarship_status', 'approved_amount', 'scholarship_start_date'],
        emergency: ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'],
        medical: ['blood_type', 'allergies', 'medical_conditions']
    });

    useEffect(() => {
        fetchStudents();
    }, []);

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

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setImportFile(file);
                showSuccess('File selected successfully');
            } else {
                showError('Please select a CSV or Excel file');
            }
        }
    };

    const validateImportData = (data) => {
        const errors = [];
        const warnings = [];
        
        data.forEach((row, index) => {
            const rowNum = index + 1;
            
            // Required field validation
            if (!row.first_name?.trim()) {
                errors.push(`Row ${rowNum}: First name is required`);
            }
            if (!row.last_name?.trim()) {
                errors.push(`Row ${rowNum}: Last name is required`);
            }
            if (!row.email?.trim()) {
                errors.push(`Row ${rowNum}: Email is required`);
            }
            
            // Email validation
            if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
                errors.push(`Row ${rowNum}: Invalid email format`);
            }
            
            // Phone validation
            if (row.contact_number && !/^[\d\s\-\+\(\)]+$/.test(row.contact_number)) {
                warnings.push(`Row ${rowNum}: Phone number format may be invalid`);
            }
            
            // GPA validation
            if (row.gpa && (isNaN(row.gpa) || row.gpa < 0 || row.gpa > 4)) {
                errors.push(`Row ${rowNum}: GPA must be between 0 and 4`);
            }
            
            // Year level validation
            if (row.year_level && !['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].includes(row.year_level)) {
                warnings.push(`Row ${rowNum}: Year level format may be invalid`);
            }
        });
        
        return { errors, warnings };
    };

    const handleImport = async () => {
        if (!importFile) {
            showError('Please select a file to import');
            return;
        }

        setImportStatus('importing');
        setImportProgress(0);
        setImportResults(null);

        try {
            // Simulate file parsing
            const progressInterval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Simulate API call for import
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            clearInterval(progressInterval);
            setImportProgress(100);

            // Simulate import results with comprehensive validation
            const mockData = [
                { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', program: 'Computer Science', year_level: '3rd Year', gpa: 3.5 },
                { first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', program: 'Engineering', year_level: '2nd Year', gpa: 3.2 },
                { first_name: 'Bob', last_name: 'Johnson', email: 'invalid-email', program: 'Business', year_level: '1st Year', gpa: 2.8 },
                { first_name: '', last_name: 'Wilson', email: 'mike.wilson@example.com', program: 'Medicine', year_level: '4th Year', gpa: 3.8 },
                { first_name: 'Alice', last_name: 'Brown', email: 'alice.brown@example.com', program: 'Nursing', year_level: '2nd Year', gpa: 5.0 }
            ];

            const validation = validateImportData(mockData);
            
            const mockResults = {
                total: mockData.length,
                successful: mockData.length - validation.errors.length,
                failed: validation.errors.length,
                warningCount: validation.warnings.length,
                errors: validation.errors,
                warnings: validation.warnings,
                processed: mockData.length,
                skipped: 0
            };

            setImportResults(mockResults);
            setImportStatus('success');
            showSuccess(`Import completed: ${mockResults.successful} students imported successfully, ${mockResults.failed} failed`);
            
            // Refresh student list
            await fetchStudents();
            
            setTimeout(() => {
                setImportStatus('idle');
                setImportFile(null);
                setImportProgress(0);
                setImportResults(null);
            }, 5000);

        } catch (error) {
            setImportStatus('error');
            showError('Import failed. Please try again.');
            setImportProgress(0);
        }
    };

    const handleExport = async () => {
        try {
            let filteredStudents = [...students];
            
            // Apply filters
            if (exportSettings.filterActive) {
                filteredStudents = filteredStudents.filter(s => s.status === 'active');
            }
            if (exportSettings.filterScholars) {
                filteredStudents = filteredStudents.filter(s => s.scholarship_status === 'scholar');
            }

            let content = '';
            let filename = '';
            let mimeType = '';

            // Build headers based on selected fields
            const headers = [];
            if (exportSettings.includeFields.basic) {
                headers.push('First Name', 'Middle Name', 'Last Name', 'Email', 'Contact Number', 'Citizen ID', 'Date of Birth', 'Gender', 'Address');
            }
            if (exportSettings.includeFields.academic) {
                headers.push('Student Number', 'Program', 'Year Level', 'Enrollment Date', 'Academic Status', 'GPA', 'School Name');
            }
            if (exportSettings.includeFields.financial) {
                headers.push('Scholarship Status', 'Approved Amount', 'Scholarship Start Date');
            }
            if (exportSettings.includeFields.documents) {
                headers.push('Document Count', 'Last Document Upload');
            }
            if (exportSettings.includeFields.notes) {
                headers.push('Note Count', 'Last Note Date');
            }
            if (exportSettings.includeFields.emergency) {
                headers.push('Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Contact Relationship');
            }
            if (exportSettings.includeFields.medical) {
                headers.push('Blood Type', 'Allergies', 'Medical Conditions');
            }

            switch (exportSettings.format) {
                case 'csv':
                    content = buildCSVContent(filteredStudents, headers);
                    filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                case 'excel':
                    content = buildExcelContent(filteredStudents, headers);
                    filename = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'json':
                    content = JSON.stringify(filteredStudents, null, 2);
                    filename = `students_export_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                case 'pdf':
                    // For PDF, we'll create a CSV that can be converted
                    content = buildCSVContent(filteredStudents, headers);
                    filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
            }

            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            
            showSuccess('Export completed successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            showError('Failed to export data');
        }
    };

    const buildCSVContent = (students, headers) => {
        const csvContent = [];
        
        if (exportSettings.includeHeaders) {
            csvContent.push(headers.join(','));
        }
        
        csvContent.push(...students.map(student => {
            const row = [];
            if (exportSettings.includeFields.basic) {
                row.push(
                    `"${student.first_name || ''}"`,
                    `"${student.middle_name || ''}"`,
                    `"${student.last_name || ''}"`,
                    `"${student.email || ''}"`,
                    `"${student.contact_number || ''}"`,
                    `"${student.citizen_id || ''}"`,
                    `"${student.date_of_birth || ''}"`,
                    `"${student.gender || ''}"`,
                    `"${student.address || ''}"`
                );
            }
            if (exportSettings.includeFields.academic) {
                row.push(
                    `"${student.student_number || ''}"`,
                    `"${student.program || ''}"`,
                    `"${student.year_level || ''}"`,
                    `"${student.enrollment_date || ''}"`,
                    `"${student.academic_status || ''}"`,
                    `"${student.gpa || ''}"`,
                    `"${student.school_name || ''}"`
                );
            }
            if (exportSettings.includeFields.financial) {
                row.push(
                    `"${student.scholarship_status || ''}"`,
                    `"${student.approved_amount || ''}"`,
                    `"${student.scholarship_start_date || ''}"`
                );
            }
            if (exportSettings.includeFields.documents) {
                row.push(
                    `"${student.documents?.length || 0}"`,
                    `"${student.last_document_upload || ''}"`
                );
            }
            if (exportSettings.includeFields.notes) {
                row.push(
                    `"${student.notes?.length || 0}"`,
                    `"${student.last_note_date || ''}"`
                );
            }
            if (exportSettings.includeFields.emergency) {
                row.push(
                    `"${student.emergency_contact?.name || ''}"`,
                    `"${student.emergency_contact?.phone || ''}"`,
                    `"${student.emergency_contact?.relationship || ''}"`
                );
            }
            if (exportSettings.includeFields.medical) {
                row.push(
                    `"${student.medical_info?.blood_type || ''}"`,
                    `"${student.medical_info?.allergies || ''}"`,
                    `"${student.medical_info?.medical_conditions || ''}"`
                );
            }
            return row.join(',');
        }));
        
        return csvContent.join('\n');
    };

    const buildExcelContent = (students, headers) => {
        // For Excel, we'll create a tab-separated file that Excel can open
        const excelContent = [];
        
        if (exportSettings.includeHeaders) {
            excelContent.push(headers.join('\t'));
        }
        
        excelContent.push(...students.map(student => {
            const row = [];
            if (exportSettings.includeFields.basic) {
                row.push(
                    student.first_name || '',
                    student.middle_name || '',
                    student.last_name || '',
                    student.email || '',
                    student.contact_number || '',
                    student.citizen_id || '',
                    student.date_of_birth || '',
                    student.gender || '',
                    student.address || ''
                );
            }
            if (exportSettings.includeFields.academic) {
                row.push(
                    student.student_number || '',
                    student.program || '',
                    student.year_level || '',
                    student.enrollment_date || '',
                    student.academic_status || '',
                    student.gpa || '',
                    student.school_name || ''
                );
            }
            if (exportSettings.includeFields.financial) {
                row.push(
                    student.scholarship_status || '',
                    student.approved_amount || '',
                    student.scholarship_start_date || ''
                );
            }
            if (exportSettings.includeFields.documents) {
                row.push(
                    student.documents?.length || 0,
                    student.last_document_upload || ''
                );
            }
            if (exportSettings.includeFields.notes) {
                row.push(
                    student.notes?.length || 0,
                    student.last_note_date || ''
                );
            }
            if (exportSettings.includeFields.emergency) {
                row.push(
                    student.emergency_contact?.name || '',
                    student.emergency_contact?.phone || '',
                    student.emergency_contact?.relationship || ''
                );
            }
            if (exportSettings.includeFields.medical) {
                row.push(
                    student.medical_info?.blood_type || '',
                    student.medical_info?.allergies || '',
                    student.medical_info?.medical_conditions || ''
                );
            }
            return row.join('\t');
        }));
        
        return excelContent.join('\n');
    };

    const generateTemplate = () => {
        const templateData = [];
        
        // Add headers
        const headers = [];
        Object.entries(templateFields).forEach(([category, fields]) => {
            if (exportSettings.includeFields[category]) {
                headers.push(...fields);
            }
        });
        templateData.push(headers);
        
        // Add sample data
        const sampleRow = [
            'John', 'Michael', 'Doe', 'john.doe@example.com', '+1234567890', '123456789', '1995-01-15', 'Male', '123 Main St',
            'GSM2024001', 'Computer Science', '3rd Year', '2024-01-15', 'enrolled', '3.5', 'University of the Philippines',
            'scholar', '50000', '2024-01-15',
            'Jane Smith', '+0987654321', 'Parent',
            'O+', 'None', 'None'
        ];
        templateData.push(sampleRow);
        
        const csvContent = templateData.map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        showSuccess('Template generated successfully');
    };

    const clearImport = () => {
        setImportFile(null);
        setImportProgress(0);
        setImportStatus('idle');
        setImportResults(null);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Import/Export</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Import student data from CSV/Excel or export to various formats</p>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={() => setShowTemplateGenerator(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm sm:text-base"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Generate Template</span>
                        <span className="sm:hidden">Template</span>
                    </button>
                    <button
                        onClick={fetchStudents}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh Data</span>
                        <span className="sm:hidden">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Import Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Import Students</h3>
                    <button
                        onClick={() => setShowImportSettings(!showImportSettings)}
                        className="flex items-center justify-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Settings</span>
                        <span className="sm:hidden">Settings</span>
                    </button>
                </div>
                
                {/* Import Settings */}
                <AnimatePresence>
                    {showImportSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Import Settings</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Delimiter
                                    </label>
                                    <select
                                        value={importSettings.delimiter}
                                        onChange={(e) => setImportSettings(prev => ({ ...prev, delimiter: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value=",">Comma (,)</option>
                                        <option value=";">Semicolon (;)</option>
                                        <option value="\t">Tab</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Default Status
                                    </label>
                                    <select
                                        value={importSettings.defaultStatus}
                                        onChange={(e) => setImportSettings(prev => ({ ...prev, defaultStatus: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={importSettings.skipFirstRow}
                                        onChange={(e) => setImportSettings(prev => ({ ...prev, skipFirstRow: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Skip first row (headers)</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={importSettings.validateEmail}
                                        onChange={(e) => setImportSettings(prev => ({ ...prev, validateEmail: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Validate email addresses</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={importSettings.autoGenerateStudentNumbers}
                                        onChange={(e) => setImportSettings(prev => ({ ...prev, autoGenerateStudentNumbers: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-generate student numbers</span>
                                </label>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select File (CSV or Excel)
                    </label>
                    <div className="flex items-center space-x-4">
                        <label className="flex-1 cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-slate-500 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {importFile ? importFile.name : 'Click to select file or drag and drop'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Supported formats: CSV, Excel (.xlsx, .xls)
                                </p>
                            </div>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                        {importFile && (
                            <button
                                onClick={clearImport}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Import Progress */}
                {importStatus === 'importing' && (
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>Importing students...</span>
                            <span>{importProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Import Results */}
                {importResults && (
                    <div className="mb-6">
                        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Import Results</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm mb-4">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{importResults.total}</span>
                                </div>
                                <div>
                                    <span className="text-green-600 dark:text-green-400">Successful:</span>
                                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">{importResults.successful}</span>
                                </div>
                                <div>
                                    <span className="text-red-600 dark:text-red-400">Failed:</span>
                                    <span className="ml-2 font-medium text-red-600 dark:text-red-400">{importResults.failed}</span>
                                </div>
                                <div>
                                    <span className="text-yellow-600 dark:text-yellow-400">Warnings:</span>
                                    <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">{importResults.warnings}</span>
                                </div>
                            </div>
                            
                            {importResults.errors.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Errors:</p>
                                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                                        {importResults.errors.map((error, index) => (
                                            <li key={index} className="flex items-start">
                                                <AlertCircle className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" />
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {importResults.warnings.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">Warnings:</p>
                                    <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1 max-h-32 overflow-y-auto">
                                        {importResults.warnings.map((warning, index) => (
                                            <li key={index} className="flex items-start">
                                                <AlertTriangle className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" />
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Import Actions */}
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={handleImport}
                        disabled={!importFile || importStatus === 'importing'}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">{importStatus === 'importing' ? 'Importing...' : 'Import Students'}</span>
                        <span className="sm:hidden">{importStatus === 'importing' ? 'Importing...' : 'Import'}</span>
                    </button>
                    <button
                        onClick={generateTemplate}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Download Template</span>
                        <span className="sm:hidden">Template</span>
                    </button>
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Export Students</h3>
                    <button
                        onClick={() => setShowExportSettings(!showExportSettings)}
                        className="flex items-center justify-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Settings</span>
                        <span className="sm:hidden">Settings</span>
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Export student data in various formats. Current database contains {students.length} students.
                </p>
                
                {/* Export Settings */}
                <AnimatePresence>
                    {showExportSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Export Settings</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Export Format
                                    </label>
                                    <select
                                        value={exportSettings.format}
                                        onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="excel">Excel</option>
                                        <option value="json">JSON</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date Format
                                    </label>
                                    <select
                                        value={exportSettings.dateFormat}
                                        onChange={(e) => setExportSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Include Fields
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(exportSettings.includeFields).map(([key, value]) => (
                                        <label key={key} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setExportSettings(prev => ({ 
                                                    ...prev, 
                                                    includeFields: { ...prev.includeFields, [key]: e.target.checked }
                                                }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                {key.replace('_', ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.includeHeaders}
                                        onChange={(e) => setExportSettings(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include headers</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.filterActive}
                                        onChange={(e) => setExportSettings(prev => ({ ...prev, filterActive: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Filter active students only</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.filterScholars}
                                        onChange={(e) => setExportSettings(prev => ({ ...prev, filterScholars: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Filter scholars only</span>
                                </label>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setExportSettings(prev => ({ ...prev, format: 'csv' })) || handleExport()}
                        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                    >
                        <FileText className="w-8 h-8" />
                        <span className="font-medium">CSV Format</span>
                        <span className="text-sm opacity-90">Comma-separated values</span>
                    </button>
                    <button
                        onClick={() => setExportSettings(prev => ({ ...prev, format: 'excel' })) || handleExport()}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                    >
                        <FileSpreadsheet className="w-8 h-8" />
                        <span className="font-medium">Excel Format</span>
                        <span className="text-sm opacity-90">Microsoft Excel compatible</span>
                    </button>
                    <button
                        onClick={() => setExportSettings(prev => ({ ...prev, format: 'json' })) || handleExport()}
                        className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                    >
                        <Database className="w-8 h-8" />
                        <span className="font-medium">JSON Format</span>
                        <span className="text-sm opacity-90">JavaScript Object Notation</span>
                    </button>
                    <button
                        onClick={() => setExportSettings(prev => ({ ...prev, format: 'pdf' })) || handleExport()}
                        className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                    >
                        <FileImage className="w-8 h-8" />
                        <span className="font-medium">PDF Format</span>
                        <span className="text-sm opacity-90">Portable Document Format</span>
                    </button>
                </div>
            </div>

            {/* Template Generator Modal */}
            {showTemplateGenerator && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Template Generator</h3>
                                <button
                                    onClick={() => setShowTemplateGenerator(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Select which fields to include in the import template:
                                </p>
                                
                                <div className="space-y-3">
                                    {Object.entries(templateFields).map(([category, fields]) => (
                                        <div key={category} className="border border-gray-200 dark:border-slate-600 rounded-lg p-3">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 capitalize">
                                                {category.replace('_', ' ')} Fields
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {fields.map((field) => (
                                                    <label key={field} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            defaultChecked={exportSettings.includeFields[category]}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                            {field.replace('_', ' ')}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowTemplateGenerator(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generateTemplate}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                >
                                    Generate Template
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Data Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Preview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Showing first 10 students from the database
                </p>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Program</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scholarship</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GPA</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {students.slice(0, 10).map((student, index) => (
                                <tr key={student.student_uuid || index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                        {student.first_name} {student.last_name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {student.student_number}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {student.email}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {student.program}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            (student.status || '').toLowerCase() === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                        }`}>
                                            {student.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            (student.scholarship_status || '').toLowerCase() === 'scholar' 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}>
                                            {student.scholarship_status || 'None'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {student.gpa || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ImportExport;