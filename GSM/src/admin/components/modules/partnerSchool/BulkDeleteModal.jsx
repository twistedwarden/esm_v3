import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedSchools, isDeleting }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');

  const requiredText = "CONFIRM DELETE";
  const isConfirmationValid = confirmationText === requiredText;

  const handleConfirm = () => {
    if (!isConfirmationValid) {
      setError(`Please type "${requiredText}" to confirm deletion`);
      return;
    }

    onConfirm();
    setConfirmationText('');
    setError('');
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setError('');
      onClose();
    }
  };

  // Show modal when open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Delete Schools</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
              You are about to delete <span className="font-semibold text-red-600 dark:text-red-400">{selectedSchools.length}</span> school{selectedSchools.length !== 1 ? 's' : ''}:
            </p>
            
            <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mb-4">
              {selectedSchools.map((school, index) => (
                <div key={school.id} className="text-sm text-gray-700 dark:text-slate-300 py-1">
                  {index + 1}. {school.name} ({school.classification})
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Type <span className="font-mono bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-red-600 dark:text-red-400">{requiredText}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                error ? 'border-red-300' : 'border-gray-300 dark:border-slate-600'
              }`}
              placeholder={`Type "${requiredText}" here`}
              disabled={isDeleting}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <p className="font-medium mb-1">Warning: This action is permanent!</p>
                <p>All selected schools and their associated data will be permanently deleted. This action cannot be undone.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 flex items-center"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedSchools.length} School{selectedSchools.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;
