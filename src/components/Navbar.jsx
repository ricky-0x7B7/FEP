import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ userRole, onLogout, user }) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
    setLangMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    onLogout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.username || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin': 
        return { 
          color: isDark 
            ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white' 
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white', 
          badge: '👑',
          label: t('role.administrator')
        };
      case 'referent': 
        return { 
          color: isDark 
            ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', 
          badge: '🌍',
          label: t('role.localReferent')
        };
      case 'sponsor': 
        return { 
          color: isDark 
            ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white', 
          badge: '❤️',
          label: t('role.sponsor')
        };
      default: 
        return { 
          color: isDark 
            ? 'bg-gradient-to-r from-gray-400 to-slate-400 text-white' 
            : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white', 
          badge: '👤',
          label: t('role.user')
        };
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const roleInfo = userRole ? getRoleInfo(userRole) : null;

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' }
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? isDark 
            ? 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-700/50' 
            : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50'
          : isDark 
            ? 'bg-gray-900/90 backdrop-blur-sm shadow-sm' 
            : 'bg-white/90 backdrop-blur-sm shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <span className={`text-xl font-bold bg-gradient-to-r ${
                    isDark 
                      ? 'from-white to-gray-300' 
                      : 'from-gray-800 to-gray-600'
                  } bg-clip-text text-transparent`}>
                    KuttiApp
                  </span>
                  <div className={`text-xs -mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('nav.supporting')}
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {userRole && (
                <>
                  <Link
                    to="/missions"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActiveRoute('/missions') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300 shadow-sm' 
                          : 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    🌍 {t('nav.missions')}
                  </Link>
                  <Link
                    to="/news"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActiveRoute('/news') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300 shadow-sm' 
                          : 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    📰 {t('nav.news')}
                  </Link>
                  <Link
                    to="/children"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActiveRoute('/children') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300 shadow-sm' 
                          : 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    👶 {t('nav.children')}
                  </Link>
                  <Link
                    to="/enhanced-children"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActiveRoute('/enhanced-children') 
                        ? isDark 
                          ? 'bg-purple-900/50 text-purple-300 shadow-sm' 
                          : 'bg-purple-100 text-purple-700 shadow-sm'
                        : isDark 
                          ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                  >
                    🔍 {t('nav.enhancedChildren', 'Enhanced Children')}
                  </Link>
                  {userRole === 'admin' && (
                    <Link
                      to="/users"
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActiveRoute('/users') 
                          ? isDark 
                            ? 'bg-red-900/50 text-red-300 shadow-sm' 
                            : 'bg-red-100 text-red-700 shadow-sm'
                          : isDark 
                            ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      👥 {t('nav.users')}
                    </Link>
                  )}
                  {userRole === 'admin' && (
                    <Link
                      to="/filter-demo"
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActiveRoute('/filter-demo') 
                          ? isDark 
                            ? 'bg-yellow-900/50 text-yellow-300 shadow-sm' 
                            : 'bg-yellow-100 text-yellow-700 shadow-sm'
                          : isDark 
                            ? 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-900/20' 
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      🚀 {t('nav.filterDemo', 'Filter Demo')}
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Theme Toggle, Language Selector & User Menu */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDark ? t('theme.lightMode') : t('theme.darkMode')}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{currentLang.flag}</span>
                  <span className="hidden md:block">{currentLang.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {langMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  } ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1">
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => changeLanguage(language.code)}
                          className={`w-full text-left flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                            i18n.language === language.code
                              ? isDark 
                                ? 'bg-indigo-900/50 text-indigo-300' 
                                : 'bg-indigo-100 text-indigo-700'
                              : isDark 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg">{language.flag}</span>
                          <span>{language.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold ${roleInfo?.color || 'bg-gray-500 text-white'}`}>
                      {getUserInitials()}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {getUserDisplayName()}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {roleInfo?.label || t('role.user')}
                      </div>
                    </div>
                    <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    } ring-1 ring-black ring-opacity-5 z-50`}>
                      <div className="py-1">
                        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${roleInfo?.color || 'bg-gray-500 text-white'}`}>
                              {getUserInitials()}
                            </div>
                            <div>
                              <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {getUserDisplayName()}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {roleInfo?.label || t('role.user')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            isDark 
                              ? 'text-red-400 hover:bg-red-900/20' 
                              : 'text-red-600 hover:bg-red-50'
                          } transition-colors`}
                        >
                          {t('nav.signout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!user && (
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {t('nav.signin')}
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setOpen(!open)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className={`lg:hidden border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {userRole && (
                <>
                  <Link
                    to="/missions"
                    className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActiveRoute('/missions') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300' 
                          : 'bg-indigo-100 text-indigo-700'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    🌍 {t('nav.missions')}
                  </Link>
                  <Link
                    to="/news"
                    className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActiveRoute('/news') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300' 
                          : 'bg-indigo-100 text-indigo-700'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    📰 {t('nav.news')}
                  </Link>
                  <Link
                    to="/children"
                    className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActiveRoute('/children') 
                        ? isDark 
                          ? 'bg-indigo-900/50 text-indigo-300' 
                          : 'bg-indigo-100 text-indigo-700'
                        : isDark 
                          ? 'text-gray-300 hover:text-indigo-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    👶 {t('nav.children')}
                  </Link>
                  <Link
                    to="/enhanced-children"
                    className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                      isActiveRoute('/enhanced-children') 
                        ? isDark 
                          ? 'bg-purple-900/50 text-purple-300' 
                          : 'bg-purple-100 text-purple-700'
                        : isDark 
                          ? 'text-gray-300 hover:text-purple-400 hover:bg-gray-800' 
                          : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    🔍 {t('nav.enhancedChildren', 'Enhanced Children')}
                  </Link>
                  {userRole === 'admin' && (
                    <Link
                      to="/users"
                      className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                        isActiveRoute('/users') 
                          ? isDark 
                            ? 'bg-red-900/50 text-red-300' 
                            : 'bg-red-100 text-red-700'
                          : isDark 
                            ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      👥 {t('nav.users')}
                    </Link>
                  )}
                  {userRole === 'admin' && (
                    <Link
                      to="/filter-demo"
                      className={`block px-3 py-2 rounded-xl text-base font-medium transition-colors ${
                        isActiveRoute('/filter-demo') 
                          ? isDark 
                            ? 'bg-yellow-900/50 text-yellow-300' 
                            : 'bg-yellow-100 text-yellow-700'
                          : isDark 
                            ? 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-900/20' 
                            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      🚀 {t('nav.filterDemo', 'Filter Demo')}
                    </Link>
                  )}
                </>
              )}

              {/* Mobile User Section */}
              {userRole ? (
                <div className={`border-t pt-4 mt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center px-4 py-3 mb-2">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold mr-3 ${roleInfo?.color || 'bg-gray-500 text-white'}`}>
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {getUserDisplayName()}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {roleInfo?.label || t('role.user')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`w-full text-left px-4 py-3 text-base font-medium transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/20' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {isDark ? '☀️' : '🌙'} {isDark ? t('theme.lightMode') : t('theme.darkMode')}
                  </button>
                  
                  {/* Mobile Language Selector */}
                  <div className={`px-4 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>
                    {t('nav.language')}
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className={`w-full text-left flex items-center space-x-3 px-6 py-2 text-base transition-colors ${
                        i18n.language === language.code
                          ? isDark 
                            ? 'bg-indigo-900/50 text-indigo-300' 
                            : 'bg-indigo-100 text-indigo-700'
                          : isDark 
                            ? 'text-gray-300 hover:bg-gray-800' 
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 text-base font-medium transition-colors ${
                      isDark 
                        ? 'text-red-400 hover:bg-red-900/20' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {t('nav.signout')}
                  </button>
                </div>
              ) : (
                <div className={`border-t pt-4 mt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Link
                    to="/login"
                    className={`block px-4 py-3 text-base font-medium transition-colors ${
                      isDark 
                        ? 'text-indigo-400 hover:bg-indigo-900/20' 
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.signin')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Overlay for mobile menu */}
      {open && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-25" 
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
