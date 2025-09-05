import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getChildren, translateField } from '../utils/api';
import SimpleDataTable from '../components/SimpleDataTable';
import DynamicForm from '../components/DynamicForm';
import CreateRecordForm from '../components/CreateRecordForm';
import { api } from '../utils/api';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Children({ user }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false); // New CreateRecordForm
  const [editingChild, setEditingChild] = useState(null);
  const [missions, setMissions] = useState([]);
  const [sponsors, setSponsors] = useState([]);

  // Get user role and permissions
  const userRole = user?.role || 'sponsor';
  const canEdit = userRole === 'localReferent' || userRole === 'admin';
  const canCreate = userRole === 'localReferent' || userRole === 'admin';
  const canDelete = userRole === 'admin';
  const canViewSponsor = userRole === 'admin' || userRole === 'localReferent';

  useEffect(() => {
    console.log('Children component mounted with user:', user);
    fetchChildren();
    fetchMissions();
    fetchSponsors();
  }, [user]);

  const fetchMissions = async () => {
    try {
      const response = await api.get('/missions');
      setMissions(response.data.map(mission => ({
        value: mission.id,
        label: mission.name
      })));
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await api.get('/users');
      // Filter only sponsors
      const sponsorUsers = response.data.filter(user => user.role === 'sponsor');
      setSponsors(sponsorUsers.map(sponsor => ({
        value: sponsor.id,
        label: sponsor.full_name || sponsor.username
      })));
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add user parameters for role-based filtering
      const params = new URLSearchParams();
      if (user?.id) params.append('user_id', user.id);
      if (user?.role) params.append('user_role', user.role);
      
      const response = await getChildren(params.toString() ? `?${params.toString()}` : '');
      console.log('Children API response:', response);
      const data = response.data || response;
      console.log('Children data:', data);
      setChildren(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError(`Failed to load children data: ${err.message || err.error || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Define table columns for reusable DataTable (role-based)
  const columns = [
    {
      key: 'photo',
      label: t('children.photo', 'Photo'),
      sortable: false,
      filterable: false,
      render: (photo, row) => (
        <div className="flex items-center">
          <img
            src={getImageUrl(photo)}
            alt={row.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div 
            className={`h-12 w-12 rounded-full items-center justify-center ring-2 ring-gray-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`} 
            style={{ display: 'none' }}
          >
            <span className="text-lg">👤</span>
          </div>
        </div>
      )
    },
    {
      key: 'name',
      label: t('children.name', 'Name'),
      sortable: true,
      filterable: false
    },
    {
      key: 'mission_name',
      label: t('children.mission', 'Mission'),
      sortable: true,
      filterable: true
    },
    {
      key: 'referent_username',
      label: t('children.referent', 'Referent'),
      sortable: true,
      filterable: true
    },
    // Conditionally add sponsor columns for admin/referent only
    ...(canViewSponsor ? [{
      key: 'sponsor_username',
      label: t('children.sponsor', 'Sponsor'),
      sortable: true,
      filterable: true,
      render: (sponsor) => sponsor || (
        <span className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          No sponsor
        </span>
      )
    }] : []),
    {
      key: 'gender',
      label: t('children.gender', 'Gender'),
      sortable: true,
      filterable: true,
      render: (gender) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {gender === 'man' || gender === 'male' ? '👨' : '👩'}
          </span>
          <span className="capitalize">{gender}</span>
        </div>
      )
    },
    {
      key: 'age',
      label: t('children.age', 'Age'),
      sortable: true,
      filterable: false,
      render: (age) => (
        <div className="flex items-center space-x-1">
          <span>{age}</span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {age === 1 ? t('children.year', 'year') : t('children.years', 'years')}
          </span>
        </div>
      )
    },
    // Add actions column for users with edit permissions
    ...(canEdit || canDelete ? [{
      key: 'actions',
      label: t('common.actions', 'Actions'),
      sortable: false,
      filterable: false,
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/children/${row.id}`);
            }}
            className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title={t('common.viewDetails', 'View Details')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditChild(row);
              }}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title={t('common.edit', 'Edit')}
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChild(row);
              }}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title={t('common.delete', 'Delete')}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  const handleRowClick = (child) => {
    navigate(`/children/${child.id}`);
  };

  const handleEditChild = (child) => {
    // Transform the child data to match form field names
    const editData = {
      ...child,
      birth_date: child.birth, // Map 'birth' from database to 'birth_date' expected by form
      description: child.descriptions?.[i18n.language] || child.description // Load description in current language
    };
    setEditingChild(editData);
    setShowForm(true);
  };

  const handleDeleteChild = async (child) => {
    if (window.confirm(t('form.confirmDelete', `Are you sure you want to delete ${child.name}?`))) {
      try {
        await api.delete(`/children/${child.id}`);
        fetchChildren(); // Refresh the list
      } catch (error) {
        console.error('Error deleting child:', error);
        alert(t('form.deleteError', 'Error deleting child'));
      }
    }
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (newRecord) => {
    console.log('Child created successfully with new form:', newRecord);
    setShowCreateForm(false);
    fetchChildren(); // Refresh the children list
  };

  const handleFormSave = async (formData) => {
    try {
      const dataWithTranslations = {
        ...formData,
        translations: {
          [i18n.language]: formData.description, // Salva descrizione nella lingua corrente
          en: await translateField({
            entity_type: 'children',
            entity_id: editingChild?.id || null,
            field_name: 'description',
            target_language: 'en',
            original_text: formData.description
          }),
          ta: await translateField({
            entity_type: 'children',
            entity_id: editingChild?.id || null,
            field_name: 'description',
            target_language: 'ta',
            original_text: formData.description
          })
        }
      };

      if (editingChild) {
        await api.put(`/children/${editingChild.id}`, dataWithTranslations);
      } else {
        await api.post('/children', dataWithTranslations);
      }

      fetchChildren();
      setShowForm(false);
      setEditingChild(null);

      return { success: true };
    } catch (error) {
      console.error('Error saving child:', error);
      return {
        success: false,
        error: error.response?.data?.error || t('form.saveError', 'Error saving child')
      };
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingChild(null);
  };

  // Define the form fields for children
  const childrenFields = [
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
      options: missions,
      placeholder: t('form.selectMission', 'Select a mission...')
    },
    {
      key: 'photo',
      label: t('children.photo', 'Photo'),
      type: 'file',
      required: false,
      accept: 'image/*',
      preview: true,
      fullWidth: true
    },
    {
      key: 'sponsor_id',
      label: t('children.sponsor', 'Sponsor'),
      type: 'select',
      required: false,
      options: sponsors,
      placeholder: t('form.selectSponsor', 'Select a sponsor...')
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

  const closeChildDetail = () => {
    setSelectedChild(null);
  };

  // Helper function to get the correct image URL
  const getImageUrl = (filename) => {
    if (!filename) return null;
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    // If it's a new uploaded file, use the uploads endpoint
    if (filename.includes('_')) {
      return `http://localhost:5001/uploads/${filename}`;
    }
    // Otherwise, use the legacy images path
    return `/images/children/${filename}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('common.loading', 'Loading...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-lg ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('common.error', 'Error')}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {error}
            </p>
            <button
              onClick={fetchChildren}
              className={`mt-4 px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {t('common.retry', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-4xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('children.title', 'Our Children')}
              </h1>
              {canCreate && (
                <button
                  onClick={handleCreateNew}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  {t('children.create', 'Add Child')}
                </button>
              )}
              {!canCreate && <div></div>} {/* Spacer */}
            </div>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('children.subtitle', 'Supporting children and families in Tamil Nadu')}
            {userRole !== 'admin' && (
              <span className={`block text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {userRole === 'sponsor' 
                  ? t('children.sponsorView', 'Showing children you sponsor')
                  : t('children.referentView', 'Showing children in your missions')
                }
              </span>
            )}
          </p>
        </div>

        <SimpleDataTable
          data={children}
          columns={columns}
          onRowClick={handleRowClick}
          searchPlaceholder={t('children.searchPlaceholder', 'Search children...')}
          className="max-w-7xl mx-auto"
        />

        {/* Children Edit Form Modal */}
        {showForm && editingChild && (
          <DynamicForm
            fields={childrenFields}
            initialData={editingChild}
            onSubmit={handleFormSave}
            onCancel={handleFormCancel}
            title={t('form.editChild', 'Edit Child')}
            showDeleteButton={canDelete}
          />
        )}

        {/* Create Child Form Modal */}
        <CreateRecordForm
          tableName="children"
          user={user}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
          visible={showCreateForm}
          title={t('children.addChild', 'Add Child')}
        />

        {/* Child Detail Modal */}
        {selectedChild && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-2xl`}>
              <button
                onClick={closeChildDetail}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                } shadow-lg transition-colors`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-8">
                <div className="text-center">
                  <div className="relative inline-block cursor-pointer" onClick={() => setShowFullImage(true)}>
                    <img
                      src={getImageUrl(selectedChild.photo)}
                      alt={selectedChild.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-4 ring-indigo-500 hover:ring-indigo-400 transition-all duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className={`w-32 h-32 rounded-full mx-auto mb-4 ring-4 ring-indigo-500 flex items-center justify-center ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`} 
                      style={{ display: 'none' }}
                    >
                      <span className="text-4xl">👤</span>
                    </div>
                    {/* Click to expand icon */}
                    <div className="absolute inset-0 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300">
                      <svg className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>

                  <h2 className={`text-3xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedChild.name}
                  </h2>
                  
                  <div className="space-y-3 text-left max-w-md mx-auto mb-6">
                    <div className={`flex justify-between py-2 border-b ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Mission:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChild.mission_name}</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Referent:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChild.referent_username}</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Age:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChild.age} years old</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Gender:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>{selectedChild.gender}</span>
                    </div>
                    <div className={`flex justify-between py-2 border-b ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Birth Date:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedChild.birth ? new Date(selectedChild.birth).toLocaleDateString() : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Description Section */}
                  {selectedChild.description && (
                    <div className="mt-6">
                      <h3 className={`text-xl font-semibold mb-3 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        About {selectedChild.name}
                      </h3>
                      <p className={`text-base leading-relaxed text-left ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {selectedChild.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Image Modal */}
        {showFullImage && selectedChild && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="max-w-4xl max-h-full flex items-center justify-center">
              <img
                src={getImageUrl(selectedChild.photo)}
                alt={selectedChild.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer"
                onClick={() => setShowFullImage(false)}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-64 h-64 rounded-lg bg-gray-700 flex flex-col items-center justify-center text-white"
                style={{ display: 'none' }}
              >
                <span className="text-6xl mb-4">👤</span>
                <span className="text-lg">Image not found</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
