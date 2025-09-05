import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import SimpleDataTable from '../components/SimpleDataTable';
import DynamicForm from '../components/DynamicForm';
import { api } from '../utils/api';

export default function MissionsManagement({ user }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [users, setUsers] = useState([]);

  // Get user role and permissions
  const userRole = user?.role || 'sponsor';
  const canEdit = userRole === 'admin';
  const canCreate = userRole === 'admin';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    fetchMissions();
    fetchUsers();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/missions');
      setMissions(response.data);
    } catch (err) {
      console.error('Error fetching missions:', err);
      setError(t('error.fetchMissions', 'Error loading missions'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log('Users response:', response.data); // Debug log
      // Try both 'localReferent' and 'referent' since role names might vary
      const referents = response.data.filter(user => 
        user.role === 'localReferent' || user.role === 'referent'
      );
      console.log('Filtered referents:', referents); // Debug log
      setUsers(referents.map(user => ({
        value: user.id,
        label: `${user.username} (${user.email})`
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('missions.name', 'Name'),
      sortable: true,
      searchable: true
    },
    {
      key: 'description',
      label: t('missions.description', 'Description'),
      searchable: true,
      render: (value) => {
        if (!value) return '-';
        return value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    },
    {
      key: 'location',
      label: t('missions.location', 'Location'),
      sortable: true,
      searchable: true
    },
    {
      key: 'referent_username',
      label: t('missions.referent', 'Referent'),
      sortable: true,
      searchable: true
    }
  ];

  // Add actions column if user has permissions
  if (canEdit || canDelete) {
    columns.push({
      key: 'actions',
      label: t('common.actions', 'Actions'),
      render: (value, row) => (
        <div className="flex space-x-2">
          {canEdit && (
            <button
              onClick={() => handleEdit(row)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t('common.edit', 'Edit')}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(row)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              {t('common.delete', 'Delete')}
            </button>
          )}
        </div>
      )
    });
  }

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setShowForm(true);
  };

  const handleDelete = async (mission) => {
    if (window.confirm(t('form.confirmDelete', `Are you sure you want to delete ${mission.name}?`))) {
      try {
        await api.delete(`/missions/${mission.id}`);
        fetchMissions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting mission:', error);
        alert(t('form.deleteError', 'Error deleting mission'));
      }
    }
  };

  const handleCreate = () => {
    setEditingMission(null);
    setShowForm(true);
  };

  const handleFormSave = async (formData) => {
    try {
      if (editingMission) {
        // Update existing mission
        await api.put(`/missions/${editingMission.id}`, formData);
      } else {
        // Create new mission
        await api.post('/missions', formData);
      }
      
      setShowForm(false);
      setEditingMission(null);
      fetchMissions(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Error saving mission:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || t('form.saveError', 'Error saving mission')
      };
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMission(null);
  };

  const handleDeleteMission = async (missionData) => {
    try {
      await api.delete(`/missions/${missionData.id}`);
      setShowForm(false);
      setEditingMission(null);
      fetchMissions(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Error deleting mission:', error);
      return {
        success: false,
        error: error.response?.data?.error || t('form.deleteError', 'Error deleting mission')
      };
    }
  };

  // Define the form fields for missions
  const missionFields = [
    {
      key: 'name',
      label: t('missions.name', 'Name'),
      type: 'text',
      required: true,
      placeholder: t('form.missionNamePlaceholder', 'Enter mission name...'),
      fullWidth: true
    },
    {
      key: 'description',
      label: t('missions.description', 'Description'),
      type: 'textarea',
      required: false,
      rows: 4,
      fullWidth: true,
      placeholder: t('form.missionDescriptionPlaceholder', 'Enter mission description...')
    },
    {
      key: 'location',
      label: t('missions.location', 'Location'),
      type: 'text',
      required: false,
      placeholder: t('form.locationPlaceholder', 'Enter location...'),
      fullWidth: true
    },
    {
      key: 'referent_id',
      label: t('missions.referent', 'Referent'),
      type: 'select',
      required: false,
      options: users,
      placeholder: t('form.selectReferent', 'Select a referent...')
    }
  ];

  if (loading) {
    return (
      <div className="p-8">
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
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      </div>
    );
  }

  // Only show for admin users
  if (userRole !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="text-yellow-800 dark:text-yellow-200">
            {t('missions.adminOnly', 'Access denied. This page is only available to administrators.')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('missions.management', 'Missions Management')}
        </h1>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            + {t('missions.create', 'Add Mission')}
          </button>
        )}
      </div>

      <SimpleDataTable
        data={missions}
        columns={columns}
        title={t('missions.list', 'Missions List')}
        emptyMessage={t('missions.empty', 'No missions found')}
      />

      {/* Mission Form Modal */}
      {showForm && (
        <DynamicForm
          fields={missionFields}
          initialData={editingMission}
          onSubmit={handleFormSave}
          onCancel={handleFormCancel}
          onDelete={handleDeleteMission}
          title={editingMission ? t('form.editMission', 'Edit Mission') : t('form.createMission', 'Create Mission')}
          canDelete={editingMission && canDelete}
          isEdit={!!editingMission}
        />
      )}
    </div>
  );
}
