import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Clock, Shield, Trash2 } from 'lucide-react';
import { validateUploadFile, formatFileSize, getFileTypeIcon, type FileValidationResult } from '../../utils/fileValidation';
import { API_CONFIG, getScholarshipServiceUrl } from '../../config/api';

export interface SecureDocumentUploadProps {
  documentTypeId: string | number;
  documentTypeName: string;
  studentId: number;
  applicationId: number;
  isUploading?: boolean;
  existingDocument?: any;
  onUploadStart: () => void;
  onUploadSuccess: (document: any) => void;
  onUploadError: (error: string) => void;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const SecureDocumentUpload: React.FC<SecureDocumentUploadProps> = ({
  documentTypeId,
  documentTypeName,
  studentId,
  applicationId,
  isUploading = false,
  existingDocument,
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  showRemoveButton = false,
  onRemove,
  maxSizeMB = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsValidating(true);
    setSelectedFile(file);
    setValidationResult(null);

    try {
      const result = await validateUploadFile(file, {
        maxSizeMB,
        allowedTypes: acceptedTypes,
        checkSignature: true,
        checkPDFSafety: true
      });

      setValidationResult(result);
      
      if (result.isValid) {
        // Auto-upload valid files
        await handleUpload(file);
      } else {
        onUploadError(result.error || 'File validation failed');
      }
    } catch (error) {
      console.error('File validation error:', error);
      onUploadError('File validation failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async (file: File) => {
    onUploadStart();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_id', studentId.toString());
      formData.append('application_id', applicationId.toString());
      formData.append('document_type_id', documentTypeId.toString());

      const uploadUrl = getScholarshipServiceUrl(API_CONFIG.SCHOLARSHIP_SERVICE.ENDPOINTS.FORM_UPLOAD_DOCUMENT);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      onUploadSuccess(result.data);
      
      // Reset state
      setSelectedFile(null);
      setValidationResult(null);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Enhanced error handling for security rejections
      if (errorMessage.includes('security') || errorMessage.includes('virus')) {
        onUploadError('⚠️ Security Alert: ' + errorMessage);
      } else {
        onUploadError(errorMessage);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    if (isValidating) return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    if (validationResult?.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (validationResult && !validationResult.isValid) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Shield className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (isValidating) return 'border-blue-300 bg-blue-50';
    if (validationResult?.isValid) return 'border-green-300 bg-green-50';
    if (validationResult && !validationResult.isValid) return 'border-red-300 bg-red-50';
    return 'border-gray-300 bg-white';
  };

  // If document already exists, show current status
  if (existingDocument) {
    return (
      <div className={`p-3 rounded-lg border ${getStatusColor()} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {existingDocument.file_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(existingDocument.file_size || 0)} • 
                {new Date(existingDocument.created_at).toLocaleDateString()}
              </p>
              {existingDocument.verification_notes && (
                <p className="text-xs text-amber-600 mt-1">
                  Note: {existingDocument.verification_notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
              existingDocument.status === 'verified' 
                ? 'bg-green-100 text-green-800'
                : existingDocument.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {existingDocument.status === 'verified' ? '✓ Verified' : 
               existingDocument.status === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
            </span>
            {showRemoveButton && onRemove && (
              <button
                onClick={onRemove}
                disabled={isUploading}
                className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                title="Remove document"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive 
            ? 'border-orange-400 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {getStatusIcon()}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            {isValidating ? 'Validating file...' : 
             validationResult?.isValid ? 'File validated ✓' :
             validationResult && !validationResult.isValid ? 'Validation failed' :
             `Upload ${documentTypeName}`}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Drag and drop or click to browse
          </p>
          
          {selectedFile && (
            <div className="mb-3 p-2 bg-gray-50 rounded border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-lg">{getFileTypeIcon(selectedFile)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.map(type => `.${type.split('/')[1]}`).join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isValidating}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isUploading || isValidating
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose File'}
          </button>
          
          <p className="text-xs text-gray-400 mt-2">
            Max {maxSizeMB}MB • {acceptedTypes.join(', ')}
          </p>
        </div>
      </div>

      {/* Validation Warnings */}
      {validationResult?.warnings && validationResult.warnings.length > 0 && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {validationResult.warnings.map((warning, index) => (
            <p key={index}>⚠️ {warning}</p>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Shield className="h-3 w-3" />
        <span>Files are automatically scanned for security threats</span>
      </div>
    </div>
  );
};
