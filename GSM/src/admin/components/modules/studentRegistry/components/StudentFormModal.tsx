import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import studentApiService from '../../../../../services/studentApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, initialData, onSuccess }) => {
    const { showSuccess, showError } = useToastContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        contact_number: '',
        student_number: '',
        program: '',
        year_level: '1st Year',
        school_name: '',
        scholarship_status: 'none',
        // Add other fields as needed
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                first_name: initialData.first_name || '',
                middle_name: initialData.middle_name || '',
                last_name: initialData.last_name || '',
                email: initialData.email || '',
                contact_number: initialData.contact_number || '',
                student_number: initialData.student_number || initialData.student_id_number || '',
                program: initialData.program || initialData.course || '',
                year_level: initialData.year_level || '1st Year',
                school_name: initialData.school_name || '',
                scholarship_status: initialData.scholarship_status || 'none',
            });
        } else {
            setFormData({
                first_name: '',
                middle_name: '',
                last_name: '',
                email: '',
                contact_number: '',
                student_number: '',
                program: '',
                year_level: '1st Year',
                school_name: '',
                scholarship_status: 'none',
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.student_uuid) {
                await studentApiService.updateStudent(initialData.student_uuid, formData);
                showSuccess('Student updated successfully');
            } else {
                await studentApiService.createStudent(formData);
                showSuccess('Student created successfully');
            }
            onSuccess();
            onClose();
        } catch (error) {
            showError(initialData ? 'Failed to update student' : 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                                    <input
                                        required
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Middle Name</label>
                                    <input
                                        name="middle_name"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                                    <input
                                        required
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                                    <input
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID *</label>
                                    <input
                                        required
                                        name="student_number"
                                        value={formData.student_number}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
                                    <input
                                        name="school_name"
                                        value={formData.school_name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program</label>
                                    <input
                                        name="program"
                                        value={formData.program}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level</label>
                                    <select
                                        name="year_level"
                                        value={formData.year_level}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    >
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="5th Year">5th Year</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scholarship Status</label>
                                <select
                                    name="scholarship_status"
                                    value={formData.scholarship_status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                >
                                    <option value="none">None</option>
                                    <option value="applicant">Applicant</option>
                                    <option value="scholar">Scholar</option>
                                    <option value="alumni">Alumni</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {initialData ? 'Update Student' : 'Create Student'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentFormModal;
