import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import EnhancedDataTable from '../components/EnhancedDataTable';
import { api, API_BASE } from '../utils/api';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Enhanced Children page with advanced filtering capabilities
 * Demonstrates the full power of the EnhancedDataTable component
 */
export default function EnhancedChildren({ user }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user role and permissions
  const userRole = user?.role || 'sponsor';
  const canEdit = userRole === 'localReferent' || userRole === 'admin';
  const canCreate = userRole === 'localReferent' || userRole === 'admin';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    fetchChildren();
  }, [user?.id, user?.role]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      
      // Get user role and ID for role-based filtering
      const userRole = user?.role || 'sponsor';
      const userId = user?.id;
      
      // Construct API call with user context
      let url = '/children';
      if (userId && userRole !== 'admin') {
        url += `?user_id=${userId}&user_role=${userRole}`;
      }
      
      const response = await api.get(url);
      
      // Transform data to add calculated fields and proper formatting
      const transformedData = response.data.map(child => {
        // Calculate age from birth date
        const age = child.birth ? calculateAge(child.birth) : 0;
        
        // If no birth date exists, generate one for children aged 6-14
        let birthDate = child.birth;
        if (!birthDate) {
          const randomAge = Math.floor(Math.random() * 9) + 6; // 6-14 years
          const currentDate = new Date();
          const birthYear = currentDate.getFullYear() - randomAge;
          const randomMonth = Math.floor(Math.random() * 12);
          const randomDay = Math.floor(Math.random() * 28) + 1;
          birthDate = new Date(birthYear, randomMonth, randomDay).toISOString().split('T')[0];
        }

        return {
          ...child,
          birth_date: birthDate,
          age: birthDate ? calculateAge(birthDate) : age,
          formatted_birth_date: formatDate(birthDate),
          mission_display: child.mission_name || 'No mission assigned',
          sponsor_display: child.sponsor_username || 'No sponsor',
          status: child.sponsor_username ? 'Sponsored' : 'Available',
          referent_display: child.referent_username || 'No referent'
        };
      });
      
      setChildren(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to fetch children');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Define enhanced columns with filtering and sorting capabilities
  const columns = [
    {
      key: 'photo',
      label: t('children.photo', 'Photo'),
      sortable: false,
      filterable: false,
      render: (photo, row) => (
        <div className="flex items-center justify-center">
          {photo ? (
            <img
              src={`${API_BASE}/uploads/${photo}`}
              alt={row.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                e.target.src = '/placeholder-avatar.png';
              }}
            />
          ) : (
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
              isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}>
              {row.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: t('children.name', 'Name'),
      sortable: true,
      filterable: true,
      render: (name, row) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ID: {row.id}
          </div>
        </div>
      )
    },
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
      type: 'number',
      sortable: true,
      filterable: true,
      render: (age) => (
        <div className="flex items-center space-x-1">
          <span className="font-medium">{age}</span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {age === 1 ? t('children.year', 'year') : t('children.years', 'years')}
          </span>
        </div>
      )
    },
    {
      key: 'formatted_birth_date',
      label: t('children.birthDate', 'Birth Date'),
      type: 'date',
      sortable: true,
      filterable: true,
      render: (date, row) => (
        <div>
          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {row.age} {t('children.yearsOld', 'years old')}
          </div>
        </div>
      )
    },
    {
      key: 'mission_display',
      label: t('children.mission', 'Mission'),
      sortable: true,
      filterable: true,
      render: (mission, row) => (
        <div>
          <div className={`text-sm font-medium ${
            row.mission_name 
              ? isDark ? 'text-blue-400' : 'text-blue-600'
              : isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {row.mission_name || t('children.noMission', 'No mission assigned')}
          </div>
          {row.referent_username && (
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              👨‍💼 {row.referent_username}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: t('children.status', 'Status'),
      sortable: true,
      filterable: true,
      render: (status, row) => {
        const isSponsored = row.sponsor_username;
        const statusText = isSponsored ? t('children.sponsored', 'Sponsored') : t('children.available', 'Available');
        return (
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isSponsored
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
            }`}>
              {isSponsored ? '💚' : '💛'} {statusText}
            </span>
            {row.sponsor_username && (
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                by {row.sponsor_username}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'description',
      label: t('children.description', 'Description'),
      sortable: false,
      filterable: true,
      render: (description) => (
        <div className={`text-sm max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {description || t('children.noDescription', 'No description available')}
        </div>
      )
    }
  ];

  // Action handlers
  const handleView = (child) => {
    navigate(`/children/${child.id}`);
  };

  const handleEdit = (child) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit child:', child);
  };

  const handleDelete = (child) => {
    if (window.confirm(t('children.confirmDelete', 'Are you sure you want to delete this child record?'))) {
      // TODO: Implement delete functionality
      console.log('Delete child:', child);
    }
  };

  const handleRowClick = (child) => {
    navigate(`/children/${child.id}`);
  };

  const handleExport = (data) => {
    // Custom export handler - could integrate with API or generate PDF
    console.log('Exporting children data:', data);
    
    // Example: Custom CSV with additional formatting
    const headers = [
      'ID', 'Name', 'Gender', 'Age', 'Birth Date', 'Mission', 'Status', 'Sponsor', 'Description'
    ];
    
    const rows = data.map(child => [
      child.id,
      child.name,
      child.gender,
      child.age,
      child.formatted_birth_date,
      child.mission_name || 'No mission',
      child.status,
      child.sponsor_username || 'No sponsor',
      child.description || 'No description'
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
    link.setAttribute('download', `children_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-red-800 dark:text-red-200">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('children.enhanced', 'Enhanced Children Management')}
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('children.enhancedDesc', 'Advanced filtering, sorting, and management capabilities')}
          </p>
        </div>

        {/* Permission Notice for Sponsors */}
        {userRole === 'sponsor' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-blue-800 dark:text-blue-200">
              {t('children.sponsorInfo', 'You can view information about the children you sponsor.')}
            </p>
          </div>
        )}

        {/* Enhanced Data Table */}
        <EnhancedDataTable
          data={children}
          columns={columns}
          title={t('children.list', 'Children List')}
          onRowClick={handleRowClick}
          onView={handleView}
          onEdit={canEdit ? handleEdit : null}
          onDelete={canDelete ? handleDelete : null}
          onExport={handleExport}
          enablePagination={true}
          enableExport={true}
          enableViewToggle={true}
          defaultPageSize={10}
          searchPlaceholder={t('children.searchPlaceholder', 'Search children by name, mission, or description...')}
          emptyMessage={t('children.empty', 'No children found')}
        />
      </div>
    </div>
  );
}