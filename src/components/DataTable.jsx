import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const DataTable = ({ 
  data = [], 
  columns = [], 
  onRowClick = null,
  searchPlaceholder = "Search...",
  className = ""
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});

  // Get unique values for filter options
  const getFilterOptions = (fieldKey) => {
    const values = data.map(item => item[fieldKey]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle filtering
  const handleFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter(item => item[field] === value);
      }
    });

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle different data types
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal?.toLowerCase() || '';
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortField, sortDirection]);

  return (
    <div className={`${className}`}>
      {/* Search and Filters */}
      <div className={`mb-6 p-4 rounded-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
              } focus:outline-none`}
            />
            <svg
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                isDark ? 'text-gray-400' : 'text-gray-400'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {columns
            .filter(col => col.filterable)
            .map(column => (
              <div key={column.key}>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {column.label}
                </label>
                <select
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilter(column.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                  } focus:outline-none`}
                >
                  <option value="">All</option>
                  {getFilterOptions(column.key).map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      </div>

      {/* Results Count */}
      <div className={`mb-4 text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Showing {processedData.length} of {data.length} results
      </div>

      {/* Table */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className={`${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-sm font-semibold ${
                      isDark ? 'text-gray-300' : 'text-gray-900'
                    } ${column.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <svg 
                            className={`h-3 w-3 ${
                              sortField === column.key && sortDirection === 'asc' 
                                ? (isDark ? 'text-indigo-400' : 'text-indigo-600') 
                                : (isDark ? 'text-gray-500' : 'text-gray-400')
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                          <svg 
                            className={`h-3 w-3 ${
                              sortField === column.key && sortDirection === 'desc' 
                                ? (isDark ? 'text-indigo-400' : 'text-indigo-600') 
                                : (isDark ? 'text-gray-500' : 'text-gray-400')
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-opacity-50' : ''
                  } ${
                    isDark 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {columns.map(column => (
                    <td key={column.key} className={`px-6 py-4 text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {processedData.length === 0 && (
          <div className={`text-center py-12 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">No results found</p>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
