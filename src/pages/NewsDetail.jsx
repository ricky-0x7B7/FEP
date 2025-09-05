import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslatedField } from '../hooks/useTranslatedField';
import { api } from '../utils/api';
import { ArrowLeftIcon, CalendarIcon, UserIcon, PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Translated fields
  const { translatedText: translatedTitle } = useTranslatedField(
    'news', 
    news?.id, 
    'title', 
    news?.title
  );
  
  const { translatedText: translatedContent } = useTranslatedField(
    'news', 
    news?.id, 
    'content', 
    news?.content
  );

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Get single news item from list (simulate API call)
        const response = await api.get('/news');
        const newsItem = response.data.find(item => item.id === parseInt(id));
        
        if (!newsItem) {
          setError('News not found');
          return;
        }
        
        setNews(newsItem);
      } catch (err) {
        setError('Failed to load news');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNews();
    }
  }, [id]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-12 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            to="/news"
            className={`inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 ${
              isDark ? 'text-blue-400 hover:text-blue-300' : ''
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('common.back', 'Back to News')}
          </Link>
          <div className={`text-center py-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-4">{t('news.notFound', 'News not found')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {t('news.notFoundDesc', 'The news article you are looking for does not exist.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          to="/news"
          className={`inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors ${
            isDark ? 'text-blue-400 hover:text-blue-300' : ''
          }`}
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('common.back', 'Back to News')}
        </Link>

        {/* News Content */}
        <article className={`rounded-lg shadow-lg p-8 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Title */}
          <h1 className={`text-3xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {translatedTitle || news.title}
          </h1>

          {/* Metadata */}
          <div className={`flex flex-wrap items-center gap-6 mb-8 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {news.date && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {new Date(news.date).toLocaleDateString()}
              </div>
            )}
            {news.created_by && (
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                {t('news.createdBy', 'Created by')}: {news.created_by}
              </div>
            )}
            {news.child_name && (
              <div className="flex items-center">
                <span className="font-medium">{t('news.aboutChild', 'About')}: {news.child_name}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`prose max-w-none mb-8 ${
            isDark ? 'prose-invert' : ''
          }`}>
            <div className="whitespace-pre-wrap text-lg leading-relaxed">
              {translatedContent || news.content}
            </div>
          </div>

          {/* Media Gallery */}
          {news.media && news.media.length > 0 && (
            <div className="mt-8">
              <h3 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('news.media', 'Media')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.media.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.media_type === 'photo' ? (
                      <div className="relative">
                        <img 
                          src={`/uploads/${media.media_path}`}
                          alt={media.description || `Photo ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <video 
                          src={`/uploads/${media.media_path}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md"
                          controls
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 rounded-full p-2">
                          <PlayIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {media.description && (
                      <p className={`mt-2 text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {media.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}