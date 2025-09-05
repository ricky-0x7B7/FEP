import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslatedField } from '../hooks/useTranslatedField';
import { api } from '../utils/api';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UserGroupIcon, CurrencyEuroIcon, PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Translated fields
  const { translatedText: translatedName } = useTranslatedField(
    'missions', 
    mission?.id, 
    'name', 
    mission?.name
  );
  
  const { translatedText: translatedDescription } = useTranslatedField(
    'missions', 
    mission?.id, 
    'description', 
    mission?.description
  );

  const { translatedText: translatedLocation } = useTranslatedField(
    'missions', 
    mission?.id, 
    'location', 
    mission?.location
  );

  useEffect(() => {
    const fetchMission = async () => {
      try {
        setLoading(true);
        // Get single mission from list (simulate API call)
        const response = await api.get('/missions');
        const missionItem = response.data.find(item => item.id === parseInt(id));
        
        if (!missionItem) {
          setError('Mission not found');
          return;
        }
        
        setMission(missionItem);
      } catch (err) {
        setError('Failed to load mission');
        console.error('Error fetching mission:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMission();
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

  if (error || !mission) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            to="/missions"
            className={`inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 ${
              isDark ? 'text-blue-400 hover:text-blue-300' : ''
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('common.back', 'Back to Missions')}
          </Link>
          <div className={`text-center py-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-4">{t('missions.notFound', 'Mission not found')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {t('missions.notFoundDesc', 'The mission you are looking for does not exist.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = mission.status === 'active' ? 'bg-green-100 text-green-800' : 
                     mission.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                     'bg-gray-100 text-gray-800';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link 
          to="/missions"
          className={`inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors ${
            isDark ? 'text-blue-400 hover:text-blue-300' : ''
          }`}
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          {t('common.back', 'Back to Missions')}
        </Link>

        {/* Mission Content */}
        <article className={`rounded-lg shadow-lg p-8 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <h1 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {translatedName || mission.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} ${
              isDark ? 'bg-opacity-20' : ''
            }`}>
              {t(`missions.status.${mission.status}`, mission.status)}
            </span>
          </div>

          {/* Metadata Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {mission.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                <span>{translatedLocation || mission.location}</span>
              </div>
            )}
            {mission.start_date && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{t('missions.startDate', 'Start')}: {new Date(mission.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {mission.end_date && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{t('missions.endDate', 'End')}: {new Date(mission.end_date).toLocaleDateString()}</span>
              </div>
            )}
            {mission.budget && (
              <div className="flex items-center">
                <CurrencyEuroIcon className="w-4 h-4 mr-2" />
                <span>{t('missions.budget', 'Budget')}: €{mission.budget.toLocaleString()}</span>
              </div>
            )}
            {mission.participants && (
              <div className="flex items-center">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                <span>{t('missions.participants', 'Participants')}: {mission.participants}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className={`prose max-w-none mb-8 ${
            isDark ? 'prose-invert' : ''
          }`}>
            <h3 className={`text-xl font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {t('missions.description', 'Description')}
            </h3>
            <div className="whitespace-pre-wrap text-lg leading-relaxed">
              {translatedDescription || mission.description}
            </div>
          </div>

          {/* Objectives */}
          {mission.objectives && mission.objectives.length > 0 && (
            <div className="mb-8">
              <h3 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('missions.objectives', 'Objectives')}
              </h3>
              <ul className={`space-y-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {mission.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress */}
          {mission.progress !== undefined && (
            <div className="mb-8">
              <h3 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('missions.progress', 'Progress')}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${mission.progress}%` }}
                ></div>
              </div>
              <p className={`mt-2 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {mission.progress}% {t('missions.completed', 'completed')}
              </p>
            </div>
          )}

          {/* Media Gallery */}
          {mission.media && mission.media.length > 0 && (
            <div className="mt-8">
              <h3 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('missions.media', 'Media')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mission.media.map((media, index) => (
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