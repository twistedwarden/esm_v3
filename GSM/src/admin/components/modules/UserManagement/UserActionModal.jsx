import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, UserX, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const UserActionModal = ({
    isOpen,
    onClose,
    user,
    onActivate,
    onDeactivate,
    onPermanentDelete,
    isLoading
}) => {
    // Show modal when open and user is available
    if (!isOpen || !user) {
        return null;
    }

    const isActive = user.is_active;

    const handleActivate = () => {
        onActivate(user.id);
    };

    const handleDeactivate = () => {
        onDeactivate(user.id);
    };

    const handlePermanentDelete = () => {
        onPermanentDelete(user.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isActive
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : 'bg-red-100 dark:bg-red-900/20'
                            }`}>
                            {isActive ? (
                                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                User Actions
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.first_name} {user.last_name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                }`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isActive
                                ? 'This user is currently active and can access the system.'
                                : 'This user is currently inactive and cannot access the system.'
                            }
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {isActive ? (
                            // Active user actions
                            <>
                                <button
                                    onClick={handleDeactivate}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserX className="w-4 h-4" />
                                    <span>Deactivate User</span>
                                </button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Deactivating will prevent the user from accessing the system but can be restored.
                                </p>
                            </>
                        ) : (
                            // Inactive user actions
                            <>
                                <button
                                    onClick={handleActivate}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Activate User</span>
                                </button>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <button
                                        onClick={handlePermanentDelete}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Permanently Delete</span>
                                    </button>
                                    <div className="flex items-start space-x-2 mt-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-700 dark:text-red-300">
                                            <strong>Warning:</strong> This action cannot be undone. The user will be completely removed from the database.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserActionModal;

