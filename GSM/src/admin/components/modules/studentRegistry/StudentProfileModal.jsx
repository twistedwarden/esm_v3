import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  GraduationCap, 
  DollarSign, 
  FileText, 
  Activity,
  Edit,
  Download,
  Upload,
  Plus,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import studentApiService from '../../../../services/studentApiService';

const StudentProfileModal = ({ isOpen, onClose, studentUuid, onEdit }) => {
  const { showSuccess, showError } = useToastContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicHistory, setAcademicHistory] = useState([]);
  const [financialHistory, setFinancialHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'scholarship', label: 'Scholarship', icon: Award },
    { id: 'financial', label: 'Financial Aid', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity Log', icon: Activity }
  ];

  useEffect(() => {
    if (isOpen && studentUuid) {
      fetchStudentData();
    }
  }, [isOpen, studentUuid]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentData, academicData, financialData, documentsData] = await Promise.all([
        studentApiService.getStudentByUUID(studentUuid),
        studentApiService.getStudentAcademicHistory(studentUuid),
        studentApiService.getStudentFinancialHistory(studentUuid),
        // Note: Documents API would need to be implemented
        Promise.resolve({ data: [] })
      ]);

      setStudent(studentData.data);
      setAcademicHistory(academicData.data || []);
      setFinancialHistory(financialData.data || []);
      setDocuments(documentsData.data || []);
      setNotes(studentData.data?.notes || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      showError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await studentApiService.addStudentNote(studentUuid, newNote);
      setNotes(prev => [...prev, {
        id: Date.now(),
        note: newNote,
        created_by: 'Current User',
        created_at: new Date().toISOString()
      }]);
      setNewNote('');
      showSuccess('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      showError('Failed to add note');
    }
  };

  const handleDocumentUpload = async (file, type) => {
    setUploadingDocument(true);
    try {
      await studentApiService.uploadStudentDocument(studentUuid, file, type);
      showSuccess('Document uploaded successfully');
      fetchStudentData(); // Refresh data
    } catch (error) {
      console.error('Error uploading document:', error);
      showError('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Show modal when open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {student ? `${student.first_name} ${student.last_name}` : 'Loading...'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {student?.student_number || 'Student Number'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(student)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{student?.email}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{student?.contact_number}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{student?.citizen_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{student?.program}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{student?.year_level}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              Enrolled: {formatDate(student?.enrollment_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student?.status)}`}>
                              {student?.status?.toUpperCase()}
                            </span>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Scholarship</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScholarshipStatusColor(student?.scholarship_status)}`}>
                              {student?.scholarship_status?.toUpperCase()}
                            </span>
                          </div>
                          <Award className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">GPA</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{student?.gpa || 'N/A'}</p>
                          </div>
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Records</h3>
                      <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Add Record</span>
                      </button>
                    </div>

                    {academicHistory.length > 0 ? (
                      <div className="space-y-4">
                        {academicHistory.map((record, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {record.semester} {record.year}
                              </h4>
                              <span className="text-sm text-gray-500 dark:text-gray-400">GPA: {record.gpa}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {record.subjects?.map((subject, subIndex) => (
                                <div key={subIndex} className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{subject.name}</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{subject.grade}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No academic records found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'scholarship' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scholarship Information</h3>
                    
                    {student?.scholarship_status === 'scholar' ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Award className="w-6 h-6 text-blue-600" />
                          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Current Scholarship</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Approved Amount</p>
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                              ₱{student?.approved_amount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Start Date</p>
                            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                              {formatDate(student?.scholarship_start_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No active scholarship</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'financial' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Aid History</h3>
                    
                    {financialHistory.length > 0 ? (
                      <div className="space-y-4">
                        {financialHistory.map((record, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white capitalize">{record.type}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(record.date)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  ₱{record.amount?.toLocaleString()}
                                </p>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  record.status === 'disbursed' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                                }`}>
                                  {record.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No financial aid records found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="document-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleDocumentUpload(file, 'academic');
                            }
                          }}
                        />
                        <label
                          htmlFor="document-upload"
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </label>
                      </div>
                    </div>

                    {documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div className="flex items-center space-x-1">
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{doc.filename}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(doc.uploaded_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No documents uploaded</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h3>
                    
                    {/* Add Note Section */}
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add Note</h4>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note about this student..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          onClick={handleAddNote}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                      {notes.map((note, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-gray-900 dark:text-white">{note.note}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {note.created_by}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentProfileModal;
