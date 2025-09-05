import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { login } from '../utils/api';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      dispatch(loginFailure(t('login.required')));
      return;
    }
    
    dispatch(loginStart());
    
    try {
      const res = await login(username, password);
      console.log('Login response:', res); // For debugging
      if (res.data && res.data.success && res.data.user) {
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(res.data.user));
        dispatch(loginSuccess(res.data.user));
        navigate('/');
      } else {
        dispatch(loginFailure(res.data?.error || t('login.failed')));
      }
    } catch (err) {
      console.error('Login error:', err); // For debugging
      dispatch(loginFailure(err.response?.data?.error || err.error || t('login.networkError')));
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
            isDark 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <div className="relative">
              <div className="h-8 w-8 bg-orange-400 rounded-lg transform -rotate-12 absolute -top-1 -left-1"></div>
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center relative z-10">
                <span className="text-orange-500 font-bold text-lg">குட்டி</span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('login.title')}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <div className={`backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-white/20'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className={`border rounded-xl p-4 ${
                isDark 
                  ? 'bg-red-900/20 border-red-800 text-red-300' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex">
                  <svg className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('login.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder={t('login.usernameplaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('login.signingIn')}
                  </>
                ) : (
                  <>
                    ✨ {t('login.signin')}
                  </>
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className={`mt-6 p-4 rounded-xl ${
              isDark 
                ? 'bg-gray-700/50 border border-gray-600' 
                : 'bg-gray-50 border border-gray-100'
            }`}>
              <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('login.demo')}
              </h3>
              <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <div><span className="font-medium">{t('login.admin')}:</span> ricky / admin123</div>
                <div><span className="font-medium">{t('login.referent')}:</span> regina / regina123</div>
                <div><span className="font-medium">{t('login.sponsor')}:</span> mario_rossi / mario123</div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
