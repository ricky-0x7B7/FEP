import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslatedField } from '../hooks/useTranslatedField';

// Translation component for news title in modal
const TranslatedModalTitle = ({ news, isDark }) => {
  const { i18n } = useTranslation();
  const { translatedText, isLoading } = useTranslatedField(
    'news',
    news.id,
    'title',
    news.title
  );
  
  return (
    <h2 className={`text-xl font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {translatedText}
      {isLoading && <span className="ml-2 text-xs opacity-50">...</span>}
    </h2>
  );
};

// Translation component for news content in modal
const TranslatedModalContent = ({ news, isDark }) => {
  const { i18n } = useTranslation();
  const { translatedText, isLoading } = useTranslatedField(
    'news',
    news.id,
    'content',
    news.content
  );
  
  return (
    <div className={`
      prose max-w-none whitespace-pre-wrap
      ${isDark ? 'prose-invert text-gray-300' : 'text-gray-700'}
    `}>
      {translatedText}
      {isLoading && <div className="text-xs opacity-50 mt-2">Translating...</div>}
    </div>
  );
};

export default function NewsModal({ news, isOpen, onClose }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!isOpen || !news) return null;

  const mediaFiles = news.media || [];
  const hasMedia = mediaFiles.length > 0;
  const currentMedia = hasMedia ? mediaFiles[currentMediaIndex] : null;

  const nextMedia = () => {
    if (currentMediaIndex < mediaFiles.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getCreatorInfo = () => {
    const creator = news.created_by_username;
    const creatorRole = news.created_by_role;
    const updater = news.updated_by_username;
    const updaterRole = news.updated_by_role;
    
    if (updater && updater !== creator) {
      return `${t('news.updatedBy', 'Updated by')} ${updater} (${updaterRole})`;
    } else if (creator) {
      return `${t('news.createdBy', 'Created by')} ${creator} (${creatorRole})`;
    }
    return '';
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className={`
          relative w-full max-w-4xl mx-auto rounded-lg shadow-lg max-h-[90vh] overflow-hidden
          ${isDark ? 'bg-gray-800' : 'bg-white'}
        `}>
          {/* Header */}
          <div className={`
            flex items-center justify-between p-6 border-b
            ${isDark ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <div className="flex-1 min-w-0">
              <TranslatedModalTitle news={news} isDark={isDark} />
              <div className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>{news.child_name}</span>
                {news.mission_name && <span> • {news.mission_name}</span>}
                <span> • {formatDate(news.date)}</span>
              </div>
              {getCreatorInfo() && (
                <div className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {getCreatorInfo()}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className={`
                ml-4 p-2 rounded-lg transition-colors
                ${isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Media Section */}
              {hasMedia && (
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('news.media', 'Media')} ({mediaFiles.length})
                  </h3>
                  
                  {/* Media Viewer */}
                  <div className="relative">
                    <div className={`
                      relative rounded-lg overflow-hidden
                      ${isDark ? 'bg-gray-900' : 'bg-gray-100'}
                    `}>
                      {currentMedia.media_type === 'photo' ? (
                        <img
                          src={`http://localhost:5001/uploads/${currentMedia.media_path}`}
                          alt={currentMedia.description || 'News photo'}
                          className="w-full h-auto max-h-96 object-contain cursor-pointer"
                          onClick={() => setShowFullImage(true)}
                        />
                      ) : (
                        <video
                          src={`http://localhost:5001/uploads/${currentMedia.media_path}`}
                          controls
                          className="w-full h-auto max-h-96"
                          preload="metadata"
                        >
                          {t('news.videoNotSupported', 'Your browser does not support video playback.')}
                        </video>
                      )}
                      
                      {/* Media Navigation */}
                      {mediaFiles.length > 1 && (
                        <>
                          <button
                            onClick={prevMedia}
                            disabled={currentMediaIndex === 0}
                            className={`
                              absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full
                              ${currentMediaIndex === 0 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-black/20'
                              }
                              bg-black/50 text-white transition-all
                            `}
                          >
                            <ChevronLeftIcon className="h-6 w-6" />
                          </button>
                          
                          <button
                            onClick={nextMedia}
                            disabled={currentMediaIndex === mediaFiles.length - 1}
                            className={`
                              absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full
                              ${currentMediaIndex === mediaFiles.length - 1 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-black/20'
                              }
                              bg-black/50 text-white transition-all
                            `}
                          >
                            <ChevronRightIcon className="h-6 w-6" />
                          </button>
                        </>
                      )}
                      
                      {/* Media Counter */}
                      {mediaFiles.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentMediaIndex + 1} / {mediaFiles.length}
                        </div>
                      )}
                    </div>

                    {/* Media Description */}
                    {currentMedia.description && (
                      <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {currentMedia.description}
                      </div>
                    )}
                  </div>

                  {/* Media Thumbnails */}
                  {mediaFiles.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {mediaFiles.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMediaIndex(index)}
                          className={`
                            flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all
                            ${index === currentMediaIndex 
                              ? (isDark ? 'border-blue-400' : 'border-blue-500')
                              : (isDark ? 'border-gray-600' : 'border-gray-300')
                            }
                          `}
                        >
                          {media.media_type === 'photo' ? (
                            <img
                              src={`http://localhost:5001/uploads/${media.media_path}`}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`
                              w-full h-full flex items-center justify-center
                              ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
                            `}>
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Content Section */}
              <div className="space-y-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('news.content', 'Content')}
                </h3>
                <TranslatedModalContent news={news} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Image Modal */}
      {showFullImage && currentMedia && currentMedia.media_type === 'photo' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-[61]"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <img
            src={`http://localhost:5001/uploads/${currentMedia.media_path}`}
            alt={currentMedia.description || 'Full size photo'}
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={() => setShowFullImage(false)}
          />
        </div>
      )}
    </>
  );
}
