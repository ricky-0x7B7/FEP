import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SimpleDataTable = ({ 
  data = [], 
  columns = [], 
  onRowClick = null,
  searchPlaceholder = "Search...",
  className = ""
}) => {
  const { isDark } = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});

  console.log('DataTable render:', { data: data.length, columns: columns.length });

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
    let filtered = [...data];

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
      {/* Search Bar */}
      <div className={`mb-4 p-4 rounded-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        <div className="relative mb-4">
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
                      {column.sortable && sortField === column.key && (
                        <span className={`ml-1 ${
                          isDark ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
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
                    // Alternating row backgrounds (zebra striping)
                    index % 2 === 0
                      ? isDark 
                        ? 'bg-gray-900 hover:bg-gray-800' 
                        : 'bg-white hover:bg-gray-50'
                      : isDark
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
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
            <p className="text-lg font-medium mb-1">No results found</p>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDataTable;
