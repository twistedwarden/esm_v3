import React, { useState, useEffect } from 'react';
import {
    User,
    Lock,
    Bell,
    Settings as SettingsIcon,
    Shield
} from 'lucide-react';
import { LoadingData } from '../../ui/LoadingSpinner';
import { settingsService } from '../../../../services/settingsService';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { useAuthStore } from '../../../../store/v1authStore';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Import new components
import SettingsSidebar from './SettingsSidebar';
import ProfileSettingsTab from './tabs/ProfileSettingsTab';
import SecurityTab from './tabs/SecurityTab';
import NotificationSettingsTab from './tabs/NotificationSettingsTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import AdminToolsTab from './tabs/AdminToolsTab';

function SettingsOverview() {
    const { showSuccess, showError } = useToastContext();
    const { updateCurrentUser } = useAuthStore();
    const { t, changeLanguage } = useLanguage();

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
            // Ensure settings is an object
            if (!settings || typeof settings !== 'object') {
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
        const newSettings = { ...systemSettings, [field]: value };
        setSystemSettings(newSettings);

        // Apply theme changes immediately
        if (field === 'theme') {
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
            changeLanguage(value);
            showSuccess(`Language changed to ${value === 'en' ? 'English' : 'Filipino'}`);
        }

        // Store in localStorage for immediate persistence
        localStorage.setItem(field, value);

        // Also update the system_settings object
        const currentSystemSettings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        currentSystemSettings[field] = value;
        localStorage.setItem('system_settings', JSON.stringify(currentSystemSettings));
    };

    const saveProfile = () => {
        setConfirmAction(() => async () => {
            try {
                setSaving(true);
                const result = await settingsService.updateUserProfile(profile);

                // Update the auth store with the new profile data
                if (result.success && result.data) {
                    updateCurrentUser({
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        middle_name: profile.middle_name,
                        email: profile.email,
                        mobile: profile.mobile,
                        address: profile.address
                    });
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

    const handleConfirmActionHelper = async () => {
        if (confirmAction) {
            await confirmAction();
        }
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
                notification_preferences: notifications,
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

    const sidebarItems = [
        { id: 'profile', label: t('Profile'), icon: User },
        { id: 'security', label: t('Security'), icon: Lock },
        { id: 'notifications', label: t('Notifications'), icon: Bell },
        { id: 'system', label: t('System'), icon: SettingsIcon },
        { id: 'admin', label: t('Admin Tools'), icon: Shield }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettingsTab
                    profile={profile}
                    handleProfileChange={handleProfileChange}
                    saveProfile={saveProfile}
                    saving={saving}
                />;
            case 'security':
                return <SecurityTab
                    passwordForm={passwordForm}
                    handlePasswordChange={handlePasswordChange}
                    showPasswords={showPasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    passwordStrength={passwordStrength}
                    changePassword={changePassword}
                    saving={saving}
                />;
            case 'notifications':
                return <NotificationSettingsTab
                    notifications={notifications}
                    handleNotificationChange={handleNotificationChange}
                    saveNotifications={saveNotifications}
                    saving={saving}
                />;
            case 'system':
                return <SystemSettingsTab
                    systemSettings={systemSettings}
                    handleSystemSettingChange={handleSystemSettingChange}
                    saveSystemSettings={saveSystemSettings}
                    saving={saving}
                    t={t}
                />;
            case 'admin':
                return <AdminToolsTab
                    handleConfirmAction={handleConfirmActionHelper}
                    exportData={exportData}
                    clearCache={clearCache}
                    refreshSystemData={refreshSystemData}
                    backupSystem={backupSystem}
                    t={t}
                />;
            default:
                return null;
        }
    };

    if (loading) {
        return <LoadingData />;
    }

    return (
        <div className="space-y-6 container mx-auto px-4 max-w-7xl">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Manage your profile, account, notifications, and system preferences.</p>
            </div>

            {/* Sidebar Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <SettingsSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    items={sidebarItems}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Confirm Action</h3>
                        <p className="mb-6 text-slate-600 dark:text-slate-400">Are you sure you want to proceed with this action?</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmActionHelper}
                                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SettingsOverview;