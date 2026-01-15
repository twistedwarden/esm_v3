import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { checkPasswordResetRequired, forcePasswordReset } from '../../services/partnerSchoolAccountService';

interface ForcedPasswordResetProps {
    onSuccess?: () => void;
}

const ForcedPasswordReset: React.FC<ForcedPasswordResetProps> = ({ onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    useEffect(() => {
        checkRequirement();
    }, [newPassword]);

    const checkRequirement = () => {
        const requirements = {
            length: newPassword.length >= 10,
            uppercase: /[A-Z]/.test(newPassword),
            lowercase: /[a-z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[!@#$%^&*]/.test(newPassword),
        };
        setPasswordRequirements(requirements);
        
        const strength = Object.values(requirements).filter(Boolean).length;
        setPasswordStrength(strength);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwordStrength < 5) {
            setError('Password does not meet all requirements');
            return;
        }

        try {
            setLoading(true);
            await forcePasswordReset(currentPassword, newPassword, confirmPassword);
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.href = '/partner-school/documents';
            }
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.message || 'Failed to reset password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        if (passwordStrength <= 4) return 'bg-blue-500';
        return 'bg-green-500';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                            <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Password Reset Required</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                You must change your password before continuing
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {passwordStrength}/5
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className={`flex items-center gap-2 ${passwordRequirements.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {passwordRequirements.length ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        At least 10 characters
                                    </div>
                                    <div className={`flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {passwordRequirements.uppercase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        One uppercase letter
                                    </div>
                                    <div className={`flex items-center gap-2 ${passwordRequirements.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {passwordRequirements.lowercase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        One lowercase letter
                                    </div>
                                    <div className={`flex items-center gap-2 ${passwordRequirements.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {passwordRequirements.number ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        One number
                                    </div>
                                    <div className={`flex items-center gap-2 ${passwordRequirements.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {passwordRequirements.special ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        One special character (!@#$%^&*)
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || passwordStrength < 5 || newPassword !== confirmPassword}
                            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForcedPasswordReset;
