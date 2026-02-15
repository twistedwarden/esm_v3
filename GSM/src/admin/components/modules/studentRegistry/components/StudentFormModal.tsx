import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, School, Hash, Check, AlertCircle } from 'lucide-react';
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
    const { success: showSuccess, error: showError } = useToastContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
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
        setErrors({}); // Clear errors when modal opens or initialData changes
    }, [initialData, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({}); // Clear previous errors

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
        } catch (error: any) {
            console.error('Submit error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showError(initialData ? 'Failed to update student' : 'Failed to create student');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-slate-700"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                            {initialData ? 'Edit Student Profile' : 'New Student Registration'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            {initialData ? 'Update student information and records' : 'Enter the student\'s personal and academic details'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <User className="w-5 h-5 text-blue-500" />
                                </div>
                                <h4 className="font-semibold">Personal Information</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="first_name"
                                            placeholder="e.g. Juan"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 ${errors.first_name
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'border-gray-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                                                }`}
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.first_name && (
                                        <p className="text-xs text-red-500 pl-1">{errors.first_name}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="last_name"
                                            placeholder="e.g. Dela Cruz"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 ${errors.last_name
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'border-gray-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                                                }`}
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.last_name && (
                                        <p className="text-xs text-red-500 pl-1">{errors.last_name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="e.g. juan.delacruz@email.com"
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 ${errors.email
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'border-gray-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                                                }`}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-xs text-red-500 pl-1">{errors.email}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Academic Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-700">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <School className="w-5 h-5 text-green-500" />
                                </div>
                                <h4 className="font-semibold">Academic Information</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student ID */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Student ID Number
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="student_number"
                                            placeholder="e.g. 2023-0001"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                            value={formData.student_number}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Scholarship Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="scholarship_status"
                                            className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 appearance-none"
                                            value={formData.scholarship_status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="none">None</option>
                                            <option value="applicant">Applicant</option>
                                            <option value="scholar">Scholar</option>
                                            <option value="alumni">Alumni</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Error */}
                        {errors.submit && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{errors.submit}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving Student...</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                <span>{initialData ? 'Update Profile' : 'Register Student'}</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default StudentFormModal;
