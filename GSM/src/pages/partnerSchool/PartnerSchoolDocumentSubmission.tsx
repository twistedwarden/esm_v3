import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, XCircle, Clock, Download, AlertCircle, FileCheck } from 'lucide-react';
import { getApplication, uploadDocument, getDocuments } from '../../services/partnerSchoolApplicationService';
import { getGuidelines } from '../../services/partnerSchoolGuidelinesService';
import { API_CONFIG } from '../../config/api';

const PartnerSchoolDocumentSubmission: React.FC = () => {
    const [application, setApplication] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [guidelines, setGuidelines] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Get application ID from URL or user context
    const applicationId = new URLSearchParams(window.location.search).get('applicationId') || null;

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
            fetchDocuments();
        }
        fetchGuidelines();
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            setLoading(true);
            const data = await getApplication(applicationId!);
            setApplication(data);
        } catch (err: any) {
            console.error('Error fetching application:', err);
            setError(err.message || 'Failed to load application');
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        if (!applicationId) return;
        try {
            const data = await getDocuments(applicationId);
            setDocuments(data);
        } catch (err: any) {
            console.error('Error fetching documents:', err);
        }
    };

    const fetchGuidelines = async () => {
        try {
            const data = await getGuidelines();
            setGuidelines(data);
        } catch (err: any) {
            console.error('Error fetching guidelines:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !applicationId) return;

        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX');
            return;
        }

        const documentType = prompt('Document type (accreditation, license, registration, other):') || 'other';
        const documentName = prompt('Document name:') || file.name;

        if (!documentName) {
            setError('Document name is required');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            setUploadProgress(0);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await uploadDocument(applicationId, file, documentType, documentName);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Reset file input
            e.target.value = '';
            fetchDocuments();
            fetchApplication();

            setTimeout(() => setUploadProgress(0), 1000);
        } catch (err: any) {
            console.error('Error uploading document:', err);
            setError(err.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const getDocumentUrl = (document: any) => {
        // Use the API endpoint URL if available, otherwise fall back to direct path
        if (document.view_url) {
            return document.view_url;
        }
        if (document.download_url) {
            return document.download_url;
        }
        // Fallback to direct path (may not work due to 403)
        const baseUrl = API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL;
        return `${baseUrl}/storage/${document.file_path}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
            verified: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    if (!applicationId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Application Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please access this page with a valid application ID.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-6 py-6 max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Submission</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Upload verification documents for your partner school application
                    </p>
                </div>
            </div>

            <div className="px-6 py-6 max-w-5xl mx-auto">
                {/* Application Status */}
                {application && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Status</h2>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${
                                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {application.school && (
                                <span className="text-gray-700 dark:text-gray-300">{application.school.name}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Guidelines Reference */}
                {Object.keys(guidelines).length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Required Documents</h2>
                        <div className="space-y-2">
                            {guidelines.requirements && guidelines.requirements.map((guideline: any) => (
                                <div key={guideline.id} className="text-sm text-gray-700 dark:text-gray-300">
                                    • {guideline.title}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Upload Area */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Document</h2>
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Drag and drop files here, or click to select
                        </p>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg cursor-pointer disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Select File'}
                        </label>
                        {uploadProgress > 0 && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{uploadProgress}%</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            Maximum file size: 10MB. Allowed formats: PDF, JPG, PNG, DOC, DOCX
                        </p>
                    </div>
                </div>

                {/* Uploaded Documents */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Uploaded Documents</h2>
                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents.map((document) => (
                                <div
                                    key={document.id}
                                    className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded ${getStatusColor(document.verification_status)}`}>
                                                    {getStatusIcon(document.verification_status)}
                                                    <span className="ml-1 capitalize">{document.verification_status}</span>
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {document.document_type}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {document.document_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {document.file_name} ({(parseInt(document.file_size) / 1024).toFixed(2)} KB)
                                            </p>
                                            {document.verification_notes && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                                    <strong>Admin Notes:</strong> {document.verification_notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <a
                                                href={getDocumentUrl(document)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View"
                                            >
                                                <FileCheck className="w-5 h-5" />
                                            </a>
                                            <a
                                                href={getDocumentUrl(document)}
                                                download
                                                className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerSchoolDocumentSubmission;
