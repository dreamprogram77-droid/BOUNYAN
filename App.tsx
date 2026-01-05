
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PricingView from './components/PricingView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ComplianceView from './components/ComplianceView';
import VoiceAssistant from './components/VoiceAssistant';
import SearchView from './components/SearchView';
import ImageEditor from './components/ImageEditor';
import ClientDashboard from './components/ClientDashboard';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('bunyan_app_mode');
    return (savedMode as AppMode) || AppMode.HOME;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bunyan_is_logged_in') === 'true';
  });

  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('bunyan_dev_mode') === 'true';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('bunyan_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [fontSize, setFontSize] = useState<'small' | 'default' | 'large'>(() => {
    const savedSize = localStorage.getItem('bunyan_font_size');
    if (savedSize === 'small' || savedSize === 'default' || savedSize === 'large') return savedSize;
    return 'default';
  });

  useEffect(() => {
    localStorage.setItem('bunyan_app_mode', mode);
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('bunyan_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('bunyan_dev_mode', String(isDevMode));
  }, [isDevMode]);

  useEffect(() => {
    localStorage.setItem('bunyan_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bunyan_font_size', fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setMode(AppMode.CLIENT_DASHBOARD); 
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMode(AppMode.HOME);
    localStorage.removeItem('bunyan_is_logged_in');
  };

  const protectedNavigate = (targetMode: AppMode) => {
    if (!isLoggedIn && !isDevMode) {
      setMode(AppMode.LOGIN);
    } else {
      setMode(targetMode);
    }
  };

  const renderContent = () => {
    const protectedModes = [AppMode.COMPLIANCE, AppMode.VOICE_ASSISTANT, AppMode.SEARCH, AppMode.IMAGE_EDITOR, AppMode.CLIENT_DASHBOARD];
    if (protectedModes.includes(mode) && !isLoggedIn && !isDevMode) {
      return <LoginView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
    }

    switch (mode) {
      case AppMode.HOME:
        return <HomeView onStart={(m) => protectedNavigate(m)} />;
      case AppMode.PRICING:
        return <PricingView onSubscribe={(m) => setMode(m)} />;
      case AppMode.LOGIN:
        return <LoginView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
      case AppMode.REGISTER:
        return <RegisterView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
      case AppMode.COMPLIANCE:
        return <ComplianceView />;
      case AppMode.VOICE_ASSISTANT:
        return <VoiceAssistant />;
      case AppMode.SEARCH:
        return <SearchView />;
      case AppMode.IMAGE_EDITOR:
        return <ImageEditor />;
      case AppMode.CLIENT_DASHBOARD:
        return <ClientDashboard />;
      default:
        return <HomeView onStart={(m) => protectedNavigate(m)} />;
    }
  };

  const isPublicView = [AppMode.HOME, AppMode.PRICING, AppMode.LOGIN, AppMode.REGISTER].includes(mode);
  const isDashboard = mode === AppMode.CLIENT_DASHBOARD;

  return (
    <div 
      className={`min-h-screen flex flex-col font-['Amiri'] transition-all duration-300 ${isDashboard ? 'bg-white dark:bg-slate-950' : 'dark:bg-slate-950 dark:text-slate-100'} app-font-${fontSize}`} 
      dir="rtl"
    >
      <Navbar 
        currentMode={mode} 
        setMode={(m) => {
          const protectedModes = [AppMode.COMPLIANCE, AppMode.VOICE_ASSISTANT, AppMode.SEARCH, AppMode.IMAGE_EDITOR, AppMode.CLIENT_DASHBOARD];
          if (protectedModes.includes(m)) {
            protectedNavigate(m);
          } else {
            setMode(m);
          }
        }} 
        isLoggedIn={isLoggedIn || isDevMode}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
      />
      
      <main className={`flex-grow container mx-auto px-6 lg:px-8 max-w-7xl ${isDashboard ? 'py-8' : ''}`}>
        {!isPublicView && (isLoggedIn || isDevMode) && !isDashboard && (
          <header className="py-12 md:py-16 text-right border-b border-slate-200 dark:border-slate-800 mb-12 relative">
            <div className="inline-block px-3 py-1 mb-4 bg-slate-900 dark:bg-indigo-600 text-white text-[9px] font-bold tracking-[0.2em] uppercase">
              Management / {mode}
            </div>
            {isDevMode && (
              <span className="absolute left-0 top-12 bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">DEV MODE ACTIVE</span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              تعزيز الكفاءة الهندسية الرقمية
            </h1>
          </header>
        )}

        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>

      {/* Developer Mode UI */}
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 pointer-events-none">
        <button 
          onClick={() => setIsDevMode(!isDevMode)}
          className={`pointer-events-auto p-3 rounded-full shadow-2xl transition-all duration-300 ${isDevMode ? 'bg-rose-600 text-white rotate-180' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          title="تبديل وضع المطور"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        {isDevMode && (
          <div className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 animate-in slide-in-from-left-4 fade-in">
            <div className="px-3 py-1 mb-1 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dev Shortcut</div>
            {Object.values(AppMode).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-right text-[10px] font-bold rounded-lg transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {m.replace('-', ' ').toUpperCase()}
              </button>
            ))}
            <div className="mt-2 flex gap-1 px-1">
              <button onClick={() => setIsLoggedIn(true)} className="flex-1 px-2 py-1 bg-emerald-500 text-white text-[8px] font-bold rounded">LOGIN</button>
              <button onClick={() => setIsLoggedIn(false)} className="flex-1 px-2 py-1 bg-rose-500 text-white text-[8px] font-bold rounded">LOGOUT</button>
            </div>
          </div>
        )}
      </div>

      {!isDashboard && (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 mt-20 print:hidden transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 dark:bg-indigo-600 p-2 text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase transition-colors">Bunyan</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">© {new Date().getFullYear()} Bunyan Engineering Compliance. KSA.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
