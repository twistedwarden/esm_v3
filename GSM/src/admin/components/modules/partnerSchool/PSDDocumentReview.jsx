import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, Download, Eye, X } from 'lucide-react';
import { getDocuments, verifyDocument } from '../../../../services/partnerSchoolApplicationService';
import { API_CONFIG } from '../../../../config/api';
import { useAuthStore } from '../../../../store/v1authStore';

function PSDDocumentReview({ application, onClose }) {
    const { token } = useAuthStore();
    const [documents, setDocuments] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [selectedDocument, setSelectedDocument] = React.useState(null);

    React.useEffect(() => {
        if (application) {
            fetchDocuments();
        }
    }, [application]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDocuments(application.id);
            setDocuments(data);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError(err.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (documentId, status, notes = null) => {
        try {
            await verifyDocument(application.id, documentId, status, notes);
            fetchDocuments();
        } catch (err) {
            console.error('Error verifying document:', err);
            setError(err.message || 'Failed to verify document');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
            verified: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const handleViewDocument = (document) => {
        const viewUrl = document.view_url || `${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/api/partner-school/applications/${application.id}/documents/${document.id}/view`;
        
        // Fetch document with auth and open in new tab
        fetch(viewUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch document');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener,noreferrer');
                // Clean up after a delay
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            })
            .catch(error => {
                console.error('Error viewing document:', error);
                alert('Failed to view document');
            });
    };

    const handleDownloadDocument = (document) => {
        const downloadUrl = document.download_url || `${API_CONFIG.SCHOLARSHIP_SERVICE.BASE_URL}/api/partner-school/applications/${application.id}/documents/${document.id}/download`;
        
        // Fetch document with auth and trigger download
        fetch(downloadUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to download document');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = document.file_name || 'document';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Error downloading document:', error);
                alert('Failed to download document');
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Document Review</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading documents...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-800 dark:text-red-200">{error}</p>
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
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {document.file_name} ({(parseInt(document.file_size) / 1024).toFixed(2)} KB)
                                            </p>
                                            {document.verification_notes && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                                    <strong>Notes:</strong> {document.verification_notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleViewDocument(document)}
                                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View Document"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadDocument(document)}
                                                className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    {document.verification_status === 'pending' && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const notes = prompt('Verification notes (optional):');
                                                    handleVerify(document.id, 'verified', notes);
                                                }}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const notes = prompt('Rejection reason (required):');
                                                    if (notes) handleVerify(document.id, 'rejected', notes);
                                                }}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                                            >
                                                <XCircle className="w-4 h-4 inline mr-1" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {documents.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        No Documents Uploaded
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Documents will appear here once uploaded by the school.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PSDDocumentReview;
