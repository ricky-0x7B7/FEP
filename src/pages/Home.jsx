
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div className={`relative w-full h-screen flex items-center justify-center overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-zinc-700 via-grey-700 to-slate-700' 
        : 'bg-gradient-to-br from-zinc-400 via-grey-400 to-slate-400'
    }`}>
      {/* Mandala patterns as repeating pattern overlay */}
      <div className={`absolute inset-0 bg-[url('/hero.png')] bg-repeat bg-auto mix-blend-multiply ${
        isDark ? 'opacity-80' : 'opacity-60'
      }`}></div>
      
      <div className="relative z-10 flex items-center justify-center">
        <div className={`backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-2xl mx-4 ${
          isDark 
            ? 'bg-white/90 border border-white/20' 
            : 'bg-white/95 border border-white/30'
        }`}>
          <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
            isDark ? 'text-gray-900' : 'text-gray-800'
          }`}>{t('home.welcome')}</h1>
          <p className={`text-lg md:text-xl leading-relaxed mb-8 ${
            isDark ? 'text-gray-600' : 'text-gray-700'
          }`}>
            {t('home.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200">
              {t('home.learnMore')}
            </button>
            <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors duration-200">
              {t('home.getInvolved')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
