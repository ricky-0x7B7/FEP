import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicForm from './DynamicForm';
import { api } from '../utils/api';

/**
 * CreateRecordForm - A DRY reusable component for creating new records in any database table
 * 
 * @param {string} tableName - The database table to operate on ('news', 'children', 'users')
 * @param {string} title - Custom title for the form modal
 * @param {Object} user - Current user object for permissions and creator tracking
 * @param {Function} onSuccess - Callback function called after successful creation
 * @param {Function} onCancel - Callback function called when form is cancelled
 * @param {boolean} visible - Whether the form modal is visible
 */
const CreateRecordForm = ({
  tableName,
  title,
  user,
  onSuccess,
  onCancel,
  visible = false
}) => {
  const { t } = useTranslation();
  const [formOptions, setFormOptions] = useState({});
  const [loading, setLoading] = useState(false);

  // Get field definitions based on table name
  const getFieldDefinitions = () => {
    switch (tableName) {
      case 'news':
        return [
          {
            key: 'title',
            label: t('news.title', 'Title'),
            type: 'text',
            required: true,
            placeholder: t('form.titlePlaceholder', 'Enter news title...'),
            fullWidth: true
          },
          {
            key: 'child_id',
            label: t('news.child', 'Child'),
            type: 'select',
            required: true,
            optionsKey: 'children',
            placeholder: t('form.selectChild', 'Select a child...')
          },
          {
            key: 'date',
            label: t('news.date', 'Date'),
            type: 'date',
            required: true
          },
          {
            key: 'content',
            label: t('news.content', 'Content'),
            type: 'textarea',
            required: true,
            rows: 5,
            fullWidth: true,
            placeholder: t('form.contentPlaceholder', 'Enter news content...')
          },
          {
            key: 'media_files',
            label: t('news.attachments', 'Photos & Videos'),
            type: 'media',
            required: false,
            maxFiles: 5,
            fullWidth: true
          }
        ];

      case 'children':
        return [
          {
            key: 'name',
            label: t('children.name', 'Name'),
            type: 'text',
            required: true,
            placeholder: t('form.namePlaceholder', 'Enter child name...'),
            fullWidth: true
          },
          {
            key: 'gender',
            label: t('children.gender', 'Gender'),
            type: 'select',
            required: true,
            options: [
              { value: 'man', label: t('form.man', 'Man') },
              { value: 'woman', label: t('form.woman', 'Woman') }
            ],
            placeholder: t('form.selectGender', 'Select gender...')
          },
          {
            key: 'birth_date',
            label: t('children.birthDate', 'Birth Date'),
            type: 'date',
            required: true,
            fullWidth: true
          },
          {
            key: 'mission_id',
            label: t('children.mission', 'Mission'),
            type: 'select',
            required: true,
            optionsKey: 'missions',
            placeholder: t('form.selectMission', 'Select a mission...')
          },
          {
            key: 'media_files',
            label: t('children.photos', 'Photos & Videos'),
            type: 'media',
            required: false,
            maxFiles: 10,
            fullWidth: true
          },
          {
            key: 'description',
            label: t('children.description', 'Description'),
            type: 'textarea',
            required: false,
            rows: 4,
            fullWidth: true,
            placeholder: t('form.descriptionPlaceholder', 'Enter a brief description about the child...')
          }
        ];

      case 'users':
        return [
          {
            key: 'username',
            label: t('users.username', 'Username'),
            type: 'text',
            required: true,
            placeholder: t('form.usernamePlaceholder', 'Enter username...'),
            fullWidth: true
          },
          {
            key: 'email',
            label: t('users.email', 'Email'),
            type: 'email',
            required: true,
            placeholder: t('form.emailPlaceholder', 'Enter email address...'),
            fullWidth: true
          },
          {
            key: 'phone',
            label: t('users.phone', 'Phone'),
            type: 'tel',
            required: false,
            placeholder: t('form.phonePlaceholder', 'Enter phone number...'),
            fullWidth: true
          },
          {
            key: 'password',
            label: t('users.password', 'Password'),
            type: 'password',
            required: true,
            placeholder: t('form.passwordPlaceholder', 'Enter password...'),
            fullWidth: true
          },
          {
            key: 'confirmPassword',
            label: t('users.confirmPassword', 'Confirm Password'),
            type: 'password',
            required: true,
            placeholder: t('form.confirmPasswordPlaceholder', 'Confirm password...'),
            fullWidth: true,
            dependsOn: 'password'
          },
          {
            key: 'name',
            label: t('users.name', 'Full Name'),
            type: 'text',
            required: true,
            placeholder: t('form.fullNamePlaceholder', 'Enter full name...'),
            fullWidth: true
          },
          {
            key: 'role',
            label: t('users.role', 'Role'),
            type: 'select',
            required: true,
            optionsKey: 'roles',
            placeholder: t('form.selectRole', 'Select user role...')
          },
          {
            key: 'media_files',
            label: t('users.profilePictures', 'Profile Pictures'),
            type: 'media',
            required: false,
            maxFiles: 3,
            fullWidth: true
          },
          {
            key: 'bio',
            label: t('users.bio', 'Biography'),
            type: 'textarea',
            required: false,
            rows: 3,
            fullWidth: true,
            placeholder: t('form.bioPlaceholder', 'Enter user biography...')
          }
        ];

      default:
        console.warn(`Unknown table name: ${tableName}`);
        return [];
    }
  };

  // Load form options (dropdowns data) when component mounts
  useEffect(() => {
    if (visible) {
      console.log('CreateRecordForm: Loading options for table:', tableName);
      loadFormOptions();
    }
  }, [visible, tableName]);

  /**
   * Load dropdown options based on table requirements
   */
  const loadFormOptions = async () => {
    try {
      setLoading(true);
      const options = {};

      // Load different options based on table type
      switch (tableName) {
        case 'news':
          const [childrenRes, missionsRes] = await Promise.all([
            api.get('/children?user_role=admin'),
            api.get('/missions')
          ]);
          options.children = childrenRes.data.map(child => ({
            value: child.id,
            label: child.name
          }));
          options.missions = missionsRes.data.map(mission => ({
            value: mission.id,
            label: mission.name
          }));
          break;

        case 'children':
          const missionsResponse = await api.get('/missions');
          options.missions = missionsResponse.data.map(mission => ({
            value: mission.id,
            label: mission.name
          }));
          break;

        case 'users':
          // Users typically don't need dropdown options, but can be extended
          options.roles = [
            { value: 'admin', label: t('users.admin', 'Admin') },
            { value: 'referent', label: t('users.referent', 'Local Referent') },
            { value: 'sponsor', label: t('users.sponsor', 'Sponsor') }
          ];
          break;

        default:
          console.warn(`Unknown table type: ${tableName}`);
      }

      setFormOptions(options);
    } catch (error) {
      console.error('Error loading form options:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process field definitions and inject loaded options
   */
  const getProcessedFields = () => {
    const fieldDefinitions = getFieldDefinitions();
    console.log('CreateRecordForm: Processing fields for', tableName, ':', fieldDefinitions);
    
    return fieldDefinitions.map(field => {
      const processedField = { ...field };

      // Inject options for select fields based on field key
      if (field.type === 'select' && field.optionsKey) {
        processedField.options = formOptions[field.optionsKey] || [];
        console.log(`CreateRecordForm: Injecting options for ${field.key}:`, processedField.options);
      }

      return processedField;
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (formData) => {
    try {
      console.log('CreateRecordForm: Submitting data for', tableName, ':', formData);
      
      // Validate password confirmation for users
      if (tableName === 'users' && formData.password) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(t('users.passwordMismatch', 'Passwords do not match'));
        }
      }
      
      // Add creator information if user is available
      const submitData = {
        ...formData,
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      // Remove confirmPassword from data sent to backend
      if (tableName === 'users') {
        delete submitData.confirmPassword;
      }

      console.log('CreateRecordForm: Final submit data:', submitData);

      // Remove empty media arrays to avoid backend issues
      if (submitData.media_files && Array.isArray(submitData.media_files) && submitData.media_files.length === 0) {
        delete submitData.media_files;
      }

      // Call appropriate API endpoint based on table name
      const endpoint = getApiEndpoint();
      console.log('CreateRecordForm: Calling API endpoint:', endpoint);
      
      const response = await api.post(endpoint, submitData);
      console.log('CreateRecordForm: API response:', response.data);

      // Call success callback with created record
      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;
    } catch (error) {
      console.error(`CreateRecordForm: Error creating ${tableName} record:`, error);
      throw error;
    }
  };

  /**
   * Get API endpoint based on table name
   */
  const getApiEndpoint = () => {
    const endpointMap = {
      'news': '/news',
      'children': '/children',
      'users': '/users'
    };

    return endpointMap[tableName] || `/${tableName}`;
  };

  /**
   * Get default form title based on table name
   */
  const getDefaultTitle = () => {
    const titleMap = {
      'news': t('news.createNew', 'Create New News'),
      'children': t('children.addChild', 'Add New Child'),
      'users': t('users.addUser', 'Add New User')
    };

    return titleMap[tableName] || t('common.create', 'Create New Record');
  };

  if (!visible) {
    return null;
  }

  // Create initial data with sensible defaults
  const initialFormData = {
    date: new Date().toISOString().split('T')[0], // Today's date as default
    media_files: []
  };

  console.log('CreateRecordForm: Rendering form with initial data:', initialFormData);

  return (
    <DynamicForm
      fields={getProcessedFields()}
      initialData={initialFormData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={title || getDefaultTitle()}
      submitText={t('common.create', 'Create')}
      isLoading={loading}
      isEdit={false}
    />
  );
};

export default CreateRecordForm;