import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { ScholarshipApplication } from '../../types';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ScholarshipApplication | null;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  application
}) => {
  if (!isOpen || !application || !application.proofOfTransferUrl) return null;

  const isPdf = application.proofOfTransferUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Proof of Transfer</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Transaction Ref: {application.transactionReference || 'N/A'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <a 
              href={application.proofOfTransferUrl} 
              download
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-900 p-4 flex items-center justify-center">
          {isPdf ? (
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white font-medium mb-2">PDF Document</p>
              <a 
                href={application.proofOfTransferUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Open in new tab <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          ) : (
            <img 
              src={application.proofOfTransferUrl} 
              alt="Proof of Transfer" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-xl">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400">
            <span>Disbursed to: {application.studentName}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
