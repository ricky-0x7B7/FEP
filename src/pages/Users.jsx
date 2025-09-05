import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslatedField } from '../hooks/useTranslatedField';
import EnhancedDataTable from '../components/EnhancedDataTable';
import DynamicForm from '../components/DynamicForm';
import CreateRecordForm from '../components/CreateRecordForm';
import { api } from '../utils/api';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ShieldCheckIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function Users({ user }) {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false); // For editing existing users
  const [showCreateForm, setShowCreateForm] = useState(false); // CreateRecordForm for new users
  const [editingUser, setEditingUser] = useState(null);

  // Get current user info
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser?.role || '';
  const userId = currentUser?.id;

  // Permission checks - only admin can access this page
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    console.log('Translation for users.title:', t('users.title', { ns: 'translation' }));
    console.log('Translation for users.description:', t('users.description', { ns: 'translation' }));
    console.log('Translation for users.bio:', t('users.bio', { ns: 'translation' }));
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(t('users.fetchError', 'Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userItem) => {
    // Prepare user data for editing (exclude sensitive fields)
    const editData = {
      id: userItem.id,
      username: userItem.username,
      email: userItem.email,
      phone: userItem.phone,
      name: userItem.full_name || userItem.name, // Map full_name from DB to name for form
      role: userItem.role,
      bio: userItem.bio,
      media_files: userItem.media || []
    };
    setEditingUser(editData);
    setShowForm(true);
  };

  const handleDelete = async (userItem) => {
    // Prevent self-deletion
    if (userItem.id === userId) {
      alert(t('users.cannotDeleteSelf', 'You cannot delete your own account'));
      return;
    }

    if (window.confirm(t('users.confirmDelete', 'Are you sure you want to delete this user? This action cannot be undone.'))) {
      try {
        await api.delete(`/users/${userItem.id}`);
        fetchUsers(); // Refresh the list
        alert(t('users.deleteSuccess', 'User deleted successfully'));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(t('users.deleteError', 'Failed to delete user'));
      }
    }
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (newRecord) => {
    console.log('User created successfully:', newRecord);
    setShowCreateForm(false);
    fetchUsers(); // Refresh the users list
  };

  const handleFormSave = async (formData) => {
    try {
      console.log('Saving user data:', formData);
      console.log('Bio field value:', formData.bio);
      
      // Validate password confirmation if password is provided
      if (formData.password && formData.password.trim() !== '') {
        if (formData.password !== formData.confirmPassword) {
          return { 
            success: false, 
            error: t('users.passwordMismatch', 'Passwords do not match')
          };
        }
      }
      
      // Prepare data (exclude password if not provided for existing users)
      const dataToSend = {
        ...formData,
        ui_language: i18n.language, // Add language info like in missions
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      console.log('Data to send with bio:', dataToSend);

      // Remove confirmPassword from data sent to backend
      delete dataToSend.confirmPassword;

      // For existing users, only include password if it's provided
      if (editingUser && (!formData.password || formData.password.trim() === '')) {
        delete dataToSend.password;
      }

      let savedUser;
      if (editingUser) {
        const response = await api.put(`/users/${editingUser.id}`, dataToSend);
        savedUser = response.data;
      } else {
        const response = await api.post('/users', dataToSend);
        savedUser = response.data;
      }
      
      setShowForm(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Error saving user:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || t('users.saveError', 'Error saving user')
      };
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  // Define the form fields for users (editing)
  const userFields = [
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
      required: !editingUser, // Required for new users, optional for editing
      placeholder: editingUser ? t('form.passwordOptional', 'Leave blank to keep current password') : t('form.passwordPlaceholder', 'Enter password...'),
      fullWidth: true
    },
    {
      key: 'confirmPassword',
      label: t('users.confirmPassword', 'Confirm Password'),
      type: 'password',
      required: !editingUser, // Required for new users, optional for editing
      placeholder: editingUser ? t('form.confirmPasswordOptional', 'Confirm new password') : t('form.confirmPasswordPlaceholder', 'Confirm password...'),
      fullWidth: true,
      dependsOn: 'password' // This field depends on password field
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
      options: [
        { value: 'admin', label: t('users.admin', 'Admin') },
        { value: 'referent', label: t('users.referent', 'Local Referent') },
        { value: 'sponsor', label: t('users.sponsor', 'Sponsor') }
      ],
      placeholder: t('form.selectRole', 'Select user role...')
    },
    {
      key: 'bio',
      label: t('users.bio', 'Biography'),
      type: 'textarea',
      required: false,
      rows: 3,
      fullWidth: true,
      placeholder: t('translation.placeholders.default', 'Write in your native language, automatic translation enabled...')
    }
  ];

  // Component for translated bio display (simplified like missions)
  const TranslatedBio = ({ userId, originalBio }) => {
    // If no bio content, show placeholder message
    if (!originalBio || originalBio.trim() === '') {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate italic">
          {t('users.noBio', 'No bio available')}
        </div>
      );
    }

    const { translatedText, isLoading, error } = useTranslatedField('user', userId, 'bio', originalBio);
    
    if (isLoading) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
          <span className="opacity-50">{t('translation.loading', 'Translating...')}</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {originalBio}
        </div>
      );
    }
    
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
        {translatedText || originalBio}
      </div>
    );
  };

  // Enhanced columns definition for EnhancedDataTable
  const enhancedColumns = [
    {
      key: 'username',
      label: t('users.username', 'Username'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
            {value.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'full_name',
      label: t('users.name', 'Full Name'),
      sortable: true,
      filterable: true
    },
    {
      key: 'email',
      label: t('users.email', 'Email'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
      )
    },
    {
      key: 'role',
      label: t('users.role', 'Role'),
      sortable: true,
      filterable: true,
      render: (value) => {
        const roleConfig = {
          admin: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: '👑', label: t('users.admin', 'Admin') },
          referent: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '🌍', label: t('users.referent', 'Referent') },
          sponsor: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '❤️', label: t('users.sponsor', 'Sponsor') }
        };
        const config = roleConfig[value] || { color: 'bg-gray-100 text-gray-800', icon: '👤', label: value };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'phone',
      label: t('users.phone', 'Phone'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{value || '-'}</span>
      )
    },
    {
      key: 'bio',
      label: t('users.bio', 'Bio'),
      sortable: false,
      filterable: true,
      render: (value, row) => (
        <TranslatedBio userId={row.id} originalBio={value} />
      )
    }
  ];

  // Action handlers for EnhancedDataTable
  const handleView = (userItem) => {
    // TODO: Implement view user details
    console.log('View user:', userItem);
  };

  const handleExport = (data) => {
    // Custom export for users with sensitive data handling
    const exportData = data.map(user => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      bio: user.bio || ''
      // Exclude sensitive fields like password
    }));

    const headers = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Phone', 'Bio'];
    const rows = exportData.map(user => [
      user.id,
      user.username,
      user.full_name,
      user.email,
      user.role,
      user.phone,
      user.bio
    ]);
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('users.accessDenied', 'Access Denied')}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t('users.adminOnly', 'This section is only accessible to administrators.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            {t('common.loading', 'Loading...')}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              👥 {t('users.title', 'Users Management')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('users.description', 'Manage system users, roles, and permissions')}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('users.create', 'Add User')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Referents</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'referent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">❤️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sponsors</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'sponsor').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Users Table */}
      <EnhancedDataTable
        data={users}
        columns={enhancedColumns}
        title={t('users.list', 'Users List')}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(user) => user.id !== userId ? handleDelete : null}
        onExport={handleExport}
        enablePagination={true}
        enableExport={true}
        enableViewToggle={true}
        defaultPageSize={10}
        searchPlaceholder={t('users.searchPlaceholder', 'Search users by name, email, or role...')}
        emptyMessage={t('users.empty', 'No users found')}
      />

      {/* Edit User Form Modal */}
      {showForm && editingUser && (
        <DynamicForm
          fields={userFields}
          initialData={editingUser}
          onSubmit={handleFormSave}
          onCancel={handleFormCancel}
          onDelete={() => handleDelete(editingUser)}
          title={t('form.editUser', 'Edit User')}
          canDelete={editingUser.id !== userId} // Prevent self-deletion
          isEdit={true}
        />
      )}

      {/* Create User Form Modal */}
      <CreateRecordForm
        tableName="users"
        user={currentUser}
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
        visible={showCreateForm}
        title={t('users.create', 'Add User')}
      />
    </div>
  );
}