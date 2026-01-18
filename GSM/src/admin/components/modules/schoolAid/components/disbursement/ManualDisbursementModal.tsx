import React, { useState, useRef } from 'react';
import { X, Upload, PhilippinePeso, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { ScholarshipApplication } from '../../types';

interface ManualDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ScholarshipApplication | null;
  onSubmit: (data: DisbursementFormData) => Promise<void>;
  isSubmitting: boolean;
}

export interface DisbursementFormData {
  method: string;
  providerName: string;
  referenceNumber: string;
  receiptFile: File | null;
  notes: string;
}

const ManualDisbursementModal: React.FC<ManualDisbursementModalProps> = ({
  isOpen,
  onClose,
  application,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<DisbursementFormData>({
    method: 'bank_transfer',
    providerName: '',
    referenceNumber: '',
    receiptFile: null,
    notes: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof DisbursementFormData, string>>>({});
  const [dragActive, setDragActive] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !application) return null;

  const validateForm = () => {
    const newErrors: Partial<Record<keyof DisbursementFormData, string>> = {};
    
    if (!formData.method) newErrors.method = 'Payment method is required';
    if (!formData.providerName) newErrors.providerName = 'Provider name is required';
    if (!formData.referenceNumber) newErrors.referenceNumber = 'Reference number is required';
    if (!formData.receiptFile) newErrors.receiptFile = 'Receipt upload is mandatory';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof DisbursementFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, receiptFile: 'Invalid file type. Please upload JPG, PNG, or PDF.' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, receiptFile: 'File size exceeds 5MB limit.' }));
      return;
    }

    setFormData(prev => ({ ...prev, receiptFile: file }));
    setErrors(prev => ({ ...prev, receiptFile: undefined }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return '****';
    if (accountNumber.length <= 4) return '****';
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Process Disbursement</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Enter transfer details for {application.studentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center text-blue-900 dark:text-blue-100 mb-1">
                <PhilippinePeso className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Disbursement Amount</span>
              </div>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(application.amount)}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-gray-700 dark:text-gray-300 mb-1">
                <span className="text-sm font-medium">Student Account</span>
                <button
                  type="button"
                  onClick={() => setShowAccountDetails(!showAccountDetails)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showAccountDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {application.paymentMethod ? application.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}
                </span>
                <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                  {showAccountDetails 
                    ? (application.walletAccountNumber || 'Not provided') 
                    : maskAccountNumber(application.walletAccountNumber)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
              </select>
              {errors.method && <p className="mt-1 text-xs text-red-500">{errors.method}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Provider Name
              </label>
              <input
                type="text"
                name="providerName"
                value={formData.providerName}
                onChange={handleChange}
                placeholder="e.g. BDO, GCash"
                className={`w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 ${errors.providerName ? 'border-red-500' : ''}`}
              />
              {errors.providerName && <p className="mt-1 text-xs text-red-500">{errors.providerName}</p>}
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Transaction Reference Number
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleChange}
              placeholder="Enter unique transaction ID"
              className={`w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 ${errors.referenceNumber ? 'border-red-500' : ''}`}
            />
            {errors.referenceNumber && <p className="mt-1 text-xs text-red-500">{errors.referenceNumber}</p>}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Upload Receipt / Proof of Transfer <span className="text-red-500">*</span>
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-blue-400'}
                ${errors.receiptFile ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              
              {formData.receiptFile ? (
                <div className="flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{formData.receiptFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, PDF (Max 5MB)
                  </p>
                </>
              )}
            </div>
            {errors.receiptFile && <p className="mt-1 text-xs text-red-500">{errors.receiptFile}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any internal notes..."
              className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Confirm Disbursement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualDisbursementModal;
