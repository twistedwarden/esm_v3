import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  GraduationCap,
  PhilippinePeso,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  School,
  Award,
  Eye,
  Download
} from 'lucide-react';
import { API_CONFIG } from '../../../../config/api';

function ApplicationViewModal({ isOpen, onClose, application }) {
  const [activeTab, setActiveTab] = useState('personal');

  // Show modal when open and application is available
  if (!isOpen || !application) {
    return null;
  }

  const student = application.student;
  const school = application.school;
  const category = application.category;
  const subcategory = application.subcategory;

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic Records', icon: GraduationCap },
    { id: 'financial', label: 'Financial Info', icon: PhilippinePeso },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  const getDocumentUrl = (document) => {
    if (document.file_path) {
      return document.file_path.startsWith('http')
        ? document.file_path
        : `${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/storage/${document.file_path}`;
    }
    return null;
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.first_name} {student?.middle_name} {student?.last_name} {student?.extension_name}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Student ID:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.student_id_number || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Sex:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.sex || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Civil Status:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.civil_status || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Birth Date:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.birth_date ? new Date(student.birth_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Nationality:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.nationality || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Phone className="w-4 h-4 mr-2" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Contact Number:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.contact_number || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Email Address:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {student?.email_address || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Address Information */}
      {student?.addresses && student.addresses.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Address Information
          </h4>
          <div className="space-y-3">
            {student.addresses.map((address, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {address.type} Address
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {address.house_number} {address.street}, {address.barangay}, {address.city}, {address.province}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAcademicInfo = () => (
    <div className="space-y-6">
      {/* Current Academic Record */}
      {student?.current_academic_record && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <School className="w-4 h-4 mr-2" />
            Current Academic Record
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Program:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.current_academic_record.program || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Year Level:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.current_academic_record.year_level || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">General Weighted Average:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.current_academic_record.general_weighted_average || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">School:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {school?.name || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Academic Records History */}
      {student?.academic_records && student.academic_records.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Academic History</h4>
          <div className="space-y-3">
            {student.academic_records.map((record, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">School Year:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {record.school_year || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">GWA:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {record.general_weighted_average || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {record.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="space-y-6">
      {/* Financial Information */}
      {student?.financial_information && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <PhilippinePeso className="w-4 h-4 mr-2" />
            Financial Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Family Monthly Income Range:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.financial_information.family_monthly_income_range || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Number of Dependents:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.financial_information.number_of_dependents || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Father's Occupation:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.financial_information.father_occupation || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Mother's Occupation:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {student.financial_information.mother_occupation || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Application Financial Details */}
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Application Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Requested Amount:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              ₱{application?.requested_amount ? parseFloat(application.requested_amount).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Scholarship Category:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {category?.name || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Subcategory:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {subcategory?.name || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Application Status:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {application?.status || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Need Description */}
      {application?.financial_need_description && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Financial Need Description</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {application.financial_need_description}
          </p>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      {application?.documents && application.documents.length > 0 ? (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Uploaded Documents
          </h4>
          <div className="space-y-3">
            {application.documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between bg-white dark:bg-slate-600 p-3 rounded-lg border border-gray-200 dark:border-slate-500">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {document.document_type?.name || document.file_name || 'Unknown Document'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded on {new Date(document.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {getDocumentUrl(document) && (
                  <a
                    href={getDocumentUrl(document)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Documents Uploaded</h3>
          <p className="text-gray-600 dark:text-gray-400">No documents have been uploaded for this application.</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'academic':
        return renderAcademicInfo();
      case 'financial':
        return renderFinancialInfo();
      case 'documents':
        return renderDocuments();
      default:
        return renderPersonalInfo();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Application Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {student?.first_name} {student?.last_name} - {application?.application_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ApplicationViewModal;
