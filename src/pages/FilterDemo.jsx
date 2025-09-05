import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import EnhancedDataTable from '../components/EnhancedDataTable';
import { ChartBarIcon, TableCellsIcon, FunnelIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

/**
 * Demo page showcasing all advanced filtering capabilities
 * This page demonstrates the full power of our enhanced filtering system
 */
export default function FilterDemo({ user }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  const [demoData, setDemoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // Generate realistic demo data based on actual application structure
  const generateDemoData = () => {
    const missions = [
      'Orrissa Mission', 'Wellington Mission', 'Chennai Mission', 'Kolkata Mission', 'Mumbai Mission'
    ];
    
    const referents = [
      'maria_rossi', 'giovanni_bianchi', 'lucia_verdi', 'marco_neri', 'anna_ferrari'
    ];
    
    const sponsors = [
      'carlo_rossi', 'elena_bianchi', 'mario_verdi', 'sara_neri', 'luca_ferrari',
      'paola_romano', 'davide_greco', 'laura_conti', 'alessandro_ricci', 'federica_marino'
    ];

    const courses = ['A', 'B', 'C'];
    const performances = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
    
    const tamilNames = [
      'Arun', 'Meena', 'Karthik', 'Divya', 'Suresh', 'Anitha', 'Vijay', 'Lakshmi',
      'Rajesh', 'Priya', 'Kumar', 'Sangeetha', 'Ravi', 'Kavitha', 'Manoj', 'Deepa',
      'Sathish', 'Revathi', 'Ganesh', 'Nandini', 'Senthil', 'Bharathi', 'Prakash', 'Sowmya'
    ];

    return Array.from({ length: 150 }, (_, index) => {
      const age = Math.floor(Math.random() * 9) + 6; // 6-14 years
      const currentDate = new Date();
      const birthYear = currentDate.getFullYear() - age;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthDate = new Date(birthYear, birthMonth, birthDay);
      
      // Random last update (within last 3 months)
      const lastUpdateDate = new Date();
      lastUpdateDate.setDate(lastUpdateDate.getDate() - Math.floor(Math.random() * 90));
      
      const mission = missions[Math.floor(Math.random() * missions.length)];
      const hassponsor = Math.random() > 0.3; // 70% have sponsors
      const studyProgress = Math.floor(Math.random() * 101); // 0-100%
      
      return {
        id: index + 1,
        name: tamilNames[Math.floor(Math.random() * tamilNames.length)] + ' ' + 
              ['Kumar', 'Devi', 'Raj', 'Mani', 'Samy'][Math.floor(Math.random() * 5)],
        age: age,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        birthDate: birthDate.toISOString().split('T')[0],
        mission: mission,
        referent: referents[Math.floor(Math.random() * referents.length)],
        sponsor: hassponsor ? sponsors[Math.floor(Math.random() * sponsors.length)] : null,
        status: hassponsor ? 'Sponsored' : 'Available',
        studyProgress: studyProgress,
        studyCourse: courses[Math.floor(Math.random() * courses.length)],
        performance: performances[Math.floor(Math.random() * performances.length)],
        lastUpdate: lastUpdateDate.toISOString().split('T')[0],
        notes: [
          'Excellent progress in mathematics and reading',
          'Shows great enthusiasm for learning',
          'Needs additional support in language skills',
          'Very creative and artistic child',
          'Strong leadership qualities emerging',
          'Requires encouragement in group activities',
          'Exceptional memory and quick learner',
          'Shows interest in science experiments'
        ][Math.floor(Math.random() * 8)]
      };
    });
  };    setTimeout(() => {
      setDemoData(generateDemoData());
      setLoading(false);
    }, 1000);
  }, []);

  // Define comprehensive columns with all filter types based on children data
  const columns = [
    {
      key: 'id',
      label: 'ID',
      type: 'number',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          #{value.toString().padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'name',
      label: t('children.name', 'Name'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.gender === 'Male' ? '👨' : '👩'} {row.age} {t('children.years', 'years')}
          </div>
        </div>
      )
    },
    {
      key: 'mission',
      label: t('children.mission', 'Mission'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {value}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            👨‍💼 {row.referent}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('children.status', 'Status'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const isSponsored = value === 'Sponsored';
        return (
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isSponsored
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
            }`}>
              {isSponsored ? '💚' : '💛'} {value}
            </span>
            {row.sponsor && (
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                by {row.sponsor}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'studyProgress',
      label: t('filterDemo.studyProgress', 'Study Progress'),
      type: 'number',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{value}%</span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                value >= 80 ? 'bg-green-500' :
                value >= 60 ? 'bg-blue-500' :
                value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'studyCourse',
      label: t('filterDemo.studyCourse', 'Study Course'),
      sortable: true,
      filterable: true,
      render: (value) => {
        const courseConfig = {
          'A': { color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200', label: t('filterDemo.courseA', 'Course A - Basic') },
          'B': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200', label: t('filterDemo.courseB', 'Course B - Intermediate') },
          'C': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200', label: t('filterDemo.courseC', 'Course C - Advanced') }
        };
        const config = courseConfig[value] || { color: 'bg-gray-100 text-gray-800', label: value };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            📚 {config.label}
          </span>
        );
      }
    },
    {
      key: 'performance',
      label: t('filterDemo.performance', 'Performance'),
      sortable: true,
      filterable: true,
      render: (value) => {
        const performanceConfig = {
          'Excellent': { color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200', icon: '🌟' },
          'Good': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200', icon: '👍' },
          'Average': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200', icon: '📊' },
          'Needs Improvement': { color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200', icon: '�' }
        };
        const config = performanceConfig[value] || { color: 'bg-gray-100 text-gray-800', icon: '📝' };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            <span className="mr-1">{config.icon}</span>
            {value}
          </span>
        );
      }
    },
    {
      key: 'lastUpdate',
      label: t('filterDemo.lastUpdate', 'Last Update'),
      type: 'date',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'notes',
      label: t('filterDemo.notes', 'Notes'),
      sortable: false,
      filterable: true,
      render: (value) => (
        <div className={`text-sm max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} 
             title={value}>
          {value}
        </div>
      )
    }
  ];
  // Action handlers
  const handleView = (row) => {
    alert(`Viewing details for: ${row.name}`);
  };

  const handleEdit = (row) => {
    alert(`Editing: ${row.name}`);
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete ${row.name}?`)) {
      setDemoData(prev => prev.filter(item => item.id !== row.id));
    }
  };

  const handleExport = (data) => {
    // Advanced export with multiple format options
    const headers = columns.filter(col => col.key !== 'actions').map(col => col.label);
    const csvContent = [
      headers,
      ...data.map(row => columns.filter(col => col.key !== 'actions').map(col => {
        let value = row[col.key];
        if (col.type === 'date' && value) {
          value = new Date(value).toLocaleDateString();
        } else if (col.type === 'boolean') {
          value = value ? 'Yes' : 'No';
        }
        return value;
      }))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `children_study_demo_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('filterDemo.title', '🚀 Advanced Filters Demo')}
              </h1>
              <p className={`mt-2 text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('filterDemo.description', 'Showcase of comprehensive filtering, sorting, and data management capabilities')}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/children"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <TableCellsIcon className="h-4 w-4 mr-2" />
                {t('filterDemo.basicChildren', 'Basic Children')}
              </Link>
              <Link
                to="/enhanced-children"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {t('filterDemo.enhancedChildren', 'Enhanced Children')}
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <FunnelIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('filterDemo.filterTypes', 'Filter Types')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">12+</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <TableCellsIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('filterDemo.dataRecords', 'Data Records')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{demoData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('filterDemo.viewModes', 'View Modes')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('filterDemo.exportReady', 'Export Ready')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">✓</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <EnhancedDataTable
          data={demoData}
          columns={columns}
          title={t('filterDemo.demoTitle', '🎯 Demo Data with All Filter Types')}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
          enablePagination={true}
          enableExport={true}
          enableViewToggle={true}
          defaultPageSize={15}
          searchPlaceholder={t('filterDemo.searchPlaceholder', 'Search by name, category, status, location, or any field...')}
          emptyMessage={t('filterDemo.emptyMessage', 'No data found - try adjusting your filters')}
        />
      </div>
    </div>
  );
}