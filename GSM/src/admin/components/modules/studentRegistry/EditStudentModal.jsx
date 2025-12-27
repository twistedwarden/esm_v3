import React, { useEffect, useState } from 'react';
import { 
  X, 
  Save, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  User, 
  GraduationCap, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import studentApiService from '../../../../services/studentApiService';

function EditStudentModal({ isOpen, onClose, student, onUpdated }) {
    const { showSuccess, showError } = useToastContext();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Basic Information
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        contact_number: '',
        citizen_id: '',
        date_of_birth: '',
        gender: '',
        address: '',
        
        // Academic Information
        current_school_id: '',
        year_level: '',
        program: '',
        enrollment_date: '',
        academic_status: 'enrolled',
        gpa: '',
        
        // Scholarship Information
        scholarship_status: 'none',
        current_scholarship_id: '',
        approved_amount: '',
        scholarship_start_date: '',
        
        // Additional Information
        emergency_contact: {
            name: '',
            relationship: '',
            phone: '',
            email: ''
        },
        medical_info: {
            blood_type: '',
            allergies: '',
            medical_conditions: ''
        }
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const steps = [
        { id: 1, title: 'Basic Information', icon: User, description: 'Personal details and contact information' },
        { id: 2, title: 'Academic Information', icon: GraduationCap, description: 'Program, year level, and academic status' },
        { id: 3, title: 'Contact & Emergency', icon: Phone, description: 'Contact details and emergency information' }
    ];

    useEffect(() => {
        if (!isOpen || !student) return;
        
        // Prefill form with student data
        const preload = {
            first_name: student.first_name || '',
            middle_name: student.middle_name || '',
            last_name: student.last_name || '',
            email: student.email || '',
            contact_number: student.contact_number || '',
            citizen_id: student.citizen_id || '',
            date_of_birth: student.date_of_birth || '',
            gender: student.gender || '',
            address: student.address || '',
            current_school_id: student.current_school_id || '',
            year_level: student.year_level || '',
            program: student.program || '',
            enrollment_date: student.enrollment_date || '',
            academic_status: student.academic_status || 'enrolled',
            gpa: student.gpa || '',
            scholarship_status: student.scholarship_status || 'none',
            current_scholarship_id: student.current_scholarship_id || '',
            approved_amount: student.approved_amount || '',
            scholarship_start_date: student.scholarship_start_date || '',
            emergency_contact: student.emergency_contact || { name: '', relationship: '', phone: '', email: '' },
            medical_info: student.medical_info || { blood_type: '', allergies: '', medical_conditions: '' }
        };
        setFormData(preload);
        setErrors({});
        setCurrentStep(1);
        setDraftSaved(false);
    }, [isOpen, student]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        
        // Clear validation errors
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        
        switch (step) {
            case 1:
                if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
                if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
                if (!formData.email.trim()) newErrors.email = 'Email is required';
                else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
                if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
                if (!formData.citizen_id.trim()) newErrors.citizen_id = 'Citizen ID is required';
                break;
            case 2:
                if (!formData.program.trim()) newErrors.program = 'Program is required';
                if (!formData.year_level.trim()) newErrors.year_level = 'Year level is required';
                if (!formData.enrollment_date.trim()) newErrors.enrollment_date = 'Enrollment date is required';
                if (formData.gpa && (isNaN(formData.gpa) || formData.gpa < 0 || formData.gpa > 4)) {
                    newErrors.gpa = 'GPA must be between 0 and 4';
                }
                break;
            case 3:
                if (!formData.emergency_contact.name.trim()) newErrors['emergency_contact.name'] = 'Emergency contact name is required';
                if (!formData.emergency_contact.phone.trim()) newErrors['emergency_contact.phone'] = 'Emergency contact phone is required';
                break;
        }
        
        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const saveDraft = async () => {
        try {
            // Save draft to localStorage
            const draftKey = `student_draft_${student?.student_uuid || 'new'}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 3000);
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    };

    const loadDraft = () => {
        try {
            const draftKey = `student_draft_${student?.student_uuid || 'new'}`;
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                setFormData(JSON.parse(draft));
                showSuccess('Draft loaded successfully');
            }
        } catch (error) {
            console.error('Error loading draft:', error);
            showError('Failed to load draft');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!student?.student_uuid) return;
        
        // Validate all steps
        let isValid = true;
        for (let i = 1; i <= steps.length; i++) {
            if (!validateStep(i)) {
                isValid = false;
            }
        }
        
        if (!isValid) {
            showError('Please fix all validation errors before submitting');
            return;
        }
        
        setShowConfirmation(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmation(false);
        setLoading(true);
        try {
            // Clean up form data
            const payload = {
                ...formData,
                gpa: formData.gpa ? parseFloat(formData.gpa) : null,
                approved_amount: formData.approved_amount ? parseFloat(formData.approved_amount) : null
            };

            await studentApiService.updateStudent(student.student_uuid, payload);
            
            // Clear draft
            const draftKey = `student_draft_${student.student_uuid}`;
            localStorage.removeItem(draftKey);
            
            showSuccess('Student updated successfully');
            onUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating student:', error);
            showError('Failed to update student');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter first name"
                                />
                                {validationErrors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.first_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter middle name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter last name"
                                />
                                {validationErrors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.last_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Student Number
                                </label>
                                <input
                                    type="text"
                                    name="student_number"
                                    value={formData.student_number}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter student number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter email address"
                                />
                                {validationErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Contact Number *
                                </label>
                                <input
                                    type="tel"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.contact_number ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter contact number"
                                />
                                {validationErrors.contact_number && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.contact_number}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Citizen ID *
                                </label>
                                <input
                                    type="text"
                                    name="citizen_id"
                                    value={formData.citizen_id}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.citizen_id ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter citizen ID"
                                />
                                {validationErrors.citizen_id && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.citizen_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter address"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Program *
                                </label>
                                <select
                                    name="program"
                                    value={formData.program}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.program ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                >
                                    <option value="">Select program</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Business Administration">Business Administration</option>
                                    <option value="Medicine">Medicine</option>
                                    <option value="Nursing">Nursing</option>
                                    <option value="Education">Education</option>
                                    <option value="Psychology">Psychology</option>
                                    <option value="Hospitality Management">Hospitality Management</option>
                                </select>
                                {validationErrors.program && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.program}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Year Level *
                                </label>
                                <select
                                    name="year_level"
                                    value={formData.year_level}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.year_level ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                >
                                    <option value="">Select year level</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                    <option value="5th Year">5th Year</option>
                                </select>
                                {validationErrors.year_level && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.year_level}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Enrollment Date *
                                </label>
                                <input
                                    type="date"
                                    name="enrollment_date"
                                    value={formData.enrollment_date}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.enrollment_date ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                />
                                {validationErrors.enrollment_date && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.enrollment_date}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Academic Status
                                </label>
                                <select
                                    name="academic_status"
                                    value={formData.academic_status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="enrolled">Enrolled</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="dropped">Dropped</option>
                                    <option value="transferred">Transferred</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    GPA
                                </label>
                                <input
                                    type="number"
                                    name="gpa"
                                    value={formData.gpa}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="4"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                        validationErrors.gpa ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                    placeholder="Enter GPA (0-4)"
                                />
                                {validationErrors.gpa && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.gpa}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Scholarship Status
                                </label>
                                <select
                                    name="scholarship_status"
                                    value={formData.scholarship_status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="none">None</option>
                                    <option value="applicant">Applicant</option>
                                    <option value="scholar">Scholar</option>
                                    <option value="alumni">Alumni</option>
                                </select>
                            </div>
                        </div>

                        {formData.scholarship_status === 'scholar' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Approved Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="approved_amount"
                                        value={formData.approved_amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter approved amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Scholarship Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="scholarship_start_date"
                                        value={formData.scholarship_start_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Emergency Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Contact Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="emergency_contact.name"
                                        value={formData.emergency_contact.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                            validationErrors['emergency_contact.name'] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                        }`}
                                        placeholder="Enter emergency contact name"
                                    />
                                    {validationErrors['emergency_contact.name'] && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors['emergency_contact.name']}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Relationship
                                    </label>
                                    <select
                                        name="emergency_contact.relationship"
                                        value={formData.emergency_contact.relationship}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="">Select relationship</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Guardian">Guardian</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Contact Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="emergency_contact.phone"
                                        value={formData.emergency_contact.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white ${
                                            validationErrors['emergency_contact.phone'] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                                        }`}
                                        placeholder="Enter emergency contact phone"
                                    />
                                    {validationErrors['emergency_contact.phone'] && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors['emergency_contact.phone']}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        name="emergency_contact.email"
                                        value={formData.emergency_contact.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter emergency contact email"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Medical Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Blood Type
                                    </label>
                                    <select
                                        name="medical_info.blood_type"
                                        value={formData.medical_info.blood_type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="">Select blood type</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Allergies
                                    </label>
                                    <input
                                        type="text"
                                        name="medical_info.allergies"
                                        value={formData.medical_info.allergies}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter allergies (if any)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Medical Conditions
                                    </label>
                                    <input
                                        type="text"
                                        name="medical_info.medical_conditions"
                                        value={formData.medical_info.medical_conditions}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-700 dark:text-white"
                                        placeholder="Enter medical conditions (if any)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
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
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Student</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {student ? `${student.first_name} ${student.last_name}` : 'Loading...'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={saveDraft}
                                className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm"
                            >
                                Save Draft
                            </button>
                            <button
                                onClick={loadDraft}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                            >
                                Load Draft
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                        currentStep >= step.id
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                                    }`}>
                                        {currentStep > step.id ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <step.icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${
                                            currentStep >= step.id
                                                ? 'text-orange-600 dark:text-orange-400'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {step.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {step.description}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-16 h-0.5 mx-4 ${
                                            currentStep > step.id ? 'bg-orange-500' : 'bg-gray-300 dark:bg-slate-600'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {draftSaved && (
                                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Draft saved</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Previous</span>
                                </button>
                            )}
                            {currentStep < steps.length ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    <span>Next</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Update Student</h3>
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Are you sure you want to update the information for <strong>{formData.first_name} {formData.last_name}</strong>?
                                    </p>
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Updated Details:</p>
                                        <p className="text-sm text-gray-900 dark:text-white">Email: {formData.email}</p>
                                        {formData.program && <p className="text-sm text-gray-900 dark:text-white">Program: {formData.program}</p>}
                                        {formData.year_level && <p className="text-sm text-gray-900 dark:text-white">Year Level: {formData.year_level}</p>}
                                        {formData.scholarship_status && <p className="text-sm text-gray-900 dark:text-white">Scholarship: {formData.scholarship_status}</p>}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmSubmit}
                                        disabled={loading}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default EditStudentModal;