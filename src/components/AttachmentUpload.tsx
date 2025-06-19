/**
 * AttachmentUpload Component
 * 
 * Handles file uploads with drag & drop functionality
 * Supports images, PDFs, and text files
 * Shows previews and upload progress
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, AlertCircle, Check } from 'lucide-react';
import { attachmentService } from '../lib/attachments';
import { useAuth } from '../contexts/AuthContext';

interface AttachmentUploadProps {
  onAttachmentUploaded: (attachment: any) => void;
  onError: (error: string) => void;
  isDark: boolean;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  attachment?: any;
}

export default function AttachmentUpload({
  onAttachmentUploaded,
  onError,
  isDark,
  maxFiles = 5,
  disabled = false
}: AttachmentUploadProps) {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json'
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Bestandstype ${file.type} is niet toegestaan`;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return 'Bestand is te groot (max 10MB)';
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    if (!user) {
      onError('You must be logged in to upload files');
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      setUploadingFiles(prev => prev.map(uf => 
        uf.file === file 
          ? { ...uf, status: 'error', error: validation }
          : uf
      ));
      return;
    }

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file && uf.status === 'uploading'
            ? { ...uf, progress: Math.min(uf.progress + 10, 90) }
            : uf
        ));
      }, 200);

      const attachment = await attachmentService.uploadAttachment({
        file,
        userId: user.id
      });

      clearInterval(progressInterval);

      setUploadingFiles(prev => prev.map(uf => 
        uf.file === file 
          ? { ...uf, status: 'success', progress: 100, attachment }
          : uf
      ));

      onAttachmentUploaded(attachment);

      // Remove from uploading list after 2 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
      }, 2000);

    } catch (error: any) {
      setUploadingFiles(prev => prev.map(uf => 
        uf.file === file 
          ? { ...uf, status: 'error', error: error.message }
          : uf
      ));
      onError(error.message);
    }
  };

  const handleFiles = useCallback((files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    if (uploadingFiles.length + fileArray.length > maxFiles) {
      onError(`Je kunt maximaal ${maxFiles} bestanden tegelijk uploaden`);
      return;
    }

    const newUploadingFiles: UploadingFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Start uploading each file
    fileArray.forEach(uploadFile);
  }, [disabled, uploadingFiles.length, maxFiles, user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileSelect = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? (isDark ? 'border-purple-400 bg-purple-900/20' : 'border-purple-500 bg-purple-50')
            : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload className={`w-8 h-8 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        
        <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Drag files here or click to select
        </p>
        
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Supported: Images, PDF, Text (max 10MB per file)
        </p>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => {
            const FileIcon = getFileIcon(uploadingFile.file.type);
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <FileIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {uploadingFile.file.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatFileSize(uploadingFile.file.size)}
                  </p>
                </div>

                {/* Progress/Status */}
                <div className="flex items-center gap-2">
                  {uploadingFile.status === 'uploading' && (
                    <>
                      <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {uploadingFile.progress}%
                      </span>
                    </>
                  )}
                  
                  {uploadingFile.status === 'success' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadingFile(uploadingFile.file);
                    }}
                    className={`p-1 rounded-full hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700' : ''}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Messages */}
      {uploadingFiles.some(uf => uf.status === 'error') && (
        <div className="space-y-1">
          {uploadingFiles
            .filter(uf => uf.status === 'error')
            .map((uploadingFile, index) => (
              <p key={index} className="text-sm text-red-500">
                {uploadingFile.file.name}: {uploadingFile.error}
              </p>
            ))}
        </div>
      )}
    </div>
  );
} 
