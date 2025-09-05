import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslatedField } from '../hooks/useTranslatedField';
import { api, API_BASE } from '../utils/api';
import FullscreenPhotoModal from '../components/FullscreenPhotoModal';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  MapPinIcon, 
  HeartIcon, 
  UserIcon, 
  PhotoIcon, 
  PlayIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function ChildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useSelector(state => state.auth);
  const [child, setChild] = useState(null);
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Translated fields
  const { translatedText: translatedName } = useTranslatedField(
    'children', 
    child?.id, 
    'name', 
    child?.name
  );
  
  const { translatedText: translatedStory } = useTranslatedField(
    'children', 
    child?.id, 
    'story', 
    child?.story
  );

  const { translatedText: translatedNeeds } = useTranslatedField(
    'children', 
    child?.id, 
    'needs', 
    child?.needs
  );

  const { translatedText: translatedVillage } = useTranslatedField(
    'children', 
    child?.id, 
    'village', 
    child?.village
  );

  const { translatedText: translatedDescription } = useTranslatedField(
    'children', 
    child?.id, 
    'description', 
    child?.description
  );

  // Debug log per verificare cosa viene passato all'hook
  useEffect(() => {
    if (child) {
      console.log('🔍 ChildDetail: Child data loaded:', {
        id: child.id,
        name: child.name,
        description: child.description?.substring(0, 50) + '...',
        currentLanguage: i18n.language
      });
      console.log('🔍 ChildDetail: translatedDescription:', translatedDescription?.substring(0, 50) + '...');
    }
  }, [child, translatedDescription, i18n.language]);

  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setLoading(true);
        // Get all children to enable carousel navigation
        const response = await api.get('/children');
        const children = response.data;
        setAllChildren(children);
        
        const childItem = children.find(item => item.id === parseInt(id));
        
        if (!childItem) {
          setError('Child not found');
          return;
        }
        
        setChild(childItem);
      } catch (err) {
        setError('Failed to load child information');
        console.error('Error fetching child:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChildrenData();
    }
  }, [id]);

  // Get current child index for carousel navigation
  const currentChildIndex = allChildren.findIndex(c => c.id === parseInt(id));
  const previousChild = currentChildIndex > 0 ? allChildren[currentChildIndex - 1] : null;
  const nextChild = currentChildIndex < allChildren.length - 1 ? allChildren[currentChildIndex + 1] : null;

  // Handle carousel navigation
  const navigateToChild = (childId) => {
    navigate(`/children/${childId}`);
  };

  // Handle fullscreen photo functionality
  const openFullscreenPhoto = (photoSrc, index = 0) => {
    setFullscreenPhoto(photoSrc);
    setCurrentPhotoIndex(index);
  };

  const closeFullscreenPhoto = () => {
    setFullscreenPhoto(null);
    setCurrentPhotoIndex(0);
  };

  const navigatePhoto = (newIndex) => {
    if (child?.media && child.media[newIndex]) {
      const newPhoto = `${API_BASE}/uploads/${child.media[newIndex].media_path}`;
      setFullscreenPhoto(newPhoto);
      setCurrentPhotoIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-96 bg-gray-300 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link 
            to="/children"
            className={`inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors ${
              isDark ? 'text-blue-400 hover:text-blue-300' : ''
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('common.backToChildren', 'Back to Children')}
          </Link>
          <div className={`text-center py-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-4">{t('children.notFound')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {t('children.notFoundDesc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(child.birth);
  const photos = child.media ? child.media.filter(m => m.media_type === 'photo') : [];
  const photoUrls = photos.map(photo => `${API_BASE}/uploads/${photo.media_path}`);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/children"
            className={`inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors ${
              isDark ? 'text-blue-400 hover:text-blue-300' : ''
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('common.backToChildren', 'Back to Children')}
          </Link>

          {/* Child Navigation Carousel */}
          <div className="flex items-center space-x-4">
            {previousChild && (
              <button
                onClick={() => navigateToChild(previousChild.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                }`}
                title={t('children.previousChild')}
              >
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">{t('children.previousChild')}</span>
              </button>
            )}
            
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentChildIndex + 1} {t('pagination.of')} {allChildren.length}
            </span>

            {nextChild && (
              <button
                onClick={() => navigateToChild(nextChild.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                }`}
                title={t('children.nextChild')}
              >
                <span className="text-sm">{t('children.nextChild')}</span>
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          
          {/* Hero Section with Profile */}
          <div className="relative">
            {/* Hero Background with Gradient */}
            <div className="h-80 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            </div>
            
            {/* Profile Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-8">
                
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-white">
                    <img 
                      src={child.photo ? `${API_BASE}/uploads/${child.photo}` : '/default-child.jpg'}
                      alt={translatedName || child.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {child.is_sponsored && (
                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-3 shadow-lg">
                      <HeartIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Basic Info */}
                <div className="flex-1 text-white">
                  <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
                    {translatedName || child.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-6 text-lg">
                    {age && (
                      <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        <span>{age} {t('children.yearsOld')}</span>
                      </div>
                    )}
                    
                    {child.village && (
                      <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
                        <MapPinIcon className="w-5 h-5 mr-2" />
                        <span>{translatedVillage || child.village}</span>
                      </div>
                    )}
                    
                    {child.gender && (
                      <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <span>{t(`children.gender.${child.gender}`)}</span>
                      </div>
                    )}
                  </div>

                  {/* Sponsorship Status */}
                  <div className="mt-4">
                    {user?.role === 'sponsor' ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white shadow-lg">
                        <HeartIcon className="w-4 h-4 mr-2" />
                        {t('children.sponsored')}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        child.is_sponsored 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      } shadow-lg`}>
                        {child.is_sponsored ? (
                          <>
                            <HeartIcon className="w-4 h-4 mr-2" />
                            {t('children.sponsored')}
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-4 h-4 mr-2" />
                            {t('children.availableForSponsorship')}
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-8 space-y-8">
            
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {child.school && (
                <div className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-blue-50'
                } border-l-4 border-blue-500`}>
                  <div className="flex items-center">
                    <AcademicCapIcon className="w-6 h-6 text-blue-500 mr-3" />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('children.school')}
                      </p>
                      <p className="text-lg font-semibold">{child.school}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {child.grade && (
                <div className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-green-50'
                } border-l-4 border-green-500`}>
                  <div className="flex items-center">
                    <AcademicCapIcon className="w-6 h-6 text-green-500 mr-3" />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('children.grade')}
                      </p>
                      <p className="text-lg font-semibold">{child.grade}</p>
                    </div>
                  </div>
                </div>
              )}

              {child.family_members && (
                <div className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-purple-50'
                } border-l-4 border-purple-500`}>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-6 h-6 text-purple-500 mr-3" />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('children.familyMembers')}
                      </p>
                      <p className="text-lg font-semibold">{child.family_members}</p>
                    </div>
                  </div>
                </div>
              )}

              {child.birth && (
                <div className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-pink-50'
                } border-l-4 border-pink-500`}>
                  <div className="flex items-center">
                    <CalendarIcon className="w-6 h-6 text-pink-500 mr-3" />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('children.birthDate')}
                      </p>
                      <p className="text-lg font-semibold">
                        {new Date(child.birth).toLocaleDateString()}
                      </p>
                      {age && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {age} {t('children.yearsOld')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Story Section */}
            {child.story && (
              <div className={`p-8 rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-blue-500 rounded mr-4"></div>
                  {t('children.story')}
                </h3>
                <div className="prose prose-lg max-w-none">
                  <p className={`text-lg leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {translatedStory || child.story}
                  </p>
                </div>
              </div>
            )}

            {/* Needs Section */}
            {child.needs && (
              <div className={`p-8 rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-orange-50'
              } border-l-4 border-orange-500`}>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-orange-500 rounded mr-4"></div>
                  {t('children.needs')}
                </h3>
                <div className="prose prose-lg max-w-none">
                  <p className={`text-lg leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {translatedNeeds || child.needs}
                  </p>
                </div>
              </div>
            )}

            {/* Story Section */}
            {child.story && (
              <div>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-blue-500 rounded mr-4"></div>
                  {t('children.story')}
                </h3>
                <div className={`prose prose-lg max-w-none ${
                  isDark ? 'prose-invert' : ''
                }`}>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {translatedStory || child.story}
                  </p>
                </div>
              </div>
            )}

            {/* Description Section */}
            {child.description && (
              <div>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-indigo-500 rounded mr-4"></div>
                  {t('children.description', 'Description')}
                </h3>
                <div className={`prose prose-lg max-w-none ${
                  isDark ? 'prose-invert' : ''
                }`}>
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {translatedDescription || child.description}
                  </p>
                </div>
              </div>
            )}

            {/* Hobbies and Interests */}
            {child.hobbies && child.hobbies.length > 0 && (
              <div>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-purple-500 rounded mr-4"></div>
                  {t('children.hobbies')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {child.hobbies.map((hobby, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Photo Gallery */}
            {photos.length > 0 && (
              <div>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center`}>
                  <div className="w-1 h-8 bg-green-500 rounded mr-4"></div>
                  {t('children.photos')}
                  <span className={`ml-3 text-sm font-normal ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ({photos.length})
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((media, index) => (
                    <div 
                      key={index} 
                      className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      onClick={() => openFullscreenPhoto(`${API_BASE}/uploads/${media.media_path}`, index)}
                      title={t('children.viewFullscreen')}
                    >
                      <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                        <img 
                          src={`${API_BASE}/uploads/${media.media_path}`}
                          alt={media.description || `${t('children.photo')} ${index + 1}`}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                            <PhotoIcon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>

                      {media.description && (
                        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent`}>
                          <p className="text-white text-sm font-medium">
                            {media.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mission and Referent Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Mission Details */}
              {child.mission_info && (
                <div className={`p-8 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-blue-50'
                } border border-blue-200`}>
                  <h3 className={`text-xl font-bold mb-6 text-blue-600 flex items-center`}>
                    <MapPinIcon className="w-6 h-6 mr-3" />
                    {t('children.missionDetails')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('missions.name', 'Mission Name')}
                      </p>
                      <p className="text-lg font-semibold">{child.mission_info.name}</p>
                    </div>
                    
                    {child.mission_info.description && (
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('missions.description', 'Description')}
                        </p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {child.mission_info.description}
                        </p>
                      </div>
                    )}
                    
                    {child.mission_info.location && (
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('missions.location', 'Location')}
                        </p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {child.mission_info.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Referent Details */}
              {child.referent_info && (
                <div className={`p-8 rounded-xl ${
                  isDark ? 'bg-gray-700' : 'bg-green-50'
                } border border-green-200`}>
                  <h3 className={`text-xl font-bold mb-6 text-green-600 flex items-center`}>
                    <UserIcon className="w-6 h-6 mr-3" />
                    {t('children.referentDetails')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('users.name', 'Name')}
                      </p>
                      <p className="text-lg font-semibold">{child.referent_info.name}</p>
                    </div>
                    
                    {child.referent_info.email && (
                      <div className="flex items-center space-x-3">
                        <EnvelopeIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('users.email')}
                          </p>
                          <a 
                            href={`mailto:${child.referent_info.email}`}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            {child.referent_info.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {child.referent_info.phone && (
                      <div className="flex items-center space-x-3">
                        <PhoneIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t('users.phone')}
                          </p>
                          <a 
                            href={`tel:${child.referent_info.phone}`}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            {child.referent_info.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {(child.referent_info.email || child.referent_info.phone) && (
                      <button
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        onClick={() => {
                          if (child.referent_info.email) {
                            window.location.href = `mailto:${child.referent_info.email}`;
                          } else if (child.referent_info.phone) {
                            window.location.href = `tel:${child.referent_info.phone}`;
                          }
                        }}
                      >
                        {t('children.contactReferent')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sponsor Information */}
            {child.is_sponsored && child.sponsor_info && (
              <div className={`p-8 rounded-xl border-l-4 border-red-500 ${
                isDark ? 'bg-gray-700' : 'bg-red-50'
              }`}>
                <h3 className={`text-xl font-bold mb-6 text-red-600 flex items-center`}>
                  <HeartIcon className="w-6 h-6 mr-3" />
                  {t('children.sponsorInfo')}
                </h3>
                <div className="space-y-3">
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('children.sponsoredBy')}: <strong className="text-red-600">{child.sponsor_info.name}</strong>
                  </p>
                  {child.sponsor_info.since && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('children.sponsorSince')}: {new Date(child.sponsor_info.since).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Photo Modal */}
        <FullscreenPhotoModal
          isOpen={!!fullscreenPhoto}
          onClose={closeFullscreenPhoto}
          photo={fullscreenPhoto}
          photos={photoUrls}
          currentIndex={currentPhotoIndex}
          onNavigate={navigatePhoto}
        />
      </div>
    </div>
  );
}