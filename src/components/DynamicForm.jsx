import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FileUpload from './FileUpload';
import MediaUploadField from './MediaUploadField';

const DynamicForm = ({
  fields = [],
  initialData = {},
  onSubmit,
  onCancel,
  onDelete,
  title,
  submitText,
  isLoading = false,
  canDelete = false,
  isEdit = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    fields.forEach(field => {
      if (field.required && (!formData[field.key] || formData[field.key].toString().trim() === '')) {
        newErrors[field.key] = t('common.fieldRequired', 'This field is required');
      }

      // Custom validation
      if (field.validation && formData[field.key]) {
        const validationError = field.validation(formData[field.key]);
        if (validationError) {
          newErrors[field.key] = validationError;
        }
      }

      // Email validation
      if (field.type === 'email' && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key])) {
          newErrors[field.key] = t('common.invalidEmail', 'Invalid email format');
        }
      }

      // Date validation
      if (field.type === 'date' && formData[field.key]) {
        const dateValue = new Date(formData[field.key]);
        if (isNaN(dateValue.getTime())) {
          newErrors[field.key] = t('common.invalidDate', 'Invalid date format');
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormLoading = isLoading || submitting;

    const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(formData);
      if (result && result.success) {
        // Form saved successfully - parent component will handle modal closing
      } else if (result && result.error) {
        setErrors(prev => ({
          ...prev,
          general: result.error
        }));
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setErrors(prev => ({
        ...prev,
        general: t('form.saveError', 'An error occurred while saving')
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(formData);
    }
    setShowDeleteConfirm(false);
  };

  const renderField = (field) => {
    const commonProps = {
      id: `field-${field.key}`,
      value: formData[field.key] || '',
      onChange: (e) => handleChange(field.key, e.target.value),
      disabled: field.disabled || isFormLoading,
      placeholder: field.placeholder,
      className: `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
        errors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
      }`
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return <input type={field.type} {...commonProps} />;

      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );

      case 'date':
        return <input type="date" {...commonProps} />;

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            {field.placeholder && (
              <option value="">{field.placeholder}</option>
            )}
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            {...commonProps}
            checked={formData[field.key] || false}
            onChange={(e) => handleChange(field.key, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        );

      case 'file':
        return (
          <FileUpload
            value={formData[field.key] || ''}
            onChange={(filename) => handleChange(field.key, filename)}
            accept={field.accept || "image/*"}
            disabled={field.disabled || isFormLoading}
            preview={field.preview !== false}
            className={field.className || ''}
          />
        );

      case 'media':
        return (
          <MediaUploadField
            value={formData[field.key] || []}
            onChange={(files) => handleChange(field.key, files)}
            maxFiles={field.maxFiles || 5}
            label={field.label}
            required={field.required}
            error={errors[field.key]}
          />
        );

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title || (isEdit ? t('common.edit', 'Edit') : t('common.create', 'Create'))}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isFormLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General error display */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.general}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.key || index} className={field.fullWidth ? 'col-span-2' : ''}>
                <label 
                  htmlFor={`field-${field.key}`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                
                {renderField(field)}
                
                {errors[field.key] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors[field.key]}
                  </p>
                )}
                
                {field.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isFormLoading}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-gray-800 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                {t('common.delete', 'Delete')}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isFormLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            
            <button
              type="button"
              disabled={isFormLoading}
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isFormLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {submitText || t('common.save', 'Save')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('common.confirmDelete', 'Confirm Delete')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t('common.deleteWarning', 'Are you sure you want to delete this item? This action cannot be undone.')}
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  {t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicForm;
