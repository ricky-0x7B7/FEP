import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import { PlusIcon, XMarkIcon, PhotoIcon, VideoCameraIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function MediaUploadField({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  label,
  required = false,
  error 
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  const handleFileSelect = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const remainingSlots = maxFiles - safeValue.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = filesToProcess.map(async (file) => {
        console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout for large files
        });

        const fileType = file.type.startsWith('video/') ? 'video' : 'photo';
        console.log('Upload successful:', response.data);
        
        return {
          path: response.data.filename,
          type: fileType,
          description: '',
          url: response.data.url,
          originalName: file.name
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newValue = [...safeValue, ...uploadedFiles];
      onChange(newValue);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown upload error';
      alert(t('upload.error', 'Error uploading file') + ': ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    const newValue = safeValue.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const updateFileDescription = (index, description) => {
    const newValue = safeValue.map((file, i) => 
      i === index ? { ...file, description } : file
    );
    onChange(newValue);
  };

  const moveFile = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= safeValue.length) return;
    
    const newValue = [...safeValue];
    const [moved] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, moved);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {safeValue.length < maxFiles && (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('upload.uploading', 'Uploading...')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-12 w-12 text-gray-400 mx-auto">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {t('upload.clickToUpload', 'Click to upload')}
                </span>
                {' ' + t('upload.orDragAndDrop', 'or drag and drop')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {t('upload.supportedFormats', 'PNG, JPG, GIF, MP4, AVI up to 50MB')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {t('upload.remaining', '{{remaining}} remaining', { remaining: maxFiles - safeValue.length })}
              </div>
            </div>
          )}
        </div>
      )}

      {safeValue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('upload.uploadedFiles', 'Uploaded Files')} ({safeValue.length}/{maxFiles})
            </span>
          </div>
          
          {safeValue.map((file, index) => (
            <div key={index} className={`border rounded-lg p-4 ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {file.type === 'video' ? (
                    <VideoCameraIcon className="h-8 w-8 text-purple-500" />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-green-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.originalName || file.path}
                    </p>
                    
                    <div className="flex items-center space-x-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveFile(index, index - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title={t('upload.moveUp', 'Move up')}
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => moveFile(index, index + 1)}
                        disabled={index === safeValue.length - 1}
                        className={`p-1 ${index === safeValue.length - 1 
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                        title={t('upload.moveDown', 'Move down')}
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title={t('upload.remove', 'Remove file')}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <textarea
                      placeholder={t('upload.descriptionPlaceholder', 'Add a description for this file...')}
                      value={file.description || ''}
                      onChange={(e) => updateFileDescription(index, e.target.value)}
                      className={`w-full text-sm border rounded p-2 resize-none ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}