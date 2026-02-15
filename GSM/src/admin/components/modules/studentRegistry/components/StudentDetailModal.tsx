import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, User, GraduationCap, PhilippinePeso, FileText, Activity,
    Edit, Plus, Calendar,
    MapPin, Phone, Mail, Award,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../../components/providers/ToastProvider';
import studentApiService from '../../../../../services/studentApiService';

interface StudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentUuid: string | number | null;
    onEdit: (student: any) => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, studentUuid, onEdit }) => {
    const { success: showSuccess, error: showError } = useToastContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [academicHistory, setAcademicHistory] = useState<any[]>([]);
    const [financialHistory, setFinancialHistory] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'academic', label: 'Academic', icon: GraduationCap },
        { id: 'scholarship', label: 'Scholarship', icon: Award },
        { id: 'financial', label: 'Financial Aid', icon: PhilippinePeso },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'activity', label: 'Activity', icon: Activity }
    ];

    useEffect(() => {
        if (isOpen && studentUuid) {
            fetchStudentData();
        }
    }, [isOpen, studentUuid]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for efficiency
            const [studentData, academicData, financialData, notesData] = await Promise.all([
                studentApiService.getStudentByUUID(String(studentUuid!)),
                studentApiService.getStudentAcademicHistory(String(studentUuid!)),
                studentApiService.getStudentFinancialHistory(String(studentUuid!)),
                studentApiService.getStudentNotes(String(studentUuid!))
            ]);

            setStudent((studentData as any).data);
            setAcademicHistory((academicData as any).data || []);
            setFinancialHistory((financialData as any).data || []);
            setNotes((notesData as any).data || []);

            // Mock documents for now as the API might not be fully ready or empty
            setDocuments([]);
        } catch (error) {
            console.error('Error fetching student data:', error);
            showError('Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !studentUuid) return;
        try {
            await studentApiService.addStudentNote(String(studentUuid), newNote);
            setNotes(prev => [...prev, {
                id: Date.now(),
                note: newNote,
                created_by: 'Me', // Should be current user
                created_at: new Date().toISOString()
            }]);
            setNewNote('');
            showSuccess('Note added');
        } catch (error) {
            showError('Failed to add note');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {student ? `${student.first_name} ${student.last_name}` : 'Loading...'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                {student?.student_number || student?.student_id_number || 'ID: N/A'} • {student?.program || student?.course || 'Program N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onEdit(student)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Edit Profile</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 border-r border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 p-4 space-y-1 overflow-y-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 dark:bg-slate-900/30">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="max-w-3xl"
                                >
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Info</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                            <span>{student?.email}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <span>{student?.contact_number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                                            <MapPin className="w-4 h-4 text-gray-400" />
                                                            <span>{student?.address || 'No address provided'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Status</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">Enrollment Status</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${student?.status === 'active'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {student?.status?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 dark:text-gray-400">Scholarship</span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${student?.scholarship_status === 'scholar'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {student?.scholarship_status?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'academic' && (
                                        <div className="space-y-6">
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Academic Records</h3>
                                                {academicHistory.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {academicHistory.map((record, i) => (
                                                            <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                                                <div className="flex justify-between mb-2">
                                                                    <span className="font-semibold text-gray-900 dark:text-white">{record.semester} {record.year}</span>
                                                                    <span className="font-medium text-blue-600">GPA: {record.gpa}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic">No academic records found.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'activity' && (
                                        <div className="space-y-6">
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes & Activity</h3>
                                                <div className="flex gap-2 mb-6">
                                                    <input
                                                        type="text"
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        placeholder="Add a note..."
                                                        className="flex-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                                    />
                                                    <button
                                                        onClick={handleAddNote}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    {notes.map((note, i) => (
                                                        <div key={i} className="flex gap-4">
                                                            <div className="mt-1">
                                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-800 dark:text-gray-200">{note.note}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(note.created_at).toLocaleString()} • {note.created_by}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Placeholders for other tabs */}
                                    {(activeTab === 'scholarship' || activeTab === 'financial' || activeTab === 'documents') && (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                            <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                                                {activeTab === 'scholarship' && <Award className="w-8 h-8" />}
                                                {activeTab === 'financial' && <PhilippinePeso className="w-8 h-8" />}
                                                {activeTab === 'documents' && <FileText className="w-8 h-8" />}
                                            </div>
                                            <p>No {activeTab} information available yet.</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default StudentDetailModal;
