import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FunnelIcon, 
  XMarkIcon, 
  ChevronDownIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

/**
 * Advanced FilterBar Component
 * Provides comprehensive filtering, search, sort, pagination and export functionality
 */
const AdvancedFilterBar = ({
  data = [],
  columns = [],
  onDataChange,
  onExport,
  title = "Data",
  searchPlaceholder = "Search...",
  enablePagination = true,
  enableExport = true,
  enableViewToggle = true,
  defaultPageSize = 10,
  defaultView = 'table' // 'table' | 'grid'
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // View states
  const [viewMode, setViewMode] = useState(defaultView);

  // Ref to store onDataChange to avoid re-renders
  const onDataChangeRef = useRef(onDataChange);
  
  // Update ref when onDataChange changes
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Advanced filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [numberRange, setNumberRange] = useState({});
  const [multiSelect, setMultiSelect] = useState({});

  // Initialize refs for previous data and filters
  const prevDataRef = useRef();
  const prevFiltersRef = useRef();

  // Get filterable columns
  const filterableColumns = columns.filter(col => col.filterable);
  const sortableColumns = columns.filter(col => col.sortable);

  // Get unique values for dropdown filters
  const getFilterOptions = (fieldKey) => {
    const values = data.map(item => item[fieldKey]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Get date columns
  const dateColumns = columns.filter(col => col.type === 'date');
  
  // Get number columns  
  const numberColumns = columns.filter(col => col.type === 'number' || col.key === 'age');

  // Apply all filters and sorting
  const processData = () => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Column filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[field]?.toString().toLowerCase();
          const filterValue = value.toString().toLowerCase();
          return itemValue?.includes(filterValue);
        });
      }
    });

    // Date range filters
    dateColumns.forEach(col => {
      const range = dateRange[col.key];
      if (range?.start || range?.end) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item[col.key]);
          const startDate = range.start ? new Date(range.start) : null;
          const endDate = range.end ? new Date(range.end) : null;
          
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
    });

    // Number range filters
    numberColumns.forEach(col => {
      const range = numberRange[col.key];
      if (range?.min !== undefined || range?.max !== undefined) {
        filtered = filtered.filter(item => {
          const itemValue = Number(item[col.key]);
          if (range.min !== undefined && itemValue < range.min) return false;
          if (range.max !== undefined && itemValue > range.max) return false;
          return true;
        });
      }
    });

    // Multi-select filters
    Object.entries(multiSelect).forEach(([field, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter(item => 
          selectedValues.includes(item[field])
        );
      }
    });

    // Sorting
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
  };

  // Get processed data
  const processedData = processData();

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = useMemo(() => {
    return enablePagination 
      ? processedData.slice(startIndex, endIndex)
      : processedData;
  }, [enablePagination, processedData, startIndex, endIndex]);

  // Update ref when onDataChange changes
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, dateRange, numberRange, multiSelect]);

  // Memoize pagination object to prevent unnecessary re-renders
  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    pageSize,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, processedData.length)
  }), [currentPage, totalPages, pageSize, startIndex, endIndex, processedData.length]);

  // Handle page size changes
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle page navigation
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Emit data changes to parent (only on initial load and filter changes)
  useEffect(() => {
    const currentFilters = JSON.stringify({ searchTerm, filters, dateRange, numberRange, multiSelect, sortField, sortDirection, pageSize, currentPage });
    const currentDataLength = processedData.length;

    if (
      onDataChangeRef.current &&
      (prevDataRef.current === undefined || // First render
        prevDataRef.current !== currentDataLength ||
        prevFiltersRef.current !== currentFilters)
    ) {
      onDataChangeRef.current({
        data: paginatedData,
        totalCount: processedData.length,
        pagination: paginationInfo,
        viewMode,
      });

      prevDataRef.current = currentDataLength;
      prevFiltersRef.current = currentFilters;
    }
  }, [paginatedData, processedData.length, paginationInfo, viewMode, searchTerm, filters, dateRange, numberRange, multiSelect, sortField, sortDirection, pageSize, currentPage]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDateRangeChange = (field, type, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const handleNumberRangeChange = (field, type, value) => {
    setNumberRange(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value === '' ? undefined : Number(value)
      }
    }));
  };

  const handleMultiSelectChange = (field, value, checked) => {
    setMultiSelect(prev => {
      const current = prev[field] || [];
      const updated = checked 
        ? [...current, value]
        : current.filter(v => v !== value);
      
      return {
        ...prev,
        [field]: updated.length > 0 ? updated : undefined
      };
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({});
    setDateRange({});
    setNumberRange({});
    setMultiSelect({});
    setSortField('');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  const exportData = () => {
    if (onExport) {
      onExport(processedData);
    }
  };

  const hasActiveFilters = searchTerm || 
    Object.values(filters).some(v => v) || 
    Object.values(dateRange).some(range => range?.start || range?.end) ||
    Object.values(numberRange).some(range => range?.min !== undefined || range?.max !== undefined) ||
    Object.values(multiSelect).some(arr => arr?.length > 0);

  const activeFilterCount = [
    searchTerm ? 1 : 0,
    Object.values(filters).filter(v => v).length,
    Object.values(dateRange).filter(range => range?.start || range?.end).length,
    Object.values(numberRange).filter(range => range?.min !== undefined || range?.max !== undefined).length,
    Object.values(multiSelect).filter(arr => arr?.length > 0).length
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {processedData.length} {processedData.length === 1 ? 'result' : 'results'}
            {hasActiveFilters && ` filtered from ${data.length} total`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          {enableViewToggle && (
            <div className={`flex rounded-lg border ${
              isDark ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 text-sm ${
                  viewMode === 'table'
                    ? isDark 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Bars3BottomLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 text-sm ${
                  viewMode === 'grid'
                    ? isDark 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Export Button */}
          {enableExport && (
            <button
              onClick={exportData}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
                isDark
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {t('common.export', 'Export')}
            </button>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border ${
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
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none`}
        />
        <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
          isDark ? 'text-gray-400' : 'text-gray-400'
        }`} />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={`p-4 rounded-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('common.filters', 'Filters')}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`text-sm ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {showAdvancedFilters ? 'Simple' : 'Advanced'}
                <ChevronDownIcon className={`inline h-4 w-4 ml-1 transform transition-transform ${
                  showAdvancedFilters ? 'rotate-180' : ''
                }`} />
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className={`inline-flex items-center text-sm ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  {t('common.clearFilters', 'Clear All')}
                </button>
              )}
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {filterableColumns.map(column => (
              <div key={column.key}>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {column.label}
                </label>
                <select
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none text-sm`}
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {getFilterOptions(column.key).map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              {/* Date Range Filters */}
              {dateColumns.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    {t('filters.dateRanges', 'Date Ranges')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateColumns.map(column => (
                      <div key={column.key} className="space-y-2">
                        <label className={`block text-xs font-medium ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {column.label}
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="date"
                            value={dateRange[column.key]?.start || ''}
                            onChange={(e) => handleDateRangeChange(column.key, 'start', e.target.value)}
                            className={`flex-1 px-3 py-2 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:border-blue-500`}
                            placeholder="From"
                          />
                          <input
                            type="date"
                            value={dateRange[column.key]?.end || ''}
                            onChange={(e) => handleDateRangeChange(column.key, 'end', e.target.value)}
                            className={`flex-1 px-3 py-2 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:border-blue-500`}
                            placeholder="To"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Number Range Filters */}
              {numberColumns.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('filters.numberRanges', 'Number Ranges')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {numberColumns.map(column => (
                      <div key={column.key} className="space-y-2">
                        <label className={`block text-xs font-medium ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {column.label}
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={numberRange[column.key]?.min || ''}
                            onChange={(e) => handleNumberRangeChange(column.key, 'min', e.target.value)}
                            className={`flex-1 px-3 py-2 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:border-blue-500`}
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            value={numberRange[column.key]?.max || ''}
                            onChange={(e) => handleNumberRangeChange(column.key, 'max', e.target.value)}
                            className={`flex-1 px-3 py-2 rounded border text-sm ${
                              isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:border-blue-500`}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sort Controls */}
      {sortableColumns.length > 0 && (
        <div className={`flex items-center space-x-4 p-3 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('common.sortBy', 'Sort by')}:
          </span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className={`px-3 py-1 rounded border text-sm ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:border-blue-500`}
          >
            <option value="">{t('common.none', 'None')}</option>
            {sortableColumns.map(column => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          {sortField && (
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-1 text-sm rounded border ${
                isDark
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('pagination.showing', 'Showing')} {startIndex + 1}-{Math.min(endIndex, processedData.length)} 
              {' '}{t('pagination.of', 'of')} {processedData.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded border text-sm ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
            >
              {[5, 10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === 1
                  ? isDark 
                    ? 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : isDark
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === 1
                  ? isDark 
                    ? 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : isDark
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              ‹
            </button>
            
            <span className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === totalPages
                  ? isDark 
                    ? 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : isDark
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded border ${
                currentPage === totalPages
                  ? isDark 
                    ? 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : isDark
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterBar;