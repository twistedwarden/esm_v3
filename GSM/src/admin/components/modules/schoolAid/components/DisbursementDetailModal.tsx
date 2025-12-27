import React from 'react';
import { 
  X, 
  User, 
  School, 
  DollarSign, 
  Calendar,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';

const DisbursementDetailModal = ({ disbursement, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-base font-semibold mt-1 ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Disbursement Details</h2>
            <p className="text-sm text-gray-600 mt-1">{disbursement.scholarId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Pending Disbursement</span>
            </div>
          </div>

          {/* Scholar Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scholar Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                icon={User}
                label="Scholar Name"
                value={disbursement.scholarName}
              />
              <InfoRow
                icon={FileText}
                label="Scholar ID"
                value={disbursement.scholarId}
              />
            </div>
          </div>

          {/* School Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                icon={School}
                label="School Name"
                value={disbursement.schoolName}
              />
            </div>
          </div>

          {/* Scholarship Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scholarship Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                icon={FileText}
                label="Scholarship Type"
                value={disbursement.scholarshipType}
              />
              <InfoRow
                icon={DollarSign}
                label="Amount"
                value={formatCurrency(disbursement.amount)}
                highlight={true}
              />
              <InfoRow
                icon={Calendar}
                label="Semester/Term"
                value={disbursement.semester}
              />
              <InfoRow
                icon={Calendar}
                label="Approval Date"
                value={formatDate(disbursement.approvalDate)}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Status</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full font-medium ${
                  disbursement.priority === 'Urgent' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {disbursement.priority}
                </div>
                {disbursement.priority === 'Urgent' && (
                  <p className="text-sm text-gray-600">Requires immediate attention</p>
                )}
              </div>
            </div>
          </div>

          {/* Application History Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900">Application Approved</p>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(disbursement.approvalDate)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Awaiting Disbursement</p>
                    <p className="text-xs text-gray-600 mt-1">Current Status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisbursementDetailModal;

