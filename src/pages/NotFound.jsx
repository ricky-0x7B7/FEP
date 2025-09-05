import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { HomeIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${
          isDark ? 'bg-red-500/10' : 'bg-red-500/5'
        } blur-3xl`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${
          isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/5'
        } blur-3xl`}></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className={`mx-auto w-48 h-48 rounded-full flex items-center justify-center mb-8 ${
          isDark 
            ? 'bg-red-500/20 text-red-400' 
            : 'bg-red-50 text-red-500'
        }`}>
          <ExclamationTriangleIcon className="w-40 h-40" />
        </div>

        {/* 404 Text */}
        <div className="mb-6">
          <h1 className={`text-6xl md:text-7xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            404
          </h1>
          <div className={`w-16 h-1 mx-auto rounded-full ${
            isDark ? 'bg-red-400' : 'bg-red-500'
          }`}></div>
        </div>

        {/* Message */}
        <h2 className={`text-2xl md:text-3xl font-semibold mb-4 ${
          isDark ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {t('notFound.title')}
        </h2>
        
        <p className={`text-lg mb-8 leading-relaxed ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {t('notFound.message')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            {t('notFound.goBack')}
          </button>
          
          <button
            onClick={() => navigate('/')}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              isDark
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            {t('notFound.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
