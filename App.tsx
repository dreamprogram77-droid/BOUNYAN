
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
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('bunyan_app_mode');
    return (savedMode as AppMode) || AppMode.HOME;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bunyan_is_logged_in') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('bunyan_app_mode', mode);
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('bunyan_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setMode(AppMode.HOME);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMode(AppMode.HOME);
    localStorage.removeItem('bunyan_is_logged_in');
  };

  const protectedNavigate = (targetMode: AppMode) => {
    if (!isLoggedIn) {
      setMode(AppMode.LOGIN);
    } else {
      setMode(targetMode);
    }
  };

  const renderContent = () => {
    const protectedModes = [AppMode.COMPLIANCE, AppMode.VOICE_ASSISTANT, AppMode.SEARCH, AppMode.IMAGE_EDITOR];
    if (protectedModes.includes(mode) && !isLoggedIn) {
      return <LoginView onSwitch={(m) => m === AppMode.HOME ? handleLoginSuccess() : setMode(m)} />;
    }

    switch (mode) {
      case AppMode.HOME:
        return <HomeView onStart={(m) => protectedNavigate(m)} />;
      case AppMode.PRICING:
        return <PricingView />;
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
      default:
        return <HomeView onStart={(m) => protectedNavigate(m)} />;
    }
  };

  const isPublicView = [AppMode.HOME, AppMode.PRICING, AppMode.LOGIN, AppMode.REGISTER].includes(mode);

  return (
    <div className="min-h-screen flex flex-col font-['Amiri']" dir="rtl">
      <Navbar 
        currentMode={mode} 
        setMode={(m) => {
          const protectedModes = [AppMode.COMPLIANCE, AppMode.VOICE_ASSISTANT, AppMode.SEARCH, AppMode.IMAGE_EDITOR];
          if (protectedModes.includes(m)) {
            protectedNavigate(m);
          } else {
            setMode(m);
          }
        }} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      
      <main className="flex-grow container mx-auto px-6 lg:px-8 max-w-7xl">
        {!isPublicView && isLoggedIn && (
          <header className="py-12 md:py-16 text-right border-b border-slate-200 mb-12">
            <div className="inline-block px-3 py-1 mb-4 bg-slate-900 text-white text-[9px] font-bold tracking-[0.2em] uppercase">
              Tool System / {mode}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              تعزيز الكفاءة <span className="text-indigo-600">الهندسية الرقمية</span>
            </h1>
          </header>
        )}

        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-16 mt-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-2 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">Bunyan</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">© {new Date().getFullYear()} Bunyan Engineering Compliance. KSA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;