
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
import SiteExplorerView from './components/SiteExplorerView';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('bunyan_app_mode');
    return (savedMode as AppMode) || AppMode.HOME;
  });

  // حالة التبويب النشط داخل لوحة التحكم لتمكين الوصول السريع من Navbar
  const [activeDashboardTab, setActiveDashboardTab] = useState<string>('projects');

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
    localStorage.setItem('bunyan_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // تطبيق نظام الخطوط المتناسق باستخدام متغيرات CSS
  useEffect(() => {
    localStorage.setItem('bunyan_font_size', fontSize);
    const sizeMap = {
      small: '14px',
      default: '16px',
      large: '18px'
    };
    
    // تحديث المتغير الأساسي في ملف CSS
    document.documentElement.style.setProperty('--app-base-size', sizeMap[fontSize]);
    
    // التأكد من أن جميع العناصر ترث الحجم الجديد بشكل طبيعي
    // عبر تحديث حجم الخط في document.body كنسخة احتياطية
    document.body.style.fontSize = sizeMap[fontSize];
  }, [fontSize]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setMode(AppMode.CLIENT_DASHBOARD); 
    localStorage.setItem('bunyan_is_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMode(AppMode.HOME);
    localStorage.removeItem('bunyan_is_logged_in');
  };

  const protectedNavigate = (targetMode: AppMode, tab?: string) => {
    if (!isLoggedIn && !isDevMode) {
      setMode(AppMode.LOGIN);
    } else {
      setMode(targetMode);
      if (tab) {
        setActiveDashboardTab(tab);
      }
    }
  };

  const renderContent = () => {
    const protectedModes = [AppMode.COMPLIANCE, AppMode.VOICE_ASSISTANT, AppMode.SEARCH, AppMode.IMAGE_EDITOR, AppMode.CLIENT_DASHBOARD, AppMode.SITE_EXPLORER];
    if (protectedModes.includes(mode) && !isLoggedIn && !isDevMode) {
      return <LoginView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
    }

    switch (mode) {
      case AppMode.HOME: return <HomeView onStart={(m) => protectedNavigate(m)} />;
      case AppMode.PRICING: return <PricingView onSubscribe={(m) => setMode(m)} />;
      case AppMode.LOGIN: return <LoginView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
      case AppMode.REGISTER: return <RegisterView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
      case AppMode.COMPLIANCE: return <ComplianceView />;
      case AppMode.VOICE_ASSISTANT: return <VoiceAssistant />;
      case AppMode.SEARCH: return <SearchView />;
      case AppMode.IMAGE_EDITOR: return <ImageEditor />;
      case AppMode.CLIENT_DASHBOARD: return (
        <ClientDashboard 
          activeTab={activeDashboardTab as any} 
          onTabChange={setActiveDashboardTab} 
        />
      );
      case AppMode.SITE_EXPLORER: return <SiteExplorerView />;
      default: return <HomeView onStart={(m) => protectedNavigate(m)} />;
    }
  };

  const isDashboard = mode === AppMode.CLIENT_DASHBOARD;

  return (
    <div className={`min-h-screen flex flex-col font-['Amiri'] transition-all duration-300 ${isDashboard ? 'bg-white dark:bg-slate-950' : 'dark:bg-slate-950 dark:text-slate-100'}`} dir="rtl">
      <Navbar 
        currentMode={mode} 
        setMode={protectedNavigate} 
        isLoggedIn={isLoggedIn || isDevMode}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        activeDashboardTab={activeDashboardTab}
      />
      
      <main className={`flex-grow container mx-auto px-6 lg:px-8 max-w-7xl pt-8`}>
        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>

      <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 pointer-events-none">
        <button 
          onClick={() => setIsDevMode(!isDevMode)}
          className={`pointer-events-auto p-3 rounded-full shadow-2xl transition-all duration-300 ${isDevMode ? 'bg-rose-600 text-white rotate-180' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
      </div>

      {!isDashboard && (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 mt-20 transition-colors">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">© {new Date().getFullYear()} Bunyan Engineering Compliance. KSA.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
