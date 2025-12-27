import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';

const BatchProcessingModal = ({ selectedItems, disbursements, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    method: 'bank',
    scheduleDate: '',
    groupBySchool: true,
    notes: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const selectedDisbursements = disbursements.filter(d => selectedItems.includes(d.id));
  const totalAmount = selectedDisbursements.reduce((sum, d) => sum + d.amount, 0);
  
  // Group by school if option is selected
  const groupedBySchool = formData.groupBySchool
    ? selectedDisbursements.reduce((acc, d) => {
        if (!acc[d.schoolName]) {
          acc[d.schoolName] = [];
        }
        acc[d.schoolName].push(d);
        return acc;
      }, {})
    : null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.scheduleDate) {
      setError('Please select a schedule date');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const response = await fetch('/api/disbursements/process-batch', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     disbursementIds: selectedItems,
      //     method: formData.method,
      //     scheduleDate: formData.scheduleDate,
      //     groupBySchool: formData.groupBySchool,
      //     notes: formData.notes,
      //   }),
      // });

      onSuccess();
    } catch (err) {
      setError('Failed to process batch. Please try again.');
      console.error('Error processing batch:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Process Disbursement Batch</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Selected Records</p>
                <p className="text-2xl font-bold text-blue-900">{selectedItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Disbursement Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Disbursement Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="bank"
                  checked={formData.method === 'bank'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">Bank Transfer</span>
                <span className="ml-auto text-xs text-gray-500">Recommended</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="check"
                  checked={formData.method === 'check'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">Check</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="cash"
                  checked={formData.method === 'cash'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">Cash</span>
              </label>
            </div>
          </div>

          {/* Schedule Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Schedule Date
            </label>
            <input
              type="date"
              value={formData.scheduleDate}
              onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Group by School */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.groupBySchool}
                onChange={(e) => setFormData({ ...formData, groupBySchool: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Group by School</span>
                <p className="text-xs text-gray-600 mt-1">
                  Create separate payment transactions for each school
                </p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {formData.groupBySchool && groupedBySchool && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Preview (Grouped by School)
              </label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                {Object.entries(groupedBySchool).map(([school, records]) => {
                  const schoolTotal = records.reduce((sum, r) => sum + r.amount, 0);
                  return (
                    <div key={school} className="p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{school}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {records.length} scholar{records.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(schoolTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add any additional notes or instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Confirm & Process
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchProcessingModal;

