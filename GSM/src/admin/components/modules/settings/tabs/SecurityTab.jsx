import React from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import SecuritySettings from '../SecuritySettings';

const SecurityTab = ({
    passwordForm,
    handlePasswordChange,
    showPasswords,
    togglePasswordVisibility,
    passwordStrength,
    changePassword,
    saving
}) => {
    return (
        <div className="space-y-6">
            {/* Change Password Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-xl">
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
                                <div className={`w-1 h-8 rounded-full transition-all duration-300 ${passwordForm.newPassword.length === 0 ? 'bg-slate-300 dark:bg-slate-600' :
                                    passwordStrength.score < 40 ? 'bg-red-500' :
                                        passwordStrength.score < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
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
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score < 40 ? 'bg-red-500' :
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
                            <div className="flex flex-col justify-center mr-2">
                                <div className={`w-1 h-8 rounded-full transition-all duration-300 ${passwordForm.confirmPassword.length === 0 ? 'bg-slate-300 dark:bg-slate-600' :
                                    passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
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

            {/* Login Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SecuritySettings />
            </div>
        </div>
    );
};

export default SecurityTab;
