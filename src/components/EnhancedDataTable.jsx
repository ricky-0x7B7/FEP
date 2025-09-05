import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import AdvancedFilterBar from './AdvancedFilterBar';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Enhanced DataTable with Advanced Filtering
 * Combines AdvancedFilterBar with responsive table and grid views
 */
const EnhancedDataTable = ({
  data = [],
  columns = [],
  title = "Data",
  onRowClick = null,
  onEdit = null,
  onDelete = null,
  onView = null,
  onExport = null,
  enablePagination = true,
  enableExport = true,
  enableViewToggle = true,
  defaultPageSize = 10,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  className = ""
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState('table');

  // Handle data changes from AdvancedFilterBar
  const handleDataChange = useCallback(({ data: newData, totalCount, pagination: newPagination, viewMode: newViewMode }) => {
    setFilteredData(newData);
    setPagination(newPagination);
    setViewMode(newViewMode);
  }, []);

  // Export handler
  const handleExport = useCallback((dataToExport) => {
    if (onExport) {
      onExport(dataToExport);
    } else {
      // Default CSV export
      exportToCSV(dataToExport);
    }
  }, [onExport]);

  // Default CSV export function
  const exportToCSV = useCallback((dataToExport) => {
    const headers = columns.map(col => col.label).join(',');
    const rows = dataToExport.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [columns, title]);

  // Render action buttons
  const renderActions = (row) => {
    const actions = [];
    
    if (onView) {
      actions.push(
        <button
          key="view"
          onClick={(e) => {
            e.stopPropagation();
            onView(row);
          }}
          className={`p-1 rounded hover:bg-opacity-20 ${
            isDark 
              ? 'text-blue-400 hover:bg-blue-400' 
              : 'text-blue-600 hover:bg-blue-600'
          }`}
          title={t('common.view', 'View')}
        >
          <EyeIcon className="h-4 w-4" />
        </button>
      );
    }
    
    if (onEdit) {
      actions.push(
        <button
          key="edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
          className={`p-1 rounded hover:bg-opacity-20 ${
            isDark 
              ? 'text-yellow-400 hover:bg-yellow-400' 
              : 'text-yellow-600 hover:bg-yellow-600'
          }`}
          title={t('common.edit', 'Edit')}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      );
    }
    
    if (onDelete) {
      actions.push(
        <button
          key="delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className={`p-1 rounded hover:bg-opacity-20 ${
            isDark 
              ? 'text-red-400 hover:bg-red-400' 
              : 'text-red-600 hover:bg-red-600'
          }`}
          title={t('common.delete', 'Delete')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      );
    }

    return actions.length > 0 ? (
      <div className="flex items-center space-x-1">
        {actions}
      </div>
    ) : null;
  };

  // Table view
  const renderTableView = () => (
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
                  }`}
                >
                  {column.label}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className={`px-6 py-4 text-left text-sm font-semibold ${
                  isDark ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {t('common.actions', 'Actions')}
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-opacity-50' : ''
                } ${
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
                {(onView || onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className={`text-center py-12 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-1">{emptyMessage}</p>
          <p>{t('common.noResultsDesc', 'Try adjusting your search or filter criteria')}</p>
        </div>
      )}
    </div>
  );

  // Grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredData.map((row, index) => (
        <div
          key={row.id || index}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`p-6 rounded-xl shadow-lg transition-all ${
            onRowClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''
          } ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          {/* Card Content */}
          <div className="space-y-3">
            {columns.slice(0, 4).map(column => (
              <div key={column.key}>
                <dt className={`text-xs font-medium uppercase tracking-wide ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {column.label}
                </dt>
                <dd className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </dd>
              </div>
            ))}
          </div>

          {/* Card Actions */}
          {(onView || onEdit || onDelete) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {renderActions(row)}
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className={`col-span-full text-center py-12 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-medium mb-1">{emptyMessage}</p>
          <p>{t('common.noResultsDesc', 'Try adjusting your search or filter criteria')}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Advanced Filter Bar */}
      <AdvancedFilterBar
        data={data}
        columns={columns}
        onDataChange={handleDataChange}
        onExport={handleExport}
        title={title}
        searchPlaceholder={searchPlaceholder}
        enablePagination={enablePagination}
        enableExport={enableExport}
        enableViewToggle={enableViewToggle}
        defaultPageSize={defaultPageSize}
      />

      {/* Data Display */}
      {viewMode === 'table' ? renderTableView() : renderGridView()}
    </div>
  );
};

export default EnhancedDataTable;