import React, { useState, useEffect } from 'react';
import { Shield, Lock, Clock, Save, RefreshCw, Zap, Sliders } from 'lucide-react';
import { useToastContext } from '../../../../components/providers/ToastProvider';
import { getAuthServiceUrl } from '../../../../config/api';
import { useAuthStore } from '../../../../store/v1authStore';

const AUTH_API = getAuthServiceUrl('/api');

const SecuritySettings = () => {
    const { success: showSuccess, error: showError } = useToastContext();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const setSessionDuration = useAuthStore(state => state.setSessionDuration);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${AUTH_API}/security-settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSettings(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching security settings:', error);
            showError('Failed to load security settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${AUTH_API}/security-settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
                if (data.data.session_timeout_duration) {
                    setSessionDuration(parseInt(data.data.session_timeout_duration));
                }
                showSuccess('Security settings saved successfully');
            } else {
                throw new Error(data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving security settings:', error);
            showError('Failed to save security settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        const intValue = parseInt(value);
        if (!isNaN(intValue)) {
            setSettings(prev => ({ ...prev, [key]: intValue }));
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0m';
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        const m = Math.floor(seconds / 60);
        return `${m}m` + (seconds % 60 ? ` ${seconds % 60}s` : '');
    };

    const sections = [
        {
            id: 'session',
            title: "Session Control",
            description: "Manage how long users can stay active without interaction.",
            icon: Clock,
            items: [
                {
                    key: 'session_timeout_duration',
                    label: 'Session Idle Timeout',
                    helper: 'Time before auto-logout',
                    min: 60,
                    max: 3600, // Slider max 1 hour, input can go higher
                    step: 60,
                    unit: 'seconds',
                    format: formatDuration
                }
            ]
        },
        {
            id: 'lockout',
            title: "Access Protection",
            description: "Configure policies to prevent brute-force attacks.",
            icon: Shield,
            items: [
                {
                    key: 'login_warning_threshold',
                    label: 'Warning Threshold',
                    helper: 'Attempts before showing warning',
                    min: 1,
                    max: 10,
                    step: 1,
                    unit: 'attempts',
                    format: (v) => `${v} attempts`
                },
                {
                    key: 'login_lockout_threshold',
                    label: 'Lockout Threshold',
                    helper: 'Attempts before locking account',
                    min: 3,
                    max: 20,
                    step: 1,
                    unit: 'attempts',
                    format: (v) => `${v} attempts`
                },
                {
                    key: 'login_lockout_duration',
                    label: 'Lockout Duration',
                    helper: 'How long to lock the account',
                    min: 60,
                    max: 3600,
                    step: 60,
                    unit: 'seconds',
                    format: formatDuration
                },
                {
                    key: 'login_attempt_window',
                    label: 'Reset Window',
                    helper: 'Time needed to reset failure count',
                    min: 300,
                    max: 3600,
                    step: 300,
                    unit: 'seconds',
                    format: formatDuration
                }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-500" />
                        Security Configuration
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Fine-tune your application's security parameters.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm active:transform active:scale-95"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 gap-6">
                {sections.map(section => (
                    <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

                        {/* Section Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <section.icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {section.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {section.description}
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="p-6 space-y-8">
                            {section.items.map(item => {
                                const value = settings[item.key] || item.min;
                                const displayValue = item.format(value);

                                return (
                                    <div key={item.key} className="group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                            <div className="mb-2 sm:mb-0">
                                                <label className="text-base font-medium text-gray-800 dark:text-gray-200 block">
                                                    {item.label}
                                                </label>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {item.helper}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-md min-w-[80px] text-center">
                                                    {displayValue}
                                                </span>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={value}
                                                        onChange={(e) => handleChange(item.key, e.target.value)}
                                                        min={item.min}
                                                        className="w-20 pl-2 pr-1 py-1 text-right text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative pt-1">
                                            <input
                                                type="range"
                                                min={item.min}
                                                max={item.max}
                                                step={item.step}
                                                value={value > item.max ? item.max : value} // prevent slider overflow if input is manually higher
                                                onChange={(e) => handleChange(item.key, e.target.value)}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            />
                                            <div className="flex justify-between mt-1 text-xs text-gray-400">
                                                <span>{item.format(item.min)}</span>
                                                <span>{item.format(item.max)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecuritySettings;
