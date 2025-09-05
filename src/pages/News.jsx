import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslatedField } from '../hooks/useTranslatedField';
import SimpleDataTable from '../components/SimpleDataTable';
import DynamicForm from '../components/DynamicForm';
import NewsModal from '../components/NewsModal';
import CreateRecordForm from '../components/CreateRecordForm';
import { api } from '../utils/api';
import { PlusIcon, FunnelIcon, XMarkIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function News() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // Componente per visualizzare titolo tradotto
  const TranslatedTitle = ({ newsItem }) => {
    const { translatedText, isLoading } = useTranslatedField(
      'news', 
      newsItem.id, 
      'title', 
      newsItem.title
    );
    
    return (
      <span className="flex items-center">
        {translatedText}
        {isLoading && (
          <span className="ml-2 text-xs text-gray-500">
            {t('translation.loading', 'Translating...')}
          </span>
        )}
      </span>
    );
  };
  
  // Componente per visualizzare contenuto tradotto (versione breve per tabella)
  const TranslatedContentPreview = ({ newsItem }) => {
    const { translatedText, isLoading } = useTranslatedField(
      'news', 
      newsItem.id, 
      'content', 
      newsItem.content
    );
    
    const preview = translatedText?.length > 100 
      ? translatedText.substring(0, 100) + '...' 
      : translatedText;
    
    return (
      <span className="flex items-center">
        {preview}
        {isLoading && (
          <span className="ml-2 text-xs text-gray-500">...</span>
        )}
      </span>
    );
  };
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    child: '',
    mission: '',
    referent: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false); // For editing existing news
  const [showCreateForm, setShowCreateForm] = useState(false); // New CreateRecordForm
  const [editingNews, setEditingNews] = useState(null);
  const [children, setChildren] = useState([]);
  const [missions, setMissions] = useState([]);

  // Modal states
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // Get user from localStorage for role-based permissions
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'admin';
  const userId = user.id;

  // Permission checks
  const canEdit = userRole === 'admin' || userRole === 'referent';
  const canCreate = userRole === 'admin' || userRole === 'referent';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    fetchNews();
    fetchFormOptions();
  }, [userRole, userId]);

  const fetchFormOptions = async () => {
    try {
      const [childrenRes, missionsRes] = await Promise.all([
        api.get('/children?user_role=admin'),
        api.get('/missions')
      ]);
      
      setChildren(childrenRes.data.map(child => ({
        value: child.id,
        label: child.name
      })));
      
      setMissions(missionsRes.data.map(mission => ({
        value: mission.id,
        label: mission.name
      })));
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

  // Apply filters when news data or filters change
  useEffect(() => {
    applyFilters();
  }, [news, filters]);

  const applyFilters = () => {
    let filtered = [...news];

    // Filter by child
    if (filters.child) {
      filtered = filtered.filter(item => 
        item.child_name?.toLowerCase().includes(filters.child.toLowerCase())
      );
    }

    // Filter by mission
    if (filters.mission) {
      filtered = filtered.filter(item => 
        item.mission_name?.toLowerCase().includes(filters.mission.toLowerCase())
      );
    }

    // Filter by referent
    if (filters.referent) {
      filtered = filtered.filter(item => 
        item.referent_username?.toLowerCase().includes(filters.referent.toLowerCase())
      );
    }

    setFilteredNews(filtered);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      child: '',
      mission: '',
      referent: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        user_role: userRole
      });
      
      if (userId) {
        params.append('user_id', userId);
      }
      
      const response = await api.get(`/news?${params}`);
      setNews(response.data);
      setFilteredNews(response.data); // Initialize filtered news
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(t('error.fetchNews', 'Error loading news'));
    } finally {
      setLoading(false);
    }
  };

  // Column configuration for the data table
  const columns = [
    {
      key: 'thumbnail',
      label: '',
      sortable: false,
      searchable: false,
      render: (value, row) => {
        const thumbnailContent = (() => {
          if (row.media && row.media.length > 0) {
            const firstMedia = row.media[0];
            if (firstMedia.media_type === 'photo') {
              return (
                <img
                  src={`http://localhost:5001/uploads/${firstMedia.media_path}`}
                  alt="News thumbnail"
                  className="h-12 w-12 object-cover rounded-lg"
                />
              );
            } else {
              return (
                <div className={`
                  h-12 w-12 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
                `}>
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              );
            }
          }
          return (
            <div className={`
              h-12 w-12 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-gray-700' : 'bg-gray-100'}
            `}>
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          );
        })();

        return (
          <button
            onClick={() => handleView(row)}
            className="hover:opacity-75 transition-opacity"
            title={t('common.viewNews', 'Click to view full news')}
          >
            {thumbnailContent}
          </button>
        );
      }
    },
    {
      key: 'title',
      label: t('news.title', 'Title'),
      sortable: true,
      searchable: true,
      render: (value, row) => <TranslatedTitle newsItem={row} />
    },
    {
      key: 'child_name',
      label: t('news.child', 'Child'),
      sortable: true,
      searchable: true
    },
    {
      key: 'mission_name',
      label: t('news.mission', 'Mission'),
      sortable: true,
      searchable: true
    },
    {
      key: 'referent_username',
      label: t('news.referent', 'Referent'),
      sortable: true,
      searchable: true,
      visible: userRole === 'admin' || userRole === 'sponsor'
    },
    {
      key: 'date',
      label: t('news.date', 'Date'),
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString();
      }
    },
    {
      key: 'content',
      label: t('news.content', 'Content'),
      searchable: true,
      render: (value, row) => <TranslatedContentPreview newsItem={row} />
    },
    {
      key: 'creator_info',
      label: t('news.createdBy', 'Created By'),
      sortable: false,
      render: (value, row) => {
        const creator = row.created_by_username;
        const creatorRole = row.created_by_role;
        const updater = row.updated_by_username;
        const updaterRole = row.updated_by_role;
        
        if (updater && updater !== creator) {
          return (
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>Updated by {updater} ({updaterRole})</div>
              {creator && (
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Originally by {creator} ({creatorRole})
                </div>
              )}
            </div>
          );
        } else if (creator) {
          return (
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Created by {creator} ({creatorRole})
            </div>
          );
        }
        return '-';
      }
    }
  ];

  // Add actions column - always add view action, conditionally add edit/delete
  columns.push({
    key: 'actions',
    label: t('common.actions', 'Actions'),
    render: (value, row) => (
      <div className="flex space-x-2">
        <button
          onClick={() => handleView(row)}
          className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          title={t('common.view', 'View')}
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        {canEdit && (
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title={t('common.edit', 'Edit')}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => handleDelete(row)}
            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={t('common.delete', 'Delete')}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  });

  const handleView = (newsItem) => {
    navigate(`/news/${newsItem.id}`);
  };

  const handleEdit = (newsItem) => {
    // Prepare the news item data for editing
    const editData = {
      ...newsItem,
      media_files: newsItem.media || [] // Convert media array to media_files for form
    };
    setEditingNews(editData);
    setShowForm(true);
  };

  const handleDelete = async (newsItem) => {
    if (window.confirm(t('form.confirmDelete', 'Are you sure you want to delete this item?'))) {
      try {
        await api.delete(`/news/${newsItem.id}`);
        fetchNews(); // Refresh the list
      } catch (error) {
        console.error('Error deleting news:', error);
        alert(t('form.deleteError', 'Error deleting item'));
      }
    }
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (newRecord) => {
    console.log('News created successfully with new form:', newRecord);
    setShowCreateForm(false);
    fetchNews(); // Refresh the news list
  };

  const handleFormSave = async (formData) => {
    try {
      console.log('handleFormSave called with formData:', formData);
      console.log('Current userId:', userId);
      console.log('editingNews:', editingNews);
      
      // Ensure date field is included for updates
      if (editingNews && !formData.date && editingNews.date) {
        formData.date = editingNews.date;
        console.log('Added missing date field from editingNews:', editingNews.date);
      }
      
      // Add current user ID, UI language, and prepare media files with consistent format
      const dataToSend = {
        ...formData,
        current_user_id: userId,
        ui_language: i18n.language, // Add current UI language for translation
        media_files: (formData.media_files || []).map((file, index) => {
          // Convert MIME types to database-accepted values
          let mediaType = file.type || file.media_type;
          if (mediaType && mediaType.startsWith('image/')) {
            mediaType = 'photo';
          } else if (mediaType && mediaType.startsWith('video/')) {
            mediaType = 'video';
          } else {
            // Default fallback for unknown types
            mediaType = 'photo';
          }
          
          return {
            path: file.path || file.media_path,
            type: mediaType,
            description: file.description || '',
            media_order: index
          };
        })
      };
      
      console.log('Data to send:', dataToSend);

      if (editingNews) {
        console.log('Updating existing news with ID:', editingNews.id);
        const response = await api.put(`/news/${editingNews.id}`, dataToSend);
        console.log('Update response:', response.data);
      } else {
        console.log('Creating new news');
        const response = await api.post('/news', dataToSend);
        console.log('Create response:', response.data);
      }
      
      setShowForm(false);
      setEditingNews(null);
      fetchNews(); // Refresh the list
      return { success: true };
    } catch (error) {
      console.error('Error saving news:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || t('form.saveError', 'Error saving item')
      };
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingNews(null);
  };

  // Define the form fields for news
  const newsFields = [
    {
      key: 'title',
      label: t('news.title', 'Title'),
      type: 'text',
      required: true,
      placeholder: t('translation.placeholders.title', 'Write the title in your native language, it will be translated automatically...'),
      fullWidth: true
    },
    {
      key: 'child_id',
      label: t('news.child', 'Child'),
      type: 'select',
      required: true,
      options: children,
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
      placeholder: t('translation.placeholders.content', 'Write the content in your native language, it will be translated automatically...')
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

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('nav.news', 'News')}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
            } ${
              hasActiveFilters 
                ? isDark
                  ? 'border-blue-400 text-blue-400 bg-blue-900/20'
                  : 'border-blue-600 text-blue-600 bg-blue-50'
                : isDark
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            {t('common.filters', 'Filters')}
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {Object.values(filters).filter(f => f !== '').length}
              </span>
            )}
          </button>
          {canCreate && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('news.create', 'Create News')}
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={`mb-6 p-4 rounded-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('common.filters', 'Filters')}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className={`inline-flex items-center px-3 py-1 text-sm ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {t('common.clearFilters', 'Clear All')}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Child Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('news.child', 'Child')}
              </label>
              <input
                type="text"
                value={filters.child}
                onChange={(e) => handleFilterChange('child', e.target.value)}
                placeholder={t('news.filterByChild', 'Filter by child name...')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* Mission Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('news.mission', 'Mission')}
              </label>
              <input
                type="text"
                value={filters.mission}
                onChange={(e) => handleFilterChange('mission', e.target.value)}
                placeholder={t('news.filterByMission', 'Filter by mission...')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* Referent Filter - only show to admin/sponsor */}
            {(userRole === 'admin' || userRole === 'sponsor') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('news.referent', 'Referent')}
                </label>
                <input
                  type="text"
                  value={filters.referent}
                  onChange={(e) => handleFilterChange('referent', e.target.value)}
                  placeholder={t('news.filterByReferent', 'Filter by referent...')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {userRole === 'sponsor' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-blue-800 dark:text-blue-200">
            {t('news.sponsorInfo', 'You can view news about the children you sponsor.')}
          </p>
        </div>
      )}

      <SimpleDataTable
        data={filteredNews}
        columns={columns}
        title={t('news.list', 'News List')}
        emptyMessage={hasActiveFilters ? t('news.noFilterResults', 'No news found matching your filters') : t('news.empty', 'No news found')}
      />

      {/* Edit News Form Modal (DynamicForm for editing) */}
      {showForm && editingNews && (
        <DynamicForm
          fields={newsFields}
          initialData={editingNews}
          onSubmit={handleFormSave}
          onCancel={handleFormCancel}
          onDelete={() => handleDelete(editingNews)}
          title={t('form.editNews', 'Edit News')}
          canDelete={canDelete}
          isEdit={true}
        />
      )}

      {/* Create News Form Modal (CreateRecordForm for creation) */}
      <CreateRecordForm
        tableName="news"
        user={user}
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
        visible={showCreateForm}
        title={t('news.create', 'Create News')}
      />

      {/* News View Modal */}
      <NewsModal
        news={selectedNews}
        isOpen={showNewsModal}
        onClose={() => setShowNewsModal(false)}
      />
    </div>
  );
}
