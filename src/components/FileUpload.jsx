import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';

const FileUpload = ({ 
  value, 
  onChange, 
  accept = "image/*",
  maxSize = 16 * 1024 * 1024, // 16MB
  preview = true,
  className = "",
  disabled = false
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      alert(t('upload.fileTooLarge', 'File is too large. Maximum size is 16MB.'));
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      alert(t('upload.invalidFileType', 'Invalid file type. Please select an image file.'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.filename) {
        onChange(response.data.filename);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(t('upload.error', 'Error uploading file. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    // Otherwise, construct the URL to our backend
    return `http://localhost:5001/uploads/${filename}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        {uploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">
              {t('upload.uploading', 'Uploading...')}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                {t('upload.clickToUpload', 'Click to upload')}
              </span>
              {' ' + t('upload.orDragAndDrop', 'or drag and drop')}
            </div>
            <p className="text-xs text-gray-500">
              {t('upload.supportedFormats', 'PNG, JPG, GIF up to 16MB')}
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && value && (
        <div className="relative">
          <img
            src={getImageUrl(value)}
            alt={t('upload.preview', 'Preview')}
            className="w-full h-32 object-cover rounded-lg border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title={t('upload.remove', 'Remove image')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Current filename display */}
      {value && !preview && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
          <span className="text-gray-700 truncate">{value}</span>
          {!disabled && (
            <button
              onClick={handleRemove}
              className="ml-2 text-red-500 hover:text-red-700"
              title={t('upload.remove', 'Remove')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
