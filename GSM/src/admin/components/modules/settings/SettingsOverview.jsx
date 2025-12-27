import React, { useState, useEffect } from 'react';
import { 
    User, 
    Lock, 
    Bell, 
    Moon, 
    Settings as SettingsIcon,
    Shield,
    Database,
    Download,
    RefreshCw,
    Eye,
    EyeOff,
    Save,
    AlertCircle,
    CheckCircle,
    Server,
    BarChart3,
    Users,
    FileText,
    Trash2,
    Activity,
    Clock,
    Zap
} from 'lucide-react';
import { LoadingData } from '../../ui/LoadingSpinner';
import { settingsService } from '../../../../services/settingsService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { useAuthStore } from '../../../../store/v1authStore';
import { useLanguage } from '../../../../contexts/LanguageContext';
import translationService from '../../../../services/translationService';

function SettingsOverview() {
    const { showSuccess, showError } = useToastContext();
    const { currentUser, updateCurrentUser } = useAuthStore();
    const { t, language, changeLanguage } = useLanguage();
    
    // State management
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    
    // Profile state
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        mobile: '',
        address: ''
    });
    
    // Password state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
    
    // Notifications state
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        sms_alerts: false,
        push_notifications: true,
        weekly_reports: true,
        system_updates: true
    });
    
    // System settings state
    const [systemSettings, setSystemSettings] = useState({
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Manila',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        items_per_page: 25,
        auto_logout: 30,
        session_timeout: 60
    });
    
    // System health state
    const [systemHealth, setSystemHealth] = useState(null);
    const [adminStats, setAdminStats] = useState(null);
    
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        loadSettings();
        loadAdminData();
    }, []);

    // Load admin data (system health and stats)
    const loadAdminData = async () => {
        try {
            const [healthData, statsData] = await Promise.all([
                settingsService.getSystemHealth(),
                settingsService.getAdminStats()
            ]);
            setSystemHealth(healthData);
            setAdminStats(statsData);
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    };

    // Load settings from localStorage on mount for immediate application
    useEffect(() => {
        const loadStoredSettings = () => {
            // First try to load from system_settings object
            const storedSystemSettings = localStorage.getItem('system_settings');
            if (storedSystemSettings) {
                try {
                    const settings = JSON.parse(storedSystemSettings);
                    console.log('Loaded system settings from localStorage:', settings);
                    setSystemSettings(settings);
                    applySystemSettings(settings);
                    return;
                } catch (error) {
                    console.error('Error parsing system settings:', error);
                }
            }

            // Fallback to individual keys
            const storedTheme = localStorage.getItem('theme');
            const storedLanguage = localStorage.getItem('language');
            const storedTimezone = localStorage.getItem('timezone');
            const storedDateFormat = localStorage.getItem('date_format');
            const storedTimeFormat = localStorage.getItem('time_format');
            const storedItemsPerPage = localStorage.getItem('items_per_page');

            if (storedTheme || storedLanguage || storedTimezone || storedDateFormat || storedTimeFormat || storedItemsPerPage) {
                const storedSettings = {
                    theme: storedTheme || 'light',
                    language: storedLanguage || 'en',
                    timezone: storedTimezone || 'Asia/Manila',
                    date_format: storedDateFormat || 'MM/DD/YYYY',
                    time_format: storedTimeFormat || '12h',
                    items_per_page: storedItemsPerPage ? parseInt(storedItemsPerPage) : 25,
                    auto_logout: 30,
                    session_timeout: 60
                };
                
                console.log('Loaded individual settings from localStorage:', storedSettings);
                setSystemSettings(storedSettings);
                applySystemSettings(storedSettings);
            }
        };

        loadStoredSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            
            // Load user profile from settings service
            const userProfile = await settingsService.getCurrentUserProfile();
            setProfile({
                first_name: userProfile.first_name || userProfile.name?.split(' ')[0] || '',
                last_name: userProfile.last_name || userProfile.name?.split(' ').slice(-1)[0] || '',
                middle_name: userProfile.middle_name || '',
                email: userProfile.email || '',
                mobile: userProfile.mobile || userProfile.phone || '',
                address: userProfile.address || ''
            });
            
            // Load notification preferences
            const notificationPrefs = await settingsService.getNotificationPreferences();
            setNotifications(notificationPrefs);
            
            // Load system settings
            const systemPrefs = await settingsService.getSystemSettings();
            setSystemSettings(systemPrefs);
            
            // Apply system settings immediately
            applySystemSettings(systemPrefs);
            
            // Load system health
            try {
                const health = await settingsService.getSystemHealth();
                setSystemHealth(health);
            } catch (error) {
                console.warn('Could not load system health:', error);
            }
            
            // Load admin stats
            try {
                const stats = await settingsService.getAdminStats();
                setAdminStats(stats);
            } catch (error) {
                console.warn('Could not load admin stats:', error);
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const applySystemSettings = (settings) => {
        try {
            console.log('Applying system settings:', settings);
            
            // Ensure settings is an object
            if (!settings || typeof settings !== 'object') {
                console.warn('Invalid settings object:', settings);
                return;
            }
            
            // Apply theme
            if (settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (settings.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else if (settings.theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
            }
            
            // Store settings in localStorage for persistence
            localStorage.setItem('theme', settings.theme || 'light');
            localStorage.setItem('language', settings.language || 'en');
            localStorage.setItem('timezone', settings.timezone || 'Asia/Manila');
            localStorage.setItem('date_format', settings.date_format || 'MM/DD/YYYY');
            localStorage.setItem('time_format', settings.time_format || '12h');
            localStorage.setItem('items_per_page', (settings.items_per_page || 25).toString());
        } catch (error) {
            console.error('Error applying system settings:', error);
        }
    };

    // Password strength validation
    const validatePasswordStrength = (password) => {
        const feedback = [];
        let score = 0;

        if (password.length >= 8) {
            feedback.push({ text: 'At least 8 characters', valid: true });
            score += 20;
        } else {
            feedback.push({ text: 'At least 8 characters', valid: false });
        }

        if (/[a-z]/.test(password)) {
            feedback.push({ text: 'One lowercase letter', valid: true });
            score += 20;
        } else {
            feedback.push({ text: 'One lowercase letter', valid: false });
        }

        if (/[A-Z]/.test(password)) {
            feedback.push({ text: 'One uppercase letter', valid: true });
            score += 20;
        } else {
            feedback.push({ text: 'One uppercase letter', valid: false });
        }

        if (/\d/.test(password)) {
            feedback.push({ text: 'One number', valid: true });
            score += 20;
        } else {
            feedback.push({ text: 'One number', valid: false });
        }

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            feedback.push({ text: 'One special character', valid: true });
            score += 20;
        } else {
            feedback.push({ text: 'One special character', valid: false });
        }

        return { score, feedback };
    };

    const handleProfileChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordForm(prev => ({ ...prev, [field]: value }));
        
        if (field === 'newPassword') {
            const strength = validatePasswordStrength(value);
            setPasswordStrength(strength);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleNotificationChange = (field, value) => {
        setNotifications(prev => ({ ...prev, [field]: value }));
    };

    const handleSystemSettingChange = (field, value) => {
        console.log(`System setting changed: ${field} = ${value}`);
        const newSettings = { ...systemSettings, [field]: value };
        setSystemSettings(newSettings);
        
        // Apply theme changes immediately
        if (field === 'theme') {
            console.log(`Applying theme: ${value}`);
            if (value === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (value === 'light') {
                document.documentElement.classList.remove('dark');
            } else if (value === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
            }
            showSuccess(`Theme changed to ${value}`);
        }
        
        // Apply language changes immediately
        if (field === 'language') {
            console.log(`Applying language: ${value}`);
            changeLanguage(value);
            showSuccess(`Language changed to ${value === 'en' ? 'English' : 'Filipino'}`);
        }
        
        // Store in localStorage for immediate persistence
        localStorage.setItem(field, value);
        
        // Also update the system_settings object
        const currentSystemSettings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        currentSystemSettings[field] = value;
        localStorage.setItem('system_settings', JSON.stringify(currentSystemSettings));
        
        console.log(`Stored ${field} = ${value} in localStorage`);
    };

    const saveProfile = () => {
        setConfirmAction(() => async () => {
            try {
                setSaving(true);
                console.log('Saving profile:', profile);
                const result = await settingsService.updateUserProfile(profile);
                console.log('Profile update result:', result);
                
                // Update the auth store with the new profile data
                if (result.success && result.data) {
                    // Update the current user in the auth store using the new method
                    updateCurrentUser({
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        middle_name: profile.middle_name,
                        email: profile.email,
                        mobile: profile.mobile,
                        address: profile.address
                    });
                    
                    console.log('Profile updated in auth store');
                }
                
                showSuccess('Profile updated successfully');
            } catch (error) {
                console.error('Profile update error:', error);
                showError('Failed to update profile');
            } finally {
                setSaving(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (confirmAction) {
            await confirmAction();
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const handleCancelAction = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const changePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError('New passwords do not match');
            return;
        }

        if (passwordStrength.score < 100) {
            showError('Please ensure all password requirements are met');
            return;
        }

        try {
            setSaving(true);
            await settingsService.changePassword(passwordForm);
            showSuccess('Password changed successfully');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordStrength({ score: 0, feedback: [] });
        } catch (error) {
            showError('Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const saveNotifications = async () => {
        try {
            setSaving(true);
            await settingsService.updateNotificationPreferences(notifications);
            showSuccess('Notification preferences updated');
        } catch (error) {
            showError('Failed to update notification preferences');
        } finally {
            setSaving(false);
        }
    };

    const saveSystemSettings = () => {
        setConfirmAction(() => async () => {
            try {
                setSaving(true);
                await settingsService.updateSystemSettings(systemSettings);
                
                // Apply theme changes immediately
                if (systemSettings.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (systemSettings.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else if (systemSettings.theme === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', prefersDark);
                }
                
                // Store theme in localStorage for persistence
                localStorage.setItem('theme', systemSettings.theme);
                
                // Apply other settings
                localStorage.setItem('language', systemSettings.language);
                localStorage.setItem('timezone', systemSettings.timezone);
                localStorage.setItem('date_format', systemSettings.date_format);
                localStorage.setItem('time_format', systemSettings.time_format);
                localStorage.setItem('items_per_page', systemSettings.items_per_page.toString());
                
                showSuccess('System settings updated and applied');
            } catch (error) {
                showError('Failed to update system settings');
            } finally {
                setSaving(false);
            }
        });
        setShowConfirmModal(true);
    };

    const exportData = async (type) => {
        try {
            await settingsService.exportSystemData(type);
            showSuccess(`Data exported successfully`);
        } catch (error) {
            showError('Failed to export data');
        }
    };

    const clearCache = async () => {
        try {
            await settingsService.clearSystemCache();
            showSuccess('System cache cleared');
            // Reload admin data after clearing cache
            loadAdminData();
        } catch (error) {
            showError('Failed to clear cache');
        }
    };

    const refreshSystemData = async () => {
        try {
            await loadAdminData();
            showSuccess('System data refreshed');
        } catch (error) {
            showError('Failed to refresh system data');
        }
    };

    const backupSystem = async () => {
        try {
            // Create a comprehensive backup
            const backupData = {
                timestamp: new Date().toISOString(),
                system_settings: systemSettings,
                user_profile: profile,
                notification_preferences: notificationPrefs,
                system_health: systemHealth,
                admin_stats: adminStats
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('System backup created successfully');
        } catch (error) {
            showError('Failed to create system backup');
        }
    };

    const tabs = [
        { id: 'profile', label: t('Profile'), icon: User },
        { id: 'security', label: t('Security'), icon: Lock },
        { id: 'notifications', label: t('Notifications'), icon: Bell },
        { id: 'system', label: t('System'), icon: SettingsIcon },
        { id: 'admin', label: t('Admin Tools'), icon: Shield }
    ];

    if (loading) {
        return <LoadingData />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Manage your profile, account, notifications, and system preferences.</p>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="flex flex-col sm:flex-row sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start space-x-2 whitespace-nowrap min-w-0 ${
                                        activeTab === tab.id
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
            </div>

                <div className="p-4 sm:p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={profile.first_name}
                                        onChange={(e) => handleProfileChange('first_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={profile.last_name}
                                        onChange={(e) => handleProfileChange('last_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Middle Name</label>
                                    <input
                                        type="text"
                                        value={profile.middle_name}
                                        onChange={(e) => handleProfileChange('middle_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => handleProfileChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile</label>
                                    <input
                                        type="tel"
                                        value={profile.mobile}
                                        onChange={(e) => handleProfileChange('mobile', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                                    <textarea
                                        value={profile.address}
                                        onChange={(e) => handleProfileChange('address', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="max-w-full sm:max-w-md">
                                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-4">Change Password</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                                        <div className="relative flex">
                                            {/* Password Strength Indicator Bar */}
                                            <div className="flex flex-col justify-center mr-2">
                                                <div className={`w-1 h-8 rounded-full transition-all duration-300 ${
                                                    passwordForm.newPassword.length === 0 ? 'bg-slate-300 dark:bg-slate-600' :
                                                    passwordStrength.score < 40 ? 'bg-red-500' :
                                                    passwordStrength.score < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`} />
                                                {passwordForm.newPassword.length > 0 && (
                                                    <div className="text-xs text-center mt-1 font-medium text-slate-600 dark:text-slate-400">
                                                        {passwordStrength.score < 40 ? 'Weak' :
                                                         passwordStrength.score < 70 ? 'Medium' : 'Strong'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    placeholder="Enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('new')}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showPasswords.new ? (
                                                        <EyeOff className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {passwordForm.newPassword && (
                                            <div className="mt-2">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                passwordStrength.score < 40 ? 'bg-red-500' :
                                                                passwordStrength.score < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${passwordStrength.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">{passwordStrength.score}%</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {passwordStrength.feedback.map((item, index) => (
                                                        <div key={index} className="flex items-center space-x-2 text-sm">
                                                            {item.valid ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                            <span className={item.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                        </div>
                        <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                                        <div className="relative flex">
                                            {/* Password Match Indicator Bar */}
                                            <div className="flex flex-col justify-center mr-2">
                                                <div className={`w-1 h-8 rounded-full transition-all duration-300 ${
                                                    passwordForm.confirmPassword.length === 0 ? 'bg-slate-300 dark:bg-slate-600' :
                                                    passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0 ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                                {passwordForm.confirmPassword.length > 0 && (
                                                    <div className="text-xs text-center mt-1 font-medium text-slate-600 dark:text-slate-400">
                                                        {passwordForm.newPassword === passwordForm.confirmPassword ? 'Match' : 'No Match'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    placeholder="Confirm new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showPasswords.confirm ? (
                                                        <EyeOff className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={changePassword}
                                        disabled={saving || passwordStrength.score < 100 || passwordForm.newPassword !== passwordForm.confirmPassword}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        <span>{saving ? 'Changing...' : 'Change Password'}</span>
                                    </button>
                        </div>
                    </div>
                </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">

                            {/* Regular Notification Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                                {Object.entries(notifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {key === 'email_notifications' && 'Receive notifications via email'}
                                                {key === 'sms_alerts' && 'Receive SMS alerts for important updates'}
                                                {key === 'push_notifications' && 'Receive push notifications in browser'}
                                                {key === 'weekly_reports' && 'Receive weekly summary reports'}
                                                {key === 'system_updates' && 'Receive system maintenance notifications'}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => handleNotificationChange(key, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={saveNotifications}
                                    disabled={saving}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* System Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Theme')}</label>
                                    <select
                                        value={systemSettings.theme}
                                        onChange={(e) => handleSystemSettingChange('theme', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="light">{t('Light')}</option>
                                        <option value="dark">{t('Dark')}</option>
                                        <option value="auto">{t('Auto')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Language')}</label>
                                    <select
                                        value={systemSettings.language}
                                        onChange={(e) => handleSystemSettingChange('language', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="en">{t('English')}</option>
                                        <option value="fil">{t('Filipino')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Timezone')}</label>
                                    <select
                                        value={systemSettings.timezone}
                                        onChange={(e) => handleSystemSettingChange('timezone', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="Asia/Manila">Asia/Manila</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Date Format')}</label>
                                    <select
                                        value={systemSettings.date_format}
                                        onChange={(e) => handleSystemSettingChange('date_format', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Time Format')}</label>
                                    <select
                                        value={systemSettings.time_format}
                                        onChange={(e) => handleSystemSettingChange('time_format', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="12h">{t('12 Hour')}</option>
                                        <option value="24h">{t('24 Hour')}</option>
                                    </select>
                    </div>
                        <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('Items Per Page')}</label>
                                    <select
                                        value={systemSettings.items_per_page}
                                        onChange={(e) => handleSystemSettingChange('items_per_page', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                        </div>
                    </div>
                            {/* Debug Info */}
                            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Settings (Debug)</h4>
                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                    <div>Theme: {systemSettings.theme}</div>
                                    <div>Language: {systemSettings.language}</div>
                                    <div>Timezone: {systemSettings.timezone}</div>
                                    <div>Date Format: {systemSettings.date_format}</div>
                                    <div>Time Format: {systemSettings.time_format}</div>
                                    <div>Items Per Page: {systemSettings.items_per_page}</div>
                                    <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
                                        <div><strong>Translation Status:</strong></div>
                                        <div>Has Translations: {translationService.getStatus().hasTranslations ? 'Yes' : 'No'}</div>
                                        <div>Translation Count: {translationService.getStatus().translationCount}</div>
                                        <div>Current Language Translations: {translationService.getStatus().currentLanguageTranslations}</div>
                                        <div>Using Fallback: {translationService.getStatus().isUsingFallback ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={saveSystemSettings}
                                    disabled={saving}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{saving ? t('Saving...') : t('Save Settings')}</span>
                                </button>
                            </div>
                </div>
                    )}

                    {/* Admin Tools Tab */}
                    {activeTab === 'admin' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* System Health */}
                            {systemHealth && (
                                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                                            <Server className="w-5 h-5 mr-2" />
                                            System Health
                                        </h3>
                                        <button
                                            onClick={refreshSystemData}
                                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                            title="Refresh system health"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{systemHealth.uptime || '99.9%'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{width: '99.9%'}}></div>
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{systemHealth.memory_usage || '45%'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Memory Usage</div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">{systemHealth.cpu_usage || '23%'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">CPU Usage</div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                                                <div className="bg-orange-500 h-2 rounded-full" style={{width: '23%'}}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                                        Last updated: {systemHealth.last_updated ? new Date(systemHealth.last_updated).toLocaleString() : 'Never'}
                                    </div>
                                </div>
                            )}

                            {/* Admin Stats */}
                            {adminStats && (
                                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                                            <BarChart3 className="w-5 h-5 mr-2" />
                                            System Statistics
                                        </h3>
                                        <button
                                            onClick={refreshSystemData}
                                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                            title="Refresh statistics"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{adminStats.total_users || '0'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Total Users</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered</div>
                                        </div>
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{adminStats.active_sessions || '0'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Active Sessions</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently online</div>
                                        </div>
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{adminStats.total_requests || '0'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">API Requests</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total processed</div>
                                        </div>
                                        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{adminStats.error_rate || '0%'}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">Error Rate</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">System errors</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admin Actions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <button
                                    onClick={() => exportData('users')}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Users className="w-6 h-6 text-blue-500" />
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Export Users</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Download user data as CSV</div>
                                </button>

                                <button
                                    onClick={() => exportData('applications')}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <FileText className="w-6 h-6 text-green-500" />
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Export Applications</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Download application data</div>
                                </button>

                                <button
                                    onClick={clearCache}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <RefreshCw className="w-6 h-6 text-orange-500" />
                                        <Zap className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Clear Cache</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Clear system cache</div>
                                </button>

                                <button
                                    onClick={refreshSystemData}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Activity className="w-6 h-6 text-purple-500" />
                                        <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">Refresh Data</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Update system statistics</div>
                                </button>

                                <button
                                    onClick={backupSystem}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Database className="w-6 h-6 text-indigo-500" />
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">System Backup</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Create system backup</div>
                                </button>

                                <button
                                    onClick={() => window.open('/admin/logs', '_blank')}
                                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <FileText className="w-6 h-6 text-red-500" />
                                        <Clock className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                                    </div>
                                    <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white">View Logs</div>
                                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Access system logs</div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
    {/* Confirmation Modal */}
    {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('Confirm Settings Update')}
                    </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {t('Are you sure you want to save these changes? This will update your settings in the database and apply them immediately.')}
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleCancelAction}
                        disabled={saving}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        {t('Cancel')}
                    </button>
                    <button
                        onClick={handleConfirmAction}
                        disabled={saving}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>{t('Saving...')}</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>{t('Save Changes')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )}
        </div>
    );
}

export default SettingsOverview; 