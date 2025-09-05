/**
 * Field definitions for different record types
 * These configurations define the form fields for CreateRecordForm component
 */

export const getNewsFields = (t) => {
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
      optionsKey: 'children', // Will be populated by CreateRecordForm
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
      type: 'media', // Multiple media upload using MediaUploadField
      required: false,
      maxFiles: 5,
      fullWidth: true
    }
  ];
};

export const getChildrenFields = (t) => {
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
      optionsKey: 'missions', // Will be populated by CreateRecordForm
      placeholder: t('form.selectMission', 'Select a mission...')
    },
    {
      key: 'media_files',
      label: t('children.photos', 'Photos & Videos'),
      type: 'media', // Changed from single 'file' to multiple 'media'
      required: false,
      maxFiles: 10, // Allow more files for children (profile photos, videos, etc.)
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
};

export const getUserFields = (t) => {
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
      key: 'password',
      label: t('users.password', 'Password'),
      type: 'password',
      required: true,
      placeholder: t('form.passwordPlaceholder', 'Enter password...'),
      fullWidth: true
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
      optionsKey: 'roles', // Will be populated by CreateRecordForm
      placeholder: t('form.selectRole', 'Select user role...')
    },
    {
      key: 'media_files',
      label: t('users.profilePictures', 'Profile Pictures'),
      type: 'media', // Multiple media upload for user profiles
      required: false,
      maxFiles: 3, // Reasonable limit for profile pictures
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
};

/**
 * Get field definitions by table name
 * @param {string} tableName - The table name ('news', 'children', 'users')
 * @param {function} t - Translation function
 * @returns {Array} Field definitions array
 */
export const getFieldDefinitions = (tableName, t) => {
  switch (tableName) {
    case 'news':
      return getNewsFields(t);
    case 'children':
      return getChildrenFields(t);
    case 'users':
      return getUserFields(t);
    default:
      console.warn(`Unknown table name: ${tableName}`);
      return [];
  }
};