import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

export default function FullscreenPhotoModal({ 
  isOpen, 
  onClose, 
  photo, 
  photos = [], 
  currentIndex = 0, 
  onNavigate 
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0 && onNavigate) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < photos.length - 1 && onNavigate) {
            onNavigate(currentIndex + 1);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !photo) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const canNavigateLeft = currentIndex > 0 && photos.length > 1;
  const canNavigateRight = currentIndex < photos.length - 1 && photos.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-screen-xl max-h-screen p-4 flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200 group"
          title={t('children.closeFullscreen')}
        >
          <XMarkIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Navigation Arrows */}
        {canNavigateLeft && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200 group"
            title={t('children.previousPhoto', 'Previous photo')}
          >
            <ChevronLeftIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {canNavigateRight && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200 group"
            title={t('children.nextPhoto', 'Next photo')}
          >
            <ChevronRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Image Container */}
        <div className="flex items-center justify-center max-w-full max-h-full">
          <img 
            src={photo}
            alt={t('children.fullscreenPhoto', 'Fullscreen photo')}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          />
        </div>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-black bg-opacity-50 text-white text-sm">
            {currentIndex + 1} {t('pagination.of', 'of')} {photos.length}
          </div>
        )}

        {/* Helper Text */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-center text-white text-sm opacity-70">
          <p>{t('children.closeFullscreen')}</p>
          {photos.length > 1 && (
            <p className="mt-1">
              {t('children.useArrows', 'Use arrow keys or buttons to navigate')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}