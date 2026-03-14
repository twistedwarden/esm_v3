import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Clock, Shield, Trash2, Loader2 } from 'lucide-react';
import { validateUploadFile, formatFileSize, getFileTypeIcon, type FileValidationResult } from '../../utils/fileValidation';
import { API_CONFIG, getScholarshipServiceUrl } from '../../config/api';

export interface SecureDocumentUploadProps {
  documentTypeId: string | number;
  documentTypeName: string;
  studentId: number;
  applicationId: number;
  isUploading?: boolean;
  disabled?: boolean;
  existingDocument?: any;
  applicationStatus?: string;
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
  disabled = false,
  existingDocument,
  applicationStatus,
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


  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log(`🔌 SecureDocumentUpload mounted for ${documentTypeName} (ID: ${documentTypeId})`);
    return () => console.log(`🔌 SecureDocumentUpload unmounted for ${documentTypeName}`);
  }, [documentTypeName, documentTypeId]);

  const triggerFileInput = (e: React.MouseEvent) => {
    if (disabled || isUploading) return;
    // Only trigger if not clicking something interactive inside
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Manually triggering file input click');
    fileInputRef.current?.click();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled, isUploading]);

  const handleFileSelect = async (file: File) => {
    console.log('🔍 File selected:', file.name, file.type, file.size);
    setIsValidating(true);
    setSelectedFile(file);
    setValidationResult(null);

    try {
      console.log('🔒 Starting validation...');
      const result = await validateUploadFile(file, {
        maxSizeMB,
        allowedTypes: acceptedTypes,
        checkSignature: true,
        checkPDFSafety: true
      });

      console.log('✅ Validation result:', result);
      setValidationResult(result);

      if (result.isValid) {
        console.log('📤 Starting upload...');
        // Auto-upload valid files
        await handleUpload(file);
      } else {
        console.error('❌ Validation failed:', result.error);
        // Provide more detailed error message
        const errorMessage = result.error || 'File validation failed';
        onUploadError(errorMessage);

        // Log detailed diagnostics for debugging
        console.group('🔍 File Validation Diagnostics');
        console.log('File Name:', file.name);
        console.log('File Type (Browser):', file.type || '(empty)');
        console.log('File Size:', file.size);
        console.log('Allowed Types:', acceptedTypes);
        console.groupEnd();
      }
    } catch (error) {
      console.error('💥 File validation error:', error);
      onUploadError('File validation failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled, isUploading]);

  const handleUpload = async (file: File) => {
    console.log('🚀 Upload started for:', file.name);
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
        credentials: 'include',
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
    console.log('📁 File input changed, files:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('📄 File found:', file.name);
      handleFileSelect(file);
    } else {
      console.warn('⚠️ No file selected');
    }
    // Reset value to allow selecting the same file again
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationResult(null);
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
    const isApplicationApproved = applicationStatus && ['approved', 'grants_processing', 'grants_disbursed'].includes(applicationStatus.toLowerCase());
    const displayStatus = isApplicationApproved ? 'verified' : existingDocument.status;

    let existingDocColor = 'border-blue-200 bg-white';
    let existingDocIcon = <Shield className="h-4 w-4 text-blue-500" />;

    if (displayStatus === 'verified') {
      existingDocColor = 'border-green-300 bg-green-50';
      existingDocIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (displayStatus === 'rejected') {
      existingDocColor = 'border-red-300 bg-red-50';
      existingDocIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    return (
      <div className={`p-3 rounded-lg border ${existingDocColor} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {existingDocIcon}
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
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${displayStatus === 'verified'
              ? 'bg-green-100 text-green-800'
              : displayStatus === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
              }`}>
              {displayStatus === 'verified' ? '✓ Verified' :
                displayStatus === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
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
        className={`w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${
          disabled ? 'opacity-50 pointer-events-none bg-gray-50 border-gray-200 cursor-not-allowed' :
          dragActive
          ? 'border-orange-400 bg-orange-50 cursor-pointer'
          : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {isUploading || isValidating ? (
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            ) : (
              getStatusIcon()
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            {isUploading ? '⏳ Uploading file...' :
              isValidating ? '🔒 Validating file...' :
                validationResult?.isValid ? 'File validated ✓' :
                  validationResult && !validationResult.isValid ? 'Validation failed' :
                    `Upload ${documentTypeName}`}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Drag and drop or click to browse
          </p>

          {selectedFile && (
            <div className="mb-3 p-2 bg-gray-50 rounded border text-left" onClick={(e) => e.stopPropagation()}>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
            isUploading || isValidating
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
            }`}>
            {isUploading || isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            <span>{isUploading ? 'Uploading...' : isValidating ? 'Validating...' : 'Choose File'}</span>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Max {maxSizeMB}MB • {acceptedTypes.join(', ')}
          </p>

          {/* Inline Error Display */}
          {validationResult && !validationResult.isValid && (
            <div className="mt-3 mx-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 text-center animate-pulse">
              <p className="font-semibold">Upload Failed</p>
              <p>{validationResult.error}</p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading || isValidating || disabled}
      />

      {/* Validation Warnings */}
      {
        validationResult?.warnings && validationResult.warnings.length > 0 && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            {validationResult.warnings.map((warning, index) => (
              <p key={index}>⚠️ {warning}</p>
            ))}
          </div>
        )
      }

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Shield className="h-3 w-3" />
        <span>Files are automatically scanned for security threats</span>
      </div>
    </div >
  );
};
