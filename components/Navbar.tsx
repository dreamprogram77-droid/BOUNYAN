
import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode, tab?: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  fontSize: 'small' | 'default' | 'large';
  onChangeFontSize: (size: 'small' | 'default' | 'large') => void;
  activeDashboardTab?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentMode, 
  setMode, 
  isLoggedIn, 
  onLogout, 
  theme, 
  onToggleTheme,
  fontSize,
  onChangeFontSize,
  activeDashboardTab
}) => {
  const publicLinks = [
    { id: AppMode.HOME, label: 'الرئيسية' },
    { id: AppMode.PRICING, label: 'الأسعار' },
  ];

  // روابط الوصول السريع للوحة التحكم
  const dashboardShortcuts = [
    { id: 'compliance', label: 'فحص الامتثال', mode: AppMode.CLIENT_DASHBOARD },
    { id: 'search', label: 'البحث التنظيمي', mode: AppMode.CLIENT_DASHBOARD },
    { id: 'editor', label: 'محرر المخططات', mode: AppMode.CLIENT_DASHBOARD },
    { id: 'voice', label: 'المساعد الصوتي', mode: AppMode.CLIENT_DASHBOARD },
    { id: 'profile', label: 'الملف الشخصي', mode: AppMode.CLIENT_DASHBOARD },
  ];

  const toolsLinks = [
    { id: AppMode.COMPLIANCE, label: 'فحص الامتثال', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: AppMode.SITE_EXPLORER, label: 'مستكشف الموقع', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { id: AppMode.SEARCH, label: 'البحث التنظيمي', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: AppMode.IMAGE_EDITOR, label: 'محرر المخططات', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: AppMode.VOICE_ASSISTANT, label: 'المساعد الصوتي', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  ];

  const isActive = (id: AppMode) => currentMode === id;
  const isTabActive = (tab: string) => currentMode === AppMode.CLIENT_DASHBOARD && activeDashboardTab === tab;

  const fontSizes: Array<{id: 'small' | 'default' | 'large', label: string}> = [
    { id: 'small', label: 'A' },
    { id: 'default', label: 'A' },
    { id: 'large', label: 'A' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setMode(AppMode.HOME)} 
              className="flex items-center gap-3.5 group relative"
            >
              <div className="relative">
                <div className="bg-slate-900 dark:bg-indigo-600 p-2 text-white rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-start leading-none hidden sm:flex">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Bunyan</span>
                <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 tracking-[0.3em] uppercase mt-0.5">Saudi Engineering</span>
              </div>
            </button>

            <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              {publicLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setMode(link.id)}
                  className={`px-5 py-2 text-[11px] font-black transition-all rounded-xl uppercase tracking-widest ${
                    isActive(link.id) 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {isLoggedIn && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                  {dashboardShortcuts.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setMode(link.mode, link.id)}
                      className={`px-4 py-2 text-[10px] font-black transition-all rounded-xl uppercase tracking-widest whitespace-nowrap ${
                        isTabActive(link.id)
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                  <button
                    onClick={() => setMode(AppMode.CLIENT_DASHBOARD, 'projects')}
                    className={`px-5 py-2 text-[11px] font-black transition-all rounded-xl uppercase tracking-widest ${
                      isActive(AppMode.CLIENT_DASHBOARD) && activeDashboardTab === 'projects'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    لوحة التحكم
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden 2xl:flex items-center gap-1">
            {toolsLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setMode(link.id)}
                className={`flex items-center gap-2.5 px-4 py-2 text-[11px] font-black transition-all relative group overflow-hidden ${
                  isActive(link.id)
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <svg className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive(link.id) ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={link.icon} />
                </svg>
                <span className="relative z-10">{link.label}</span>
                {isActive(link.id) && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5">
              {fontSizes.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => onChangeFontSize(fs.id)}
                  className={`flex items-center justify-center rounded-lg transition-all ${
                    fs.id === 'small' ? 'w-6 h-6 text-[9px]' :
                    fs.id === 'default' ? 'w-7 h-7 text-[11px]' :
                    'w-8 h-8 text-[13px]'
                  } ${
                    fontSize === fs.id 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-black' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>

            <button
              onClick={onToggleTheme}
              className="relative p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 group"
            >
              <div className="relative z-10">
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                )}
              </div>
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

            {!isLoggedIn ? (
              <button 
                onClick={() => setMode(AppMode.LOGIN)}
                className="relative group overflow-hidden bg-slate-900 dark:bg-indigo-600 text-white px-7 py-2.5 rounded-xl text-[11px] font-black hover:shadow-2xl hover:shadow-indigo-500/20 transition-all active:scale-95"
              >
                <span className="relative z-10">دخول / تسجيل</span>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setMode(AppMode.CLIENT_DASHBOARD, 'profile')}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm"
                >
                  أ
                </button>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                  title="تسجيل الخروج"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
