import React, { useState, useEffect } from 'react';

import { Users, UserPlus, Search, Filter, Edit, Trash2, Shield, UserCheck, UserX, Eye, EyeOff, Lock, Mail, Phone, MapPin, Calendar, User, Building, Briefcase, AlertCircle, CheckCircle, XCircle, School, MoreVertical } from 'lucide-react';

import axios from 'axios';

import UserActionModal from './UserActionModal';

import { useToastContext } from '../../../../components/providers/ToastProvider';

import { LoadingUsers } from '../../ui/LoadingSpinner';

import { getScholarshipServiceUrl, API_CONFIG } from '../../../../config/api';

const SCHOLARSHIP_API = getScholarshipServiceUrl('/api');



const UserManagement = () => {

    const [users, setUsers] = useState({

        citizens: [],

        staff: [],

        admins: [],

        ps_reps: [],

        ssc: [],

        ssc_chairperson: [],

        ssc_city_council: [],

        ssc_budget_dept: [],

        ssc_education_affairs: [],

        ssc_hrd: [],

        ssc_social_services: [],

        ssc_accounting: [],

        ssc_treasurer: [],

        ssc_qcydo: [],

        ssc_planning_dept: [],

        ssc_schools_division: [],

        ssc_qcu: []

    });

    const [filteredUsers, setFilteredUsers] = useState([]);

    const [selectedRole, setSelectedRole] = useState('all');

    const [selectedStatus, setSelectedStatus] = useState('all');

    const [searchTerm, setSearchTerm] = useState('');

    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);

    const [stats, setStats] = useState(null);



    const [formData, setFormData] = useState({

        citizen_id: '',

        email: '',

        password: '',

        password_confirmation: '',

        first_name: '',

        last_name: '',

        middle_name: '',

        extension_name: '',

        mobile: '',

        birthdate: '',

        address: '',

        house_number: '',

        street: '',

        barangay: '',

        role: 'citizen',

        system_role: 'coordinator',

        department: '',

        position: '',

        assigned_school_id: '',

    });

    const [generatedId, setGeneratedId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formErrors, setFormErrors] = useState({});

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [schools, setSchools] = useState([]);

    const [schoolSearchTerm, setSchoolSearchTerm] = useState('');

    const [filteredSchools, setFilteredSchools] = useState([]);

    

    // Modal and Toast states

    const [showActionModal, setShowActionModal] = useState(false);

    const [selectedActionUser, setSelectedActionUser] = useState(null);

    const [isActionLoading, setIsActionLoading] = useState(false);

    // Use global toast context

    const { showSuccess, showError, showWarning } = useToastContext();

    

    // Check if a role is selected to enable/disable form fields

    const isRoleSelected = formData.role && formData.role !== '';

    

    // Helper function to get disabled state and styling for form fields

    const getFieldProps = () => ({

        disabled: !isRoleSelected,

        className: (baseClass, errorClass = '') => `${baseClass} ${errorClass} ${!isRoleSelected ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : ''}`

    });



    useEffect(() => {

        fetchUsers();

        fetchStats();

        fetchSchools();

    }, []);



    // Refetch users when status filter changes

    useEffect(() => {

        if (selectedStatus !== undefined) {

            fetchUsers();

        }

    }, [selectedStatus]);



    // Filter schools based on search term

    useEffect(() => {

        if (schoolSearchTerm) {

            const filtered = schools.filter(school =>

                school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||

                school.campus?.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||

                school.city?.toLowerCase().includes(schoolSearchTerm.toLowerCase())

            );

            setFilteredSchools(filtered);

        } else {

            setFilteredSchools(schools);

        }

    }, [schoolSearchTerm, schools]);



    useEffect(() => {

        filterUsers();

    }, [selectedRole, selectedStatus, searchTerm, users]);



    // Auto-generate ID when role changes

    useEffect(() => {

        if (formData.role && showCreateModal) {

            generateNextId(formData.role);

        }

    }, [formData.role, showCreateModal, users]);



    const fetchUsers = async () => {

        setLoading(true);

        try {

            const params = {};

            if (selectedStatus !== 'all') {

                params.status = selectedStatus;

            }

            console.log('Fetching users from:', `${SCHOLARSHIP_API}/users`, 'with params:', params);

            const response = await axios.get(`${SCHOLARSHIP_API}/users`, { params });

            console.log('Users API response:', response.data);

            

            if (response.data.success) {

                let userData = response.data.data;

                

                // Check if data is already categorized or if it's a flat array

                if (Array.isArray(userData)) {

                    // Data is a flat array, categorize it

                    console.log('Data is flat array, categorizing...');

                    userData = {

                        citizens: userData.filter(user => user.role === 'citizen'),

                        staff: userData.filter(user => user.role === 'staff'),

                        admins: userData.filter(user => user.role === 'admin'),

                        ps_reps: userData.filter(user => user.role === 'ps_rep'),

                        ssc: userData.filter(user => user.role === 'ssc'),

                        ssc_chairperson: userData.filter(user => user.role === 'ssc_chairperson'),

                        ssc_city_council: userData.filter(user => user.role === 'ssc_city_council'),

                        ssc_budget_dept: userData.filter(user => user.role === 'ssc_budget_dept'),

                        ssc_education_affairs: userData.filter(user => user.role === 'ssc_education_affairs'),

                        ssc_hrd: userData.filter(user => user.role === 'ssc_hrd'),

                        ssc_social_services: userData.filter(user => user.role === 'ssc_social_services'),

                        ssc_accounting: userData.filter(user => user.role === 'ssc_accounting'),

                        ssc_treasurer: userData.filter(user => user.role === 'ssc_treasurer'),

                        ssc_qcydo: userData.filter(user => user.role === 'ssc_qcydo'),

                        ssc_planning_dept: userData.filter(user => user.role === 'ssc_planning_dept'),

                        ssc_schools_division: userData.filter(user => user.role === 'ssc_schools_division'),

                        ssc_qcu: userData.filter(user => user.role === 'ssc_qcu')

                    };

                } else {

                    // Data is already categorized, use as is

                    userData = userData || {

                        citizens: [],

                        staff: [],

                        admins: [],

                        ps_reps: [],

                        ssc: [],

                        ssc_chairperson: [],

                        ssc_city_council: [],

                        ssc_budget_dept: [],

                        ssc_education_affairs: [],

                        ssc_hrd: [],

                        ssc_social_services: [],

                        ssc_accounting: [],

                        ssc_treasurer: [],

                        ssc_qcydo: [],

                        ssc_planning_dept: [],

                        ssc_schools_division: [],

                        ssc_qcu: []

                    };

                }

                

                console.log('Setting users data:', userData);

                setUsers(userData);

            } else {

                console.error('Failed to fetch users:', response.data.message);

                setUsers({

                    citizens: [],

                    staff: [],

                    admins: [],

                    ps_reps: [],

                    ssc: [],

                    ssc_chairperson: [],

                    ssc_city_council: [],

                    ssc_budget_dept: [],

                    ssc_education_affairs: [],

                    ssc_hrd: [],

                    ssc_social_services: [],

                    ssc_accounting: [],

                    ssc_treasurer: [],

                    ssc_qcydo: [],

                    ssc_planning_dept: [],

                    ssc_schools_division: [],

                    ssc_qcu: []

                });

            }

        } catch (error) {

            console.warn('Users API not available, using empty data');

            setUsers({

                citizens: [],

                staff: [],

                admins: [],

                ps_reps: [],

                ssc: [],

                ssc_chairperson: [],

                ssc_city_council: [],

                ssc_budget_dept: [],

                ssc_education_affairs: [],

                ssc_hrd: [],

                ssc_social_services: [],

                ssc_accounting: [],

                ssc_treasurer: [],

                ssc_qcydo: [],

                ssc_planning_dept: [],

                ssc_schools_division: [],

                ssc_qcu: []

            });

        } finally {

            setLoading(false);

        }

    };



    const fetchStats = async () => {

        try {

            const response = await axios.get(`${SCHOLARSHIP_API}/users/stats`);

            if (response.data.success) {

                setStats(response.data.data);

            }

        } catch (error) {

            console.warn('Stats API not available, using empty data');

        }

    };



    const fetchSchools = async () => {

        try {

            const response = await fetch(`${SCHOLARSHIP_API}/schools?per_page=100`, {

                method: 'GET',

                headers: {

                    'Content-Type': 'application/json',

                    'Accept': 'application/json',

                },

            });



            if (!response.ok) {

                throw new Error(`HTTP error! status: ${response.status}`);

            }



            const data = await response.json();

            if (data.success) {

                setSchools(data.data.data || []);

            } else {

                throw new Error(data.message || 'Failed to fetch schools');

            }

        } catch (err) {

            console.warn('Schools API not available, using empty data');

        }

    };



    const filterUsers = () => {

        let allUsers = [];

        

        if (selectedRole === 'all') {

            allUsers = [

                ...(users.citizens || []).map(u => ({ ...u, roleType: 'Citizen' })),

                ...(users.staff || []).map(u => ({ ...u, roleType: 'Staff' })),

                ...(users.admins || []).map(u => ({ ...u, roleType: 'Admin' })),

                ...(users.ps_reps || []).map(u => ({ ...u, roleType: 'Partner School Rep' })),

                ...(users.ssc || []).map(u => ({ ...u, roleType: 'SSC - General' })),

                ...(users.ssc_chairperson || []).map(u => ({ ...u, roleType: 'SSC - Chairperson' })),

                ...(users.ssc_city_council || []).map(u => ({ ...u, roleType: 'SSC - City Council' })),

                ...(users.ssc_budget_dept || []).map(u => ({ ...u, roleType: 'SSC - Budget Department' })),

                ...(users.ssc_education_affairs || []).map(u => ({ ...u, roleType: 'SSC - Education Affairs' })),

                ...(users.ssc_hrd || []).map(u => ({ ...u, roleType: 'SSC - HRD' })),

                ...(users.ssc_social_services || []).map(u => ({ ...u, roleType: 'SSC - Social Services' })),

                ...(users.ssc_accounting || []).map(u => ({ ...u, roleType: 'SSC - Accounting' })),

                ...(users.ssc_treasurer || []).map(u => ({ ...u, roleType: 'SSC - Treasurer' })),

                ...(users.ssc_qcydo || []).map(u => ({ ...u, roleType: 'SSC - QCYDO' })),

                ...(users.ssc_planning_dept || []).map(u => ({ ...u, roleType: 'SSC - Planning Department' })),

                ...(users.ssc_schools_division || []).map(u => ({ ...u, roleType: 'SSC - Schools Division' })),

                ...(users.ssc_qcu || []).map(u => ({ ...u, roleType: 'SSC - QCU' }))

            ];

        } else if (selectedRole === 'citizen') {

            allUsers = (users.citizens || []).map(u => ({ ...u, roleType: 'Citizen' }));

        } else if (selectedRole === 'staff') {

            allUsers = (users.staff || []).map(u => ({ ...u, roleType: 'Staff' }));

        } else if (selectedRole === 'admin') {

            allUsers = (users.admins || []).map(u => ({ ...u, roleType: 'Admin' }));

        } else if (selectedRole === 'ps_rep') {

            allUsers = (users.ps_reps || []).map(u => ({ ...u, roleType: 'Partner School Rep' }));

        } else if (selectedRole === 'ssc') {

            allUsers = (users.ssc || []).map(u => ({ ...u, roleType: 'SSC - General' }));

        } else if (selectedRole === 'ssc_chairperson') {

            allUsers = (users.ssc_chairperson || []).map(u => ({ ...u, roleType: 'SSC - Chairperson' }));

        } else if (selectedRole === 'ssc_city_council') {

            allUsers = (users.ssc_city_council || []).map(u => ({ ...u, roleType: 'SSC - City Council' }));

        } else if (selectedRole === 'ssc_budget_dept') {

            allUsers = (users.ssc_budget_dept || []).map(u => ({ ...u, roleType: 'SSC - Budget Department' }));

        } else if (selectedRole === 'ssc_education_affairs') {

            allUsers = (users.ssc_education_affairs || []).map(u => ({ ...u, roleType: 'SSC - Education Affairs' }));

        } else if (selectedRole === 'ssc_hrd') {

            allUsers = (users.ssc_hrd || []).map(u => ({ ...u, roleType: 'SSC - HRD' }));

        } else if (selectedRole === 'ssc_social_services') {

            allUsers = (users.ssc_social_services || []).map(u => ({ ...u, roleType: 'SSC - Social Services' }));

        } else if (selectedRole === 'ssc_accounting') {

            allUsers = (users.ssc_accounting || []).map(u => ({ ...u, roleType: 'SSC - Accounting' }));

        } else if (selectedRole === 'ssc_treasurer') {

            allUsers = (users.ssc_treasurer || []).map(u => ({ ...u, roleType: 'SSC - Treasurer' }));

        } else if (selectedRole === 'ssc_qcydo') {

            allUsers = (users.ssc_qcydo || []).map(u => ({ ...u, roleType: 'SSC - QCYDO' }));

        } else if (selectedRole === 'ssc_planning_dept') {

            allUsers = (users.ssc_planning_dept || []).map(u => ({ ...u, roleType: 'SSC - Planning Department' }));

        } else if (selectedRole === 'ssc_schools_division') {

            allUsers = (users.ssc_schools_division || []).map(u => ({ ...u, roleType: 'SSC - Schools Division' }));

        } else if (selectedRole === 'ssc_qcu') {

            allUsers = (users.ssc_qcu || []).map(u => ({ ...u, roleType: 'SSC - QCU' }));

        }



        // Filter by search term

        if (searchTerm) {

            allUsers = allUsers.filter(user => 

                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||

                user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||

                user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||

                user.citizen_id?.toLowerCase().includes(searchTerm.toLowerCase())

            );

        }



        // Status filtering is now handled server-side in fetchUsers()



        setFilteredUsers(allUsers);

    };



    const handleCreateUser = async (e) => {

        e.preventDefault();

        

        if (!validateForm()) {

            return;

        }

        

        setIsSubmitting(true);

        try {

            // Sanitize and prepare form data

            const { password_confirmation, ...userData } = formData;

            // Clean up form data - remove empty strings and convert to appropriate types

            const sanitizedData = {

                ...userData,

                email: userData.email.trim().toLowerCase(),

                first_name: userData.first_name.trim(),

                last_name: userData.last_name.trim(),

                middle_name: userData.middle_name?.trim() || null,

                mobile: userData.mobile?.trim() || null,

                department: userData.department?.trim() || null,

                position: userData.position?.trim() || null,

                system_role: userData.system_role || null,

                assigned_school_id: userData.assigned_school_id && userData.assigned_school_id !== '' ? parseInt(userData.assigned_school_id) : null

            };

            

            // Handle system_role for staff users

            if (sanitizedData.role === 'staff') {

                if (!sanitizedData.system_role) {

                    sanitizedData.system_role = 'coordinator'; // Default value

                }

            } else {

                // Remove system_role for non-staff users

                delete sanitizedData.system_role;

            }



            // Remove null values to avoid validation issues

            Object.keys(sanitizedData).forEach(key => {

                if (sanitizedData[key] === null || sanitizedData[key] === '') {

                    delete sanitizedData[key];

                }

            });

            

            console.log('Sending user data:', sanitizedData);

            

            const response = await axios.post(`${SCHOLARSHIP_API}/users`, sanitizedData);

            

            if (response.data.success) {

                showSuccess('User created successfully!');

                setShowCreateModal(false);

                resetForm();

                fetchUsers();

                fetchStats();

            }

        } catch (error) {

            console.error('Error creating user:', error);

            

            // Handle specific error cases

            if (error.response?.data?.errors) {

                const serverErrors = error.response.data.errors;

                setFormErrors(serverErrors);

                showError('Please fix the validation errors and try again.');

            } else if (error.response?.data?.message) {

                showError(`Error: ${error.response.data.message}`);

            } else if (error.code === 'NETWORK_ERROR') {

                showError('Network error. Please check your connection and try again.');

            } else {

                const errorMessage = error.response?.data?.message || error.message;

                showError('Error creating user: ' + errorMessage);

            }

        } finally {

            setIsSubmitting(false);

        }

    };



    const handleUpdateUser = async (e) => {

        e.preventDefault();

        try {

            const response = await axios.put(`${SCHOLARSHIP_API}/users/${selectedUser.id}`, formData);

            if (response.data.success) {

                showSuccess('User updated successfully!');

                setShowEditModal(false);

                setSelectedUser(null);

                resetForm();

                fetchUsers();

            }

        } catch (error) {

            showError('Error updating user: ' + (error.response?.data?.message || error.message));

        }

    };



    // Modal action handlers

    const openActionModal = (user) => {

        setSelectedActionUser(user);

        setShowActionModal(true);

    };



    const closeActionModal = () => {

        setShowActionModal(false);

        setSelectedActionUser(null);

        setIsActionLoading(false);

    };



    const handleActivateUser = async (userId) => {

        setIsActionLoading(true);

        try {

            const response = await axios.put(`${SCHOLARSHIP_API}/users/${userId}/activate`);

            if (response.data.success) {

                showSuccess(`User activated successfully!`);

                fetchUsers();

                fetchStats();

                closeActionModal();

            }

        } catch (error) {

            showError(`Error activating user: ${error.response?.data?.message || error.message}`);

        } finally {

            setIsActionLoading(false);

        }

    };



    const handleDeactivateUser = async (userId) => {

        setIsActionLoading(true);

        try {

            const response = await axios.delete(`${SCHOLARSHIP_API}/users/${userId}`);

            if (response.data.success) {

                showWarning(`User deactivated successfully!`);

                fetchUsers();

                fetchStats();

                closeActionModal();

            }

        } catch (error) {

            showError(`Error deactivating user: ${error.response?.data?.message || error.message}`);

        } finally {

            setIsActionLoading(false);

        }

    };



    const handlePermanentDeleteUser = async (userId) => {

        setIsActionLoading(true);

        try {

            const response = await axios.delete(`${SCHOLARSHIP_API}/users/${userId}/permanent`);

            if (response.data.success) {

                showSuccess(`User permanently deleted successfully!`);

                fetchUsers();

                fetchStats();

                closeActionModal();

            }

        } catch (error) {

            showError(`Error permanently deleting user: ${error.response?.data?.message || error.message}`);

        } finally {

            setIsActionLoading(false);

        }

    };



    const openCreateModal = () => {

        setShowCreateModal(true);

        // Generate initial ID for default role (citizen)

        generateNextId('citizen');

    };



    const openEditModal = (user) => {

        setSelectedUser(user);

        setFormData({

            email: user.email || '',

            first_name: user.first_name || '',

            last_name: user.last_name || '',

            middle_name: user.middle_name || '',

            extension_name: user.extension_name || '',

            mobile: user.mobile || '',

            birthdate: user.birthdate || '',

            address: user.address || '',

            house_number: user.house_number || '',

            street: user.street || '',

            barangay: user.barangay || '',

            role: user.role || 'citizen',

            system_role: user.staff_details?.system_role || 'coordinator',

            department: user.staff_details?.department || '',

            position: user.staff_details?.position || '',

        });

        setShowEditModal(true);

    };



    const resetForm = () => {

        setFormData({

            citizen_id: '',

            email: '',

            password: '',

            password_confirmation: '',

            first_name: '',

            last_name: '',

            middle_name: '',

            extension_name: '',

            mobile: '',

            birthdate: '',

            address: '',

            house_number: '',

            street: '',

            barangay: '',

            role: 'citizen',

            system_role: 'coordinator',

            department: '',

            position: '',

            assigned_school_id: '',

        });

        setFormErrors({});

        setIsSubmitting(false);

        setShowPassword(false);

        setShowConfirmPassword(false);

        setGeneratedId('');

        setSchoolSearchTerm('');

    };



    const validateForm = () => {

        const errors = {};

        

        // Email validation

        if (!formData.email.trim()) {

            errors.email = 'Email is required';

        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {

            errors.email = 'Please enter a valid email address';

        } else if (formData.email.length > 255) {

            errors.email = 'Email must be less than 255 characters';

        }

        

        // Password validation

        if (!formData.password) {

            errors.password = 'Password is required';

        } else if (formData.password.length < 8) {

            errors.password = 'Password must be at least 8 characters';

        } else if (formData.password.length > 128) {

            errors.password = 'Password must be less than 128 characters';

        } else if (!/(?=.*[a-z])/.test(formData.password)) {

            errors.password = 'Password must contain at least one lowercase letter';

        } else if (!/(?=.*[A-Z])/.test(formData.password)) {

            errors.password = 'Password must contain at least one uppercase letter';

        } else if (!/(?=.*\d)/.test(formData.password)) {

            errors.password = 'Password must contain at least one number';

        } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {

            errors.password = 'Password must contain at least one special character';

        }

        

        // Password confirmation

        if (!formData.password_confirmation) {

            errors.password_confirmation = 'Please confirm your password';

        } else if (formData.password !== formData.password_confirmation) {

            errors.password_confirmation = 'Passwords do not match';

        }

        

        // Name validation

        if (!formData.first_name.trim()) {

            errors.first_name = 'First name is required';

        } else if (formData.first_name.trim().length < 2) {

            errors.first_name = 'First name must be at least 2 characters';

        } else if (formData.first_name.trim().length > 50) {

            errors.first_name = 'First name must be less than 50 characters';

        } else if (!/^[a-zA-Z\s'-]+$/.test(formData.first_name.trim())) {

            errors.first_name = 'First name can only contain letters, spaces, hyphens, and apostrophes';

        }

        

        if (!formData.last_name.trim()) {

            errors.last_name = 'Last name is required';

        } else if (formData.last_name.trim().length < 2) {

            errors.last_name = 'Last name must be at least 2 characters';

        } else if (formData.last_name.trim().length > 50) {

            errors.last_name = 'Last name must be less than 50 characters';

        } else if (!/^[a-zA-Z\s'-]+$/.test(formData.last_name.trim())) {

            errors.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes';

        }

        

        // Middle name validation (optional)

        if (formData.middle_name && formData.middle_name.trim().length > 50) {

            errors.middle_name = 'Middle name must be less than 50 characters';

        } else if (formData.middle_name && !/^[a-zA-Z\s'-]+$/.test(formData.middle_name.trim())) {

            errors.middle_name = 'Middle name can only contain letters, spaces, hyphens, and apostrophes';

        }

        

        // Mobile validation

        if (formData.mobile && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.mobile.replace(/[\s\-\(\)]/g, ''))) {

            errors.mobile = 'Please enter a valid phone number';

        }

        

        // Staff role validation

        if (formData.role === 'staff' && !formData.system_role) {

            errors.system_role = 'System role is required for staff members';

        }

        

        // Department validation for staff - required field

        if (formData.role === 'staff') {

            if (!formData.department || formData.department.trim() === '') {

                errors.department = 'Department is required for staff members';

            } else if (formData.department.length > 100) {

            errors.department = 'Department name must be less than 100 characters';

            }

        }

        

        // Position validation for staff - required field

        if (formData.role === 'staff') {

            if (!formData.position || formData.position.trim() === '') {

                errors.position = 'Position is required for staff members';

            } else if (formData.position.length > 100) {

            errors.position = 'Position must be less than 100 characters';

            }

        }



        // PS Rep validation - school assignment required

        if (formData.role === 'ps_rep') {

            if (!formData.assigned_school_id) {

                errors.assigned_school_id = 'School assignment is required for Partner School Representatives';

            }

        }

        

        setFormErrors(errors);

        return Object.keys(errors).length === 0;

    };



    const getPasswordStrength = (password) => {

        if (!password) return { strength: 0, label: '', color: '', requirements: [] };

        

        const requirements = [

            { text: 'At least 8 characters', met: password.length >= 8 },

            { text: 'One lowercase letter', met: /[a-z]/.test(password) },

            { text: 'One uppercase letter', met: /[A-Z]/.test(password) },

            { text: 'One number', met: /[0-9]/.test(password) },

            { text: 'One special character', met: /[^A-Za-z0-9]/.test(password) }

        ];

        

        const metRequirements = requirements.filter(req => req.met).length;

        const strength = metRequirements;

        

        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

        

        return {

            strength,

            label: labels[strength - 1] || 'Very Weak',

            color: colors[strength - 1] || 'bg-red-500',

            requirements

        };

    };



    const generatePassword = () => {

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

        let password = '';

        for (let i = 0; i < 12; i++) {

            password += chars.charAt(Math.floor(Math.random() * chars.length));

        }

        setFormData({...formData, password, password_confirmation: password});

    };



    // Real-time validation for individual fields

    const validateField = (fieldName, value) => {

        const errors = { ...formErrors };

        

        switch (fieldName) {

            case 'email':

                if (!value.trim()) {

                    errors.email = 'Email is required';

                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {

                    errors.email = 'Please enter a valid email address';

                } else if (value.length > 255) {

                    errors.email = 'Email must be less than 255 characters';

                } else {

                    delete errors.email;

                }

                break;

                

            case 'password':

                if (!value) {

                    errors.password = 'Password is required';

                } else if (value.length < 8) {

                    errors.password = 'Password must be at least 8 characters';

                } else if (value.length > 128) {

                    errors.password = 'Password must be less than 128 characters';

                } else if (!/(?=.*[a-z])/.test(value)) {

                    errors.password = 'Password must contain at least one lowercase letter';

                } else if (!/(?=.*[A-Z])/.test(value)) {

                    errors.password = 'Password must contain at least one uppercase letter';

                } else if (!/(?=.*\d)/.test(value)) {

                    errors.password = 'Password must contain at least one number';

                } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value)) {

                    errors.password = 'Password must contain at least one special character';

                } else {

                    delete errors.password;

                }

                break;

                

            case 'password_confirmation':

                if (!value) {

                    errors.password_confirmation = 'Please confirm your password';

                } else if (value !== formData.password) {

                    errors.password_confirmation = 'Passwords do not match';

                } else {

                    delete errors.password_confirmation;

                }

                break;

                

            case 'first_name':

                if (!value.trim()) {

                    errors.first_name = 'First name is required';

                } else if (value.trim().length < 2) {

                    errors.first_name = 'First name must be at least 2 characters';

                } else if (value.trim().length > 50) {

                    errors.first_name = 'First name must be less than 50 characters';

                } else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {

                    errors.first_name = 'First name can only contain letters, spaces, hyphens, and apostrophes';

                } else {

                    delete errors.first_name;

                }

                break;

                

            case 'last_name':

                if (!value.trim()) {

                    errors.last_name = 'Last name is required';

                } else if (value.trim().length < 2) {

                    errors.last_name = 'Last name must be at least 2 characters';

                } else if (value.trim().length > 50) {

                    errors.last_name = 'Last name must be less than 50 characters';

                } else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {

                    errors.last_name = 'Last name can only contain letters, spaces, hyphens, and apostrophes';

                } else {

                    delete errors.last_name;

                }

                break;

                

            case 'mobile':

                if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {

                    errors.mobile = 'Please enter a valid phone number';

                } else {

                    delete errors.mobile;

                }

                break;

        }

        

        setFormErrors(errors);

    };



    const generateNextId = (role) => {

        const rolePrefix = {

            'citizen': 'CITIZEN',

            'staff': 'STAFF',

            'admin': 'ADMIN',

            'ps_rep': 'PSREP',

            'ssc': 'SSC',

            'ssc_chairperson': 'SSC',

            'ssc_city_council': 'SSC',

            'ssc_budget_dept': 'SSC',

            'ssc_education_affairs': 'SSC',

            'ssc_hrd': 'SSC',

            'ssc_social_services': 'SSC',

            'ssc_accounting': 'SSC',

            'ssc_treasurer': 'SSC',

            'ssc_qcydo': 'SSC',

            'ssc_planning_dept': 'SSC',

            'ssc_schools_division': 'SSC',

            'ssc_qcu': 'SSC'

        };



        const prefix = rolePrefix[role] || 'USER';

        

        // Get all users of the same role to find the highest number

        let maxNumber = 0;

        const allUsers = [

            ...(users.citizens || []),

            ...(users.staff || []),

            ...(users.admins || []),

            ...(users.ps_reps || []),

            ...(users.ssc || []),

            ...(users.ssc_chairperson || []),

            ...(users.ssc_city_council || []),

            ...(users.ssc_budget_dept || []),

            ...(users.ssc_education_affairs || []),

            ...(users.ssc_hrd || []),

            ...(users.ssc_social_services || []),

            ...(users.ssc_accounting || []),

            ...(users.ssc_treasurer || []),

            ...(users.ssc_qcydo || []),

            ...(users.ssc_planning_dept || []),

            ...(users.ssc_schools_division || []),

            ...(users.ssc_qcu || [])

        ];



        allUsers.forEach(user => {

            if (user.citizen_id && user.citizen_id.startsWith(prefix)) {

                const number = parseInt(user.citizen_id.split('-')[1]);

                if (!isNaN(number) && number > maxNumber) {

                    maxNumber = number;

                }

            }

        });



        const nextNumber = maxNumber + 1;

        const newId = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;

        setGeneratedId(newId);

        setFormData({...formData, citizen_id: newId});

    };



    const getRoleBadgeColor = (role) => {

        switch (role) {

            case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';

            case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';

            case 'ps_rep': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';

            case 'citizen': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';

            case 'ssc': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';

            case 'ssc_chairperson': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';

            case 'ssc_city_council': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';

            case 'ssc_budget_dept': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

            case 'ssc_education_affairs': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';

            case 'ssc_hrd': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';

            case 'ssc_social_services': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';

            case 'ssc_accounting': return 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200';

            case 'ssc_treasurer': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';

            case 'ssc_qcydo': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';

            case 'ssc_planning_dept': return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';

            case 'ssc_schools_division': return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200';

            case 'ssc_qcu': return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';

            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

        }

    };



    const getTotalUsers = () => {

        return (users.citizens?.length || 0) + 

               (users.staff?.length || 0) + 

               (users.admins?.length || 0) + 

               (users.ps_reps?.length || 0) +

               (users.ssc_city_council?.length || 0) +

               (users.ssc_budget_dept?.length || 0) +

               (users.ssc_education_affairs?.length || 0);

    };



    if (loading) {

        return <LoadingUsers />;

    }



    return (

        <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">

            {/* Header */}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">

                <div className="flex-1 min-w-0">

                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>

                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage system users and their roles</p>

                </div>

                <button

                    onClick={openCreateModal}

                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"

                >

                    <UserPlus size={18} className="sm:w-5 sm:h-5" />

                    <span className="truncate">Add New User</span>

                </button>

            </div>



            {/* Stats Cards */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-6">

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Users</p>

                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{getTotalUsers()}</p>

                        </div>

                        <Users className="text-blue-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Citizens</p>

                            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{users.citizens?.length || 0}</p>

                        </div>

                        <UserCheck className="text-green-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Staff Members</p>

                            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{users.staff?.length || 0}</p>

                        </div>

                        <Shield className="text-blue-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Administrators</p>

                            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{users.admins?.length || 0}</p>

                        </div>

                        <Shield className="text-red-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Partner School Reps</p>

                            <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{users.ps_reps?.length || 0}</p>

                        </div>

                        <Shield className="text-purple-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">SSC - City Council</p>

                            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{users.ssc_city_council?.length || 0}</p>

                        </div>

                        <Shield className="text-orange-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">SSC - Budget Dept</p>

                            <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{users.ssc_budget_dept?.length || 0}</p>

                        </div>

                        <Shield className="text-yellow-500 flex-shrink-0" size={28} />

                    </div>

                </div>

                

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">

                    <div className="flex items-center justify-between">

                        <div className="flex-1 min-w-0">

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">SSC - Education</p>

                            <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{users.ssc_education_affairs?.length || 0}</p>

                        </div>

                        <Shield className="text-indigo-500 flex-shrink-0" size={28} />

                    </div>

                </div>

            </div>



            {/* Filters */}

            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

                    <div className="flex-1 relative">

                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />

                        <input

                            type="text"

                            placeholder="Search by name, email, or citizen ID..."

                            value={searchTerm}

                            onChange={(e) => setSearchTerm(e.target.value)}

                            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"

                        />

                    </div>

                    

                    <div className="flex items-center gap-2">

                        <Filter size={18} className="text-gray-600 dark:text-gray-400" />

                        <select

                            value={selectedRole}

                            onChange={(e) => setSelectedRole(e.target.value)}

                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"

                        >

                            <option value="all">All Roles</option>

                            <option value="citizen">Citizens</option>

                            <option value="staff">Staff</option>

                            <option value="admin">Administrators</option>

                            <option value="ps_rep">Partner School Reps</option>

                            <option value="ssc">SSC - General</option>

                            <option value="ssc_chairperson">SSC - Chairperson</option>

                            <option value="ssc_city_council">SSC - City Council</option>

                            <option value="ssc_budget_dept">SSC - Budget Department</option>

                            <option value="ssc_education_affairs">SSC - Education Affairs</option>

                            <option value="ssc_hrd">SSC - HRD</option>

                            <option value="ssc_social_services">SSC - Social Services</option>

                            <option value="ssc_accounting">SSC - Accounting</option>

                            <option value="ssc_treasurer">SSC - Treasurer</option>

                            <option value="ssc_qcydo">SSC - QCYDO</option>

                            <option value="ssc_planning_dept">SSC - Planning Department</option>

                            <option value="ssc_schools_division">SSC - Schools Division</option>

                            <option value="ssc_qcu">SSC - QCU</option>

                        </select>

                    </div>

                    

                    <div className="flex items-center gap-2">

                        <UserCheck size={18} className="text-gray-600 dark:text-gray-400" />

                        <select

                            value={selectedStatus}

                            onChange={(e) => setSelectedStatus(e.target.value)}

                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"

                        >

                            <option value="all">All Status</option>

                            <option value="active">Active</option>

                            <option value="inactive">Inactive</option>

                        </select>

                    </div>

                </div>

            </div>



            {/* Users Table */}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead className="bg-gray-50 dark:bg-gray-700">

                            <tr>

                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">

                                    <span className="hidden sm:inline">User Info</span>

                                    <span className="sm:hidden">Name</span>

                                </th>

                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">

                                    <span className="hidden sm:inline">Citizen ID</span>

                                    <span className="sm:hidden">ID</span>

                                </th>

                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">

                                    Role

                                </th>

                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">

                                    Status

                                </th>

                                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">

                                    Actions

                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                            {loading ? (

                                <tr>

                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">

                                        Loading users...

                                    </td>

                                </tr>

                            ) : filteredUsers.length === 0 ? (

                                <tr>

                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">

                                        No users found

                                    </td>

                                </tr>

                            ) : (

                                filteredUsers.map((user) => (

                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                                        <td className="px-3 sm:px-6 py-4">

                                            <div className="min-w-0">

                                                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">

                                                    {user.first_name} {user.middle_name ? user.middle_name + ' ' : ''}{user.last_name} {user.extension_name || ''}

                                                </div>

                                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>

                                            </div>

                                        </td>

                                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white">

                                            <span className="truncate block">{user.citizen_id || 'N/A'}</span>

                                        </td>

                                        <td className="px-3 sm:px-6 py-4">

                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>

                                                {user.roleType}

                                            </span>

                                        </td>

                                        <td className="px-3 sm:px-6 py-4">

                                            {user.is_active ? (

                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs sm:text-sm">

                                                    <UserCheck size={14} className="sm:w-4 sm:h-4" /> 

                                                    <span className="hidden sm:inline">Active</span>

                                                </span>

                                            ) : (

                                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs sm:text-sm">

                                                    <UserX size={14} className="sm:w-4 sm:h-4" /> 

                                                    <span className="hidden sm:inline">Inactive</span>

                                                </span>

                                            )}

                                        </td>

                                        <td className="px-3 sm:px-6 py-4 text-right">

                                            <div className="flex justify-end gap-1 sm:gap-2">

                                                <button

                                                    onClick={() => openEditModal(user)}

                                                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"

                                                    title="Edit User"

                                                >

                                                    <Edit size={16} className="sm:w-5 sm:h-5" />

                                                </button>

                                                <button

                                                    onClick={() => openActionModal(user)}

                                                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${

                                                        user.is_active 

                                                            ? "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" 

                                                            : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"

                                                    }`}

                                                    title={user.is_active ? "User Actions" : "User Actions"}

                                                >

                                                    <MoreVertical size={16} className="sm:w-5 sm:h-5" />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>



            {/* Create User Modal */}

            {showCreateModal && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">

                            <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">

                                        <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />

                                    </div>

                                    <div>

                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h3>

                                        <p className="text-sm text-gray-500 dark:text-gray-400">Add a new user to the system</p>

                                    </div>

                                </div>

                                <button

                                    onClick={() => {

                                        setShowCreateModal(false);

                                        resetForm();

                                    }}

                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"

                                >

                                    <XCircle className="w-5 h-5 text-gray-500" />

                                </button>

                            </div>

                        </div>

                        

                        <div className="flex-1 overflow-y-auto p-6">

                            <form onSubmit={handleCreateUser} className="space-y-6">

                                {/* Basic Information Section */}

                                <div className="space-y-4">

                                    <div className="flex items-center gap-2 mb-4">

                                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>

                                    </div>

                                    

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <User className="w-4 h-4 inline mr-1" />

                                                Citizen ID *

                                            </label>

                                            <div className="relative">

                                                <input

                                                    type="text"

                                                    required

                                                    value={formData.citizen_id}

                                                    readOnly

                                                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed focus:ring-2 focus:ring-blue-500"

                                                />

                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            </div>

                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">

                                                <CheckCircle className="w-3 h-3" />

                                                ID is automatically generated based on role

                                            </p>

                                            {formErrors.citizen_id && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.citizen_id}

                                                </p>

                                            )}

                                        </div>

                                    

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <Mail className="w-4 h-4 inline mr-1" />

                                                Email Address *

                                            </label>

                                            <div className="relative">

                                                <input

                                                    type="email"

                                                    required

                                                    value={formData.email}

                                                    onChange={(e) => {

                                                        setFormData({...formData, email: e.target.value});

                                                        validateField('email', e.target.value);

                                                    }}

                                                    onBlur={(e) => validateField('email', e.target.value)}

                                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                        formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                    }`}

                                                    placeholder="user@example.com"

                                                />

                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            </div>

                                            {formErrors.email && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.email}

                                                </p>

                                            )}

                                        </div>

                                    </div>

                                </div>



                                {/* Role & Permissions Section */}

                                <div className="space-y-4">

                                    <div className="flex items-center gap-2 mb-4">

                                        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Role & Permissions</h4>

                                    </div>

                                    

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <Shield className="w-4 h-4 inline mr-1" />

                                                User Role *

                                            </label>

                                            <div className="relative">

                                                <select

                                                    required

                                                    value={formData.role}

                                                    onChange={(e) => setFormData({...formData, role: e.target.value})}

                                                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-colors appearance-none"

                                                >

                                                    <option value="">Select a role</option>

                                                    <option value="citizen">Citizen</option>

                                                    <option value="staff">Staff Member</option>

                                                    <option value="admin">Administrator</option>

                                                    <option value="ps_rep">Partner School Representative</option>

                                                    <option value="ssc">SSC - General</option>

                                                    <option value="ssc_chairperson">SSC - Chairperson</option>

                                                    <option value="ssc_city_council">SSC - City Council</option>

                                                    <option value="ssc_budget_dept">SSC - Budget Department</option>

                                                    <option value="ssc_education_affairs">SSC - Education Affairs</option>

                                                    <option value="ssc_hrd">SSC - HRD</option>

                                                    <option value="ssc_social_services">SSC - Social Services</option>

                                                    <option value="ssc_accounting">SSC - Accounting</option>

                                                    <option value="ssc_treasurer">SSC - Treasurer</option>

                                                    <option value="ssc_qcydo">SSC - QCYDO</option>

                                                    <option value="ssc_planning_dept">SSC - Planning Department</option>

                                                    <option value="ssc_schools_division">SSC - Schools Division</option>

                                                    <option value="ssc_qcu">SSC - QCU</option>

                                                </select>

                                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            </div>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

                                                Choose the appropriate role for this user

                                            </p>

                                        </div>

                                    </div>

                                </div>



                                {/* Role Selection Notice */}

                                {!isRoleSelected && (

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">

                                        <div className="flex items-center">

                                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />

                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">

                                                Please select a user role above to enable the form fields below.

                                            </p>

                                        </div>

                                    </div>

                                )}



                                {/* Personal Information Section */}

                                <div className="space-y-4">

                                    <div className="flex items-center gap-2 mb-4">

                                        <User className="w-5 h-5 text-green-600 dark:text-green-400" />

                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h4>

                                    </div>

                                    

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <User className="w-4 h-4 inline mr-1" />

                                                First Name *

                                            </label>

                                            <input

                                                type="text"

                                                required

                                                {...getFieldProps()}

                                                value={formData.first_name}

                                                onChange={(e) => {

                                                    setFormData({...formData, first_name: e.target.value});

                                                    validateField('first_name', e.target.value);

                                                }}

                                                onBlur={(e) => validateField('first_name', e.target.value)}

                                                className={getFieldProps().className(

                                                    'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors',

                                                    formErrors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                )}

                                                placeholder="Enter first name"

                                            />

                                            {formErrors.first_name && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.first_name}

                                                </p>

                                            )}

                                        </div>

                                        

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <User className="w-4 h-4 inline mr-1" />

                                                Last Name *

                                            </label>

                                            <input

                                                type="text"

                                                required

                                                value={formData.last_name}

                                                onChange={(e) => {

                                                    setFormData({...formData, last_name: e.target.value});

                                                    validateField('last_name', e.target.value);

                                                }}

                                                onBlur={(e) => validateField('last_name', e.target.value)}

                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                    formErrors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                }`}

                                                placeholder="Enter last name"

                                            />

                                            {formErrors.last_name && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.last_name}

                                                </p>

                                            )}

                                        </div>

                                        

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <User className="w-4 h-4 inline mr-1" />

                                                Middle Name

                                            </label>

                                            <input

                                                type="text"

                                                value={formData.middle_name}

                                                onChange={(e) => setFormData({...formData, middle_name: e.target.value})}

                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                    formErrors.middle_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                }`}

                                                placeholder="Enter middle name (optional)"

                                            />

                                            {formErrors.middle_name && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.middle_name}

                                                </p>

                                            )}

                                        </div>

                                        

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <Phone className="w-4 h-4 inline mr-1" />

                                                Mobile Number

                                            </label>

                                            <div className="relative">

                                                <input

                                                    type="tel"

                                                    value={formData.mobile}

                                                    onChange={(e) => {

                                                        setFormData({...formData, mobile: e.target.value});

                                                        validateField('mobile', e.target.value);

                                                    }}

                                                    onBlur={(e) => validateField('mobile', e.target.value)}

                                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                        formErrors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                    }`}

                                                    placeholder="+63 912 345 6789"

                                                />

                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            </div>

                                            {formErrors.mobile && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.mobile}

                                                </p>

                                            )}

                                        </div>

                                    </div>

                                </div>



                                {/* Account Security Section */}

                                <div className="space-y-4">

                                    <div className="flex items-center gap-2 mb-4">

                                        <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />

                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Account Security</h4>

                                    </div>

                                    

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <Lock className="w-4 h-4 inline mr-1" />

                                                Password *

                                            </label>

                                            <div className="relative">

                                                <input

                                                    type={showPassword ? "text" : "password"}

                                                    required

                                                    value={formData.password}

                                                    onChange={(e) => {

                                                        setFormData({...formData, password: e.target.value});

                                                        validateField('password', e.target.value);

                                                    }}

                                                    onBlur={(e) => validateField('password', e.target.value)}

                                                    className={`w-full px-4 py-3 pl-10 pr-24 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                        formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                    }`}

                                                    placeholder="Enter secure password"

                                                />

                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">

                                                    <button

                                                        type="button"

                                                        onClick={() => setShowPassword(!showPassword)}

                                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"

                                                    >

                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}

                                                    </button>

                                                    <button

                                                        type="button"

                                                        onClick={generatePassword}

                                                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"

                                                    >

                                                        Generate

                                                    </button>

                                                </div>

                                            </div>

                                            {formErrors.password && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.password}

                                                </p>

                                            )}

                                            {formData.password && (

                                                <div className="mt-3 space-y-2">

                                                    <div className="flex items-center gap-2">

                                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">

                                                            <div 

                                                                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}

                                                                style={{ width: `${(getPasswordStrength(formData.password).strength / 5) * 100}%` }}

                                                            ></div>

                                                        </div>

                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">

                                                            {getPasswordStrength(formData.password).label}

                                                        </span>

                                                    </div>

                                                    <div className="grid grid-cols-1 gap-1">

                                                        {getPasswordStrength(formData.password).requirements.map((req, index) => (

                                                            <div key={index} className="flex items-center gap-2 text-xs">

                                                                {req.met ? (

                                                                    <CheckCircle className="w-3 h-3 text-green-500" />

                                                                ) : (

                                                                    <AlertCircle className="w-3 h-3 text-gray-400" />

                                                                )}

                                                                <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>

                                                                    {req.text}

                                                                </span>

                                                            </div>

                                                        ))}

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                <Lock className="w-4 h-4 inline mr-1" />

                                                Confirm Password *

                                            </label>

                                            <div className="relative">

                                                <input

                                                    type={showConfirmPassword ? "text" : "password"}

                                                    required

                                                    value={formData.password_confirmation}

                                                    onChange={(e) => {

                                                        setFormData({...formData, password_confirmation: e.target.value});

                                                        validateField('password_confirmation', e.target.value);

                                                    }}

                                                    onBlur={(e) => validateField('password_confirmation', e.target.value)}

                                                    className={`w-full px-4 py-3 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                        formErrors.password_confirmation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                    }`}

                                                    placeholder="Confirm your password"

                                                />

                                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                <button

                                                    type="button"

                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}

                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"

                                                >

                                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}

                                                </button>

                                            </div>

                                            {formErrors.password_confirmation && (

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                    <AlertCircle className="w-4 h-4" />

                                                    {formErrors.password_confirmation}

                                                </p>

                                            )}

                                        </div>

                                    </div>

                                </div>



                                {/* Role & Permissions Section */}

                                <div className="space-y-4">

                                    

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    

                                        {formData.role === 'staff' && (

                                            <div className="col-span-2">

                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">

                                                    <div className="flex items-center gap-2 mb-4">

                                                        <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                                                        <h5 className="font-semibold text-blue-900 dark:text-blue-100">Staff Information</h5>

                                                    </div>

                                                    

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                        <div>

                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                                <Briefcase className="w-4 h-4 inline mr-1" />

                                                                System Role *

                                                            </label>

                                                            <div className="relative">

                                                                <select

                                                                    value={formData.system_role}

                                                                    onChange={(e) => setFormData({...formData, system_role: e.target.value})}

                                                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors appearance-none ${

                                                                        formErrors.system_role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                                    }`}

                                                                >

                                                                    <option value="">Select system role</option>

                                                                    <option value="interviewer">Interviewer</option>

                                                                    <option value="reviewer">Reviewer</option>

                                                                    <option value="administrator">Administrator</option>

                                                                    <option value="coordinator">Coordinator</option>

                                                                </select>

                                                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                            </div>

                                                            {formErrors.system_role && (

                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                                    <AlertCircle className="w-4 h-4" />

                                                                    {formErrors.system_role}

                                                                </p>

                                                            )}

                                                        </div>

                                                        

                                                        <div>

                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                                <Building className="w-4 h-4 inline mr-1" />

                                                                Department *

                                                            </label>

                                                            <div className="relative">

                                                                <select

                                                                    value={formData.department}

                                                                    onChange={(e) => setFormData({...formData, department: e.target.value})}

                                                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                                        formErrors.department ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                                    }`}

                                                                    required

                                                                >

                                                                    <option value="">Select Department</option>

                                                                    <option value="Information Technology">Information Technology</option>

                                                                    <option value="Human Resources">Human Resources</option>

                                                                    <option value="Finance">Finance</option>

                                                                    <option value="Education Affairs">Education Affairs</option>

                                                                    <option value="Student Services">Student Services</option>

                                                                    <option value="Administration">Administration</option>

                                                                    <option value="Budget Department">Budget Department</option>

                                                                    <option value="City Council">City Council</option>

                                                                    <option value="Scholarship Program">Scholarship Program</option>

                                                                    <option value="Assessment & Evaluation">Assessment & Evaluation</option>

                                                                    <option value="Community Relations">Community Relations</option>

                                                                    <option value="Legal Affairs">Legal Affairs</option>

                                                                    <option value="Planning & Development">Planning & Development</option>

                                                                </select>

                                                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                            </div>

                                                            {formErrors.department && (

                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                                    <AlertCircle className="w-4 h-4" />

                                                                    {formErrors.department}

                                                                </p>

                                                            )}

                                                        </div>

                                                        

                                                        <div>

                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                                <User className="w-4 h-4 inline mr-1" />

                                                                Position *

                                                            </label>

                                                            <div className="relative">

                                                                <select

                                                                    value={formData.position}

                                                                    onChange={(e) => setFormData({...formData, position: e.target.value})}

                                                                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${

                                                                        formErrors.position ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'

                                                                    }`}

                                                                    required

                                                                >

                                                                    <option value="">Select Position</option>

                                                                    <option value="Interviewer">Interviewer</option>

                                                                    <option value="Assessment Officer">Assessment Officer</option>

                                                                    <option value="Evaluation Specialist">Evaluation Specialist</option>

                                                                    <option value="Reviewer">Reviewer</option>

                                                                    <option value="Assessment Coordinator">Assessment Coordinator</option>

                                                                    <option value="Evaluation Manager">Evaluation Manager</option>

                                                                    <option value="Administrator">Administrator</option>

                                                                    <option value="System Administrator">System Administrator</option>

                                                                    <option value="IT Administrator">IT Administrator</option>

                                                                    <option value="Coordinator">Coordinator</option>

                                                                    <option value="Program Coordinator">Program Coordinator</option>

                                                                    <option value="Scholarship Coordinator">Scholarship Coordinator</option>

                                                                    <option value="Department Head">Department Head</option>

                                                                    <option value="Manager">Manager</option>

                                                                    <option value="Supervisor">Supervisor</option>

                                                                    <option value="Officer">Officer</option>

                                                                    <option value="Specialist">Specialist</option>

                                                                    <option value="Analyst">Analyst</option>

                                                                    <option value="Assistant">Assistant</option>

                                                                    <option value="Clerk">Clerk</option>

                                                                </select>

                                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                            </div>

                                                            {formErrors.position && (

                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">

                                                                    <AlertCircle className="w-4 h-4" />

                                                                    {formErrors.position}

                                                                </p>

                                                            )}

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        )}



                                        {formData.role === 'ps_rep' && (

                                            <div className="col-span-2">

                                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">

                                                    <div className="flex items-center gap-2 mb-4">

                                                        <School className="w-5 h-5 text-orange-600 dark:text-orange-400" />

                                                        <h5 className="font-semibold text-orange-900 dark:text-orange-100">School Assignment</h5>

                                                    </div>

                                                    

                                                    <div className="space-y-4">

                                                        <div>

                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                                Search School *

                                                            </label>

                                                            <div className="relative">

                                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                                                                <input

                                                                    type="text"

                                                                    placeholder="Search schools by name, campus, or location..."

                                                                    value={schoolSearchTerm}

                                                                    onChange={(e) => setSchoolSearchTerm(e.target.value)}

                                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"

                                                                />

                                                            </div>

                                                        </div>

                                                        

                                                        <div>

                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                                                                Select School *

                                                            </label>

                                                            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">

                                                                {filteredSchools.length === 0 ? (

                                                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">

                                                                        {schools.length === 0 ? 'Loading schools...' : 'No schools found'}

                                                                    </div>

                                                                ) : (

                                                                    filteredSchools.map((school) => (

                                                                        <div

                                                                            key={school.id}

                                                                            onClick={() => setFormData({...formData, assigned_school_id: school.id})}

                                                                            className={`p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${

                                                                                formData.assigned_school_id === school.id

                                                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500'

                                                                                    : ''

                                                                            }`}

                                                                        >

                                                                            <div className="flex items-center justify-between">

                                                                                <div className="flex-1 min-w-0">

                                                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">

                                                                                        {school.name}

                                                                                    </h4>

                                                                                    {school.campus && (

                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{school.campus}</p>

                                                                                    )}

                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">

                                                                                        {[school.city, school.region].filter(Boolean).join(', ')}

                                                                                    </p>

                                                                                </div>

                                                                                <div className="flex items-center space-x-2">

                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${

                                                                                        school.is_partner_school 

                                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'

                                                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'

                                                                                    }`}>

                                                                                        {school.is_partner_school ? 'Partner' : 'Regular'}

                                                                                    </span>

                                                                                    {formData.assigned_school_id === school.id && (

                                                                                        <CheckCircle className="w-4 h-4 text-orange-500" />

                                                                                    )}

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                    ))

                                                                )}

                                                            </div>

                                                            {formErrors.assigned_school_id && (

                                                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.assigned_school_id}</p>

                                                            )}

                                                        </div>

                                                        

                                                        {formData.assigned_school_id && (

                                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">

                                                                <div className="flex items-center">

                                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                                                                    <span className="text-sm text-green-700 dark:text-green-400">

                                                                        School selected: {schools.find(s => s.id === formData.assigned_school_id)?.name}

                                                                    </span>

                                                                </div>

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                </div>

                            </form>

                        </div>

                        

                        {/* Fixed Footer with Action Buttons - Outside scrollable area */}

                        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-xl">

                            <div className="flex justify-end gap-3">

                                <button

                                    type="button"

                                    onClick={() => {

                                        setShowCreateModal(false);

                                        resetForm();

                                    }}

                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors font-medium flex items-center gap-2"

                                >

                                    <XCircle className="w-4 h-4" />

                                    Cancel

                                </button>

                                <button

                                    type="submit"

                                    onClick={handleCreateUser}

                                    disabled={isSubmitting || !isRoleSelected}

                                    className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl ${

                                        isSubmitting || !isRoleSelected

                                            ? 'bg-gray-400 cursor-not-allowed' 

                                            : 'bg-blue-600 hover:bg-blue-700'

                                    } text-white`}

                                >

                                    {isSubmitting && (

                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>

                                    )}

                                    {!isSubmitting && <UserPlus className="w-4 h-4" />}

                                    {isSubmitting ? 'Creating User...' : 'Create User'}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}



            {/* Edit User Modal */}

            {showEditModal && selectedUser && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

                        <div className="flex-1 overflow-y-auto p-6">

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit User</h3>

                            <form onSubmit={handleUpdateUser} className="space-y-4">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            Email *

                                        </label>

                                        <input

                                            type="email"

                                            required

                                            value={formData.email}

                                            onChange={(e) => setFormData({...formData, email: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        />

                                    </div>

                                    

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            Role *

                                        </label>

                                        <select

                                            required

                                            value={formData.role}

                                            onChange={(e) => setFormData({...formData, role: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        >

                                            <option value="citizen">Citizen</option>

                                            <option value="staff">Staff</option>

                                            <option value="admin">Administrator</option>

                                            <option value="ps_rep">Partner School Rep</option>

                                            <option value="ssc_city_council">SSC - City Council</option>

                                            <option value="ssc_budget_dept">SSC - Budget Department</option>

                                            <option value="ssc_education_affairs">SSC - Education Affairs</option>

                                        </select>

                                    </div>

                                    

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            First Name *

                                        </label>

                                        <input

                                            type="text"

                                            required

                                            value={formData.first_name}

                                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        />

                                    </div>

                                    

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            Last Name *

                                        </label>

                                        <input

                                            type="text"

                                            required

                                            value={formData.last_name}

                                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        />

                                    </div>

                                    

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            Middle Name

                                        </label>

                                        <input

                                            type="text"

                                            value={formData.middle_name}

                                            onChange={(e) => setFormData({...formData, middle_name: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        />

                                    </div>

                                    

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                            Mobile

                                        </label>

                                        <input

                                            type="text"

                                            value={formData.mobile}

                                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}

                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                        />

                                    </div>

                                    

                                    {(formData.role === 'staff' || selectedUser.role === 'staff') && (

                                        <>

                                            <div>

                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                                    System Role

                                                </label>

                                                <select

                                                    value={formData.system_role}

                                                    onChange={(e) => setFormData({...formData, system_role: e.target.value})}

                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                                >

                                                    <option value="interviewer">Interviewer</option>

                                                    <option value="reviewer">Reviewer</option>

                                                    <option value="administrator">Administrator</option>

                                                    <option value="coordinator">Coordinator</option>

                                                </select>

                                            </div>

                                            

                                            <div>

                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                                    Department *

                                                </label>

                                                <select

                                                    value={formData.department}

                                                    onChange={(e) => setFormData({...formData, department: e.target.value})}

                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                                    required

                                                >

                                                    <option value="">Select Department</option>

                                                    <option value="Information Technology">Information Technology</option>

                                                    <option value="Human Resources">Human Resources</option>

                                                    <option value="Finance">Finance</option>

                                                    <option value="Education Affairs">Education Affairs</option>

                                                    <option value="Student Services">Student Services</option>

                                                    <option value="Administration">Administration</option>

                                                    <option value="Budget Department">Budget Department</option>

                                                    <option value="City Council">City Council</option>

                                                    <option value="Scholarship Program">Scholarship Program</option>

                                                    <option value="Assessment & Evaluation">Assessment & Evaluation</option>

                                                    <option value="Community Relations">Community Relations</option>

                                                    <option value="Legal Affairs">Legal Affairs</option>

                                                    <option value="Planning & Development">Planning & Development</option>

                                                </select>

                                            </div>

                                            

                                            <div>

                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                                                    Position *

                                                </label>

                                                <select

                                                    value={formData.position}

                                                    onChange={(e) => setFormData({...formData, position: e.target.value})}

                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

                                                    required

                                                >

                                                    <option value="">Select Position</option>

                                                    <option value="Interviewer">Interviewer</option>

                                                    <option value="Assessment Officer">Assessment Officer</option>

                                                    <option value="Evaluation Specialist">Evaluation Specialist</option>

                                                    <option value="Reviewer">Reviewer</option>

                                                    <option value="Assessment Coordinator">Assessment Coordinator</option>

                                                    <option value="Evaluation Manager">Evaluation Manager</option>

                                                    <option value="Administrator">Administrator</option>

                                                    <option value="System Administrator">System Administrator</option>

                                                    <option value="IT Administrator">IT Administrator</option>

                                                    <option value="Coordinator">Coordinator</option>

                                                    <option value="Program Coordinator">Program Coordinator</option>

                                                    <option value="Scholarship Coordinator">Scholarship Coordinator</option>

                                                    <option value="Department Head">Department Head</option>

                                                    <option value="Manager">Manager</option>

                                                    <option value="Supervisor">Supervisor</option>

                                                    <option value="Officer">Officer</option>

                                                    <option value="Specialist">Specialist</option>

                                                    <option value="Analyst">Analyst</option>

                                                    <option value="Assistant">Assistant</option>

                                                    <option value="Clerk">Clerk</option>

                                                </select>

                                            </div>

                                        </>

                                    )}

                                </div>

                                

                                <div className="flex justify-end gap-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => {

                                            setShowEditModal(false);

                                            setSelectedUser(null);

                                            resetForm();

                                        }}

                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"

                                    >

                                        Update User

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* User Action Modal */}

            <UserActionModal

                isOpen={showActionModal}

                onClose={closeActionModal}

                user={selectedActionUser}

                onActivate={handleActivateUser}

                onDeactivate={handleDeactivateUser}

                onPermanentDelete={handlePermanentDeleteUser}

                isLoading={isActionLoading}

            />



        </div>

    );

};



export default UserManagement;



