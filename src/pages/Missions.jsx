import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getMissions, getChildren } from '../utils/api';
import DynamicForm from '../components/DynamicForm';
import { api } from '../utils/api';
import { useTranslatedField } from '../hooks/useTranslatedField';

// Translation component for mission description
const TranslatedDescription = ({ mission, isDark }) => {
  const { i18n } = useTranslation();
  const { translatedText, isLoading, error } = useTranslatedField(
    'mission',
    mission.id,
    'description',
    mission.description
  );
  
  if (isLoading) {
    return (
      <div className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        <span className="opacity-50">Translating...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {mission.description || `The ${mission.name} mission is dedicated to supporting children and families in this beautiful region of Tamil Nadu. Through education, healthcare, and community programs, we work together to create lasting positive change in the lives of those we serve.`}
      </div>
    );
  }
  
  return (
    <div className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
      {translatedText || mission.description || `The ${mission.name} mission is dedicated to supporting children and families in this beautiful region of Tamil Nadu. Through education, healthcare, and community programs, we work together to create lasting positive change in the lives of those we serve.`}
    </div>
  );
};

export default function Missions({ user }) {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [children, setChildren] = useState([]);
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [users, setUsers] = useState([]);

  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  // Get user role and permissions
  const userRole = user?.role || 'sponsor';
  const canEdit = userRole === 'admin';
  const canDelete = userRole === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [missionsRes, childrenRes] = await Promise.all([
          getMissions(),
          getChildren()
        ]);
        
        if (missionsRes.data) {
          setMissions(missionsRes.data);
        }
        if (childrenRes.data) {
          setChildren(childrenRes.data);
        }
        
        // Fetch users for referent dropdown if admin
        if (canEdit) {
          await fetchUsers();
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('missions.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t, canEdit]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log('Users response:', response.data); // Debug log
      // Try both 'localReferent' and 'referent' since role names might vary
      const referents = response.data.filter(user => 
        user.role === 'localReferent' || user.role === 'referent'
      );
      console.log('Filtered referents:', referents); // Debug log
      setUsers(referents.map(user => ({
        value: user.id,
        label: user.username
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getChildrenCountForMission = (missionId) => {
    return children.filter(child => child.mission_id === missionId).length;
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setShowForm(true);
  };

  const handleFormSave = async (formData) => {
    try {
      console.log('handleFormSave called with formData:', formData);
      console.log('editingMission:', editingMission);
      
      // Check if there's a file to upload
      const hasFile = formData.photo && formData.photo instanceof File;
      
      if (hasFile) {
        // Use FormData for file upload
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description || '');
        formDataObj.append('referent_id', formData.referent_id || '');
        formDataObj.append('ui_language', i18n.language);
        formDataObj.append('photo', formData.photo);
        
        console.log('Sending FormData with file:', formData.photo.name);
        
        await api.put(`/missions/${editingMission.id}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Use JSON for regular data
        const dataToSend = {
          ...formData,
          ui_language: i18n.language
        };
        
        console.log('Sending JSON data:', dataToSend);
        
        await api.put(`/missions/${editingMission.id}`, dataToSend);
      }
      
      // Refresh missions data
      const missionsRes = await getMissions();
      if (missionsRes.data) {
        setMissions(missionsRes.data);
      }
      
      // Close the form after successful save
      setTimeout(() => {
        setShowForm(false);
        setEditingMission(null);
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving mission:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || t('form.saveError', 'Error saving mission')
      };
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMission(null);
  };

  const handleDelete = async (mission) => {
    if (window.confirm(t('common.deleteWarning', 'Are you sure you want to delete this mission? This action cannot be undone.'))) {
      try {
        await api.delete(`/missions/${mission.id}`);
        
        // Refresh missions list
        const missionsRes = await getMissions();
        if (missionsRes.data) {
          setMissions(missionsRes.data);
          
          // Adjust current index if necessary
          if (currentMissionIndex >= missionsRes.data.length && missionsRes.data.length > 0) {
            setCurrentMissionIndex(missionsRes.data.length - 1);
          } else if (missionsRes.data.length === 0) {
            setCurrentMissionIndex(0);
          }
        }
        
        // Show success message
        alert(t('common.success', 'Mission deleted successfully'));
      } catch (error) {
        console.error('Error deleting mission:', error);
        alert(t('form.deleteError', 'Error deleting mission'));
      }
    }
  };

  // Define the form fields for missions
  const missionFields = [
    {
      key: 'name',
      label: t('missions.name', 'Name'),
      type: 'text',
      required: true,
      placeholder: t('form.missionNamePlaceholder', 'Enter mission name...'),
      fullWidth: true
    },
    {
      key: 'description',
      label: t('missions.description', 'Description'),
      type: 'textarea',
      required: false,
      rows: 4,
      fullWidth: true,
      placeholder: t('translation.placeholders.description', 'Write the description in your native language, it will be translated automatically...')
    },
    {
      key: 'referent_id',
      label: t('missions.referent', 'Referent'),
      type: 'select',
      required: false,
      options: users,
      placeholder: t('form.selectReferent', 'Select a referent...')
    },
    {
      key: 'photo',
      label: t('missions.photo', 'Mission Photo'),
      type: 'file',
      required: false,
      accept: 'image/*',
      fullWidth: true
    }
  ];

  const nextMission = () => {
    setCurrentMissionIndex((prev) => (prev + 1) % missions.length);
  };

  const previousMission = () => {
    setCurrentMissionIndex((prev) => (prev - 1 + missions.length) % missions.length);
  };

  const goToMission = (index) => {
    setCurrentMissionIndex(index);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('missions.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`text-red-500 text-xl mb-4`}>⚠️</div>
          <p className={`text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🌍</div>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('missions.noMissions')}
          </p>
        </div>
      </div>
    );
  }

  const currentMission = missions[currentMissionIndex];
  const childrenCount = getChildrenCountForMission(currentMission.id);

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Header */}
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`text-4xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('missions.title')}
          </h1>
          <p className={`text-xl ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('missions.subtitle')}
          </p>
        </div>
      </div>

      {/* Mission Carousel */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="relative">
          {/* Main Mission Card */}
          <div className={`relative rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border ${
            isDark 
              ? 'bg-gray-800/90 border-gray-700' 
              : 'bg-white/90 border-white/20'
          }`}>
            {/* Mission Image */}
            <div className="relative h-96 overflow-hidden">
              <div className={`w-full h-full flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                {/* Mission Image or Placeholder */}
                <img 
                  src={currentMission.photo ? `http://localhost:5001/uploads/${currentMission.photo}` : `/images/missions/${currentMission.photo}`} 
                  alt={currentMission.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="text-center" style={{ display: 'none' }}>
                  <div className="text-8xl mb-4">🌍</div>
                  <div className={`text-2xl font-bold ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {currentMission.name}
                  </div>
                  <div className={`text-lg ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Tamil Nadu, India
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              
              {/* Mission Name Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-4xl font-bold text-white mb-2">
                  {currentMission.name}
                </h2>
                <div className="flex items-center text-white/90">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-lg">Tamil Nadu, India</span>
                </div>
              </div>
            </div>

            {/* Mission Details */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Stats */}
                <div className="space-y-6">
                  {/* Children Count */}
                  <div className={`flex items-center p-4 rounded-2xl ${
                    isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                  }`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${
                      isDark ? 'bg-indigo-600' : 'bg-indigo-500'
                    }`}>
                      <span className="text-2xl text-white">👶</span>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${
                        isDark ? 'text-indigo-300' : 'text-indigo-700'
                      }`}>
                        {childrenCount}
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {childrenCount === 1 ? t('missions.child') : t('missions.children')}
                      </div>
                    </div>
                  </div>

                  {/* Referent Info */}
                  <div className={`p-4 rounded-2xl ${
                    isDark ? 'bg-purple-900/30' : 'bg-purple-50'
                  }`}>
                    <div className="flex items-center">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${
                        isDark ? 'bg-purple-600' : 'bg-purple-500'
                      }`}>
                        <span className="text-2xl text-white">👤</span>
                      </div>
                      <div>
                        <div className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {t('missions.managedBy')}
                        </div>
                        <div className={`font-semibold ${
                          isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          {currentMission.referent_username || 'Local Referent'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Description */}
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl font-semibold mb-4 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {t('missions.aboutThisMission', 'About This Mission')}
                    </h3>
                    <TranslatedDescription mission={currentMission} isDark={isDark} />
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => navigate(`/missions/${currentMission.id}`)}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isDark 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                      } shadow-lg hover:shadow-xl`}
                    >
                      👁️ {t('common.viewDetails', 'View Details')}
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(currentMission)}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                          isDark 
                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                        } shadow-lg hover:shadow-xl`}
                      >
                        🗑️ {t('common.delete')}
                      </button>
                    )}
                    {canEdit && (
                      <button 
                        onClick={() => handleEdit(currentMission)}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                          isDark 
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                        } shadow-lg hover:shadow-xl`}
                      >
                        ✏️ {t('common.edit')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {missions.length > 1 && (
            <>
              <button
                onClick={previousMission}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                  isDark 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextMission}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                  isDark 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-white text-gray-800 hover:bg-gray-50'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Mission Indicators */}
        {missions.length > 1 && (
          <div className="flex justify-center mt-8 space-x-3">
            {missions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToMission(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index === currentMissionIndex
                    ? 'bg-indigo-500 w-8'
                    : isDark 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Mission Counter */}
        {missions.length > 1 && (
          <div className="text-center mt-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentMissionIndex + 1} {t('missions.of')} {missions.length}
            </span>
          </div>
        )}
      </div>

      {/* Mission Edit Form Modal */}
      {showForm && (
        <DynamicForm
          key={editingMission?.id || 'new'}
          fields={missionFields}
          initialData={editingMission}
          onSubmit={handleFormSave}
          onCancel={handleFormCancel}
          title={t('form.editMission', 'Edit Mission')}
          showDeleteButton={false}
        />
      )}
    </div>
  );
}
