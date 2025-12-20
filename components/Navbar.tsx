
import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, setMode, isLoggedIn, onLogout }) => {
  const publicLinks = [
    { id: AppMode.HOME, label: 'الرئيسية' },
    { id: AppMode.PRICING, label: 'الأسعار' },
  ];

  const toolsLinks = [
    { id: AppMode.COMPLIANCE, label: 'فحص الامتثال', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: AppMode.SEARCH, label: 'البحث التنظيمي', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: AppMode.IMAGE_EDITOR, label: 'محرر المخططات', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: AppMode.VOICE_ASSISTANT, label: 'المساعد الصوتي', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setMode(AppMode.HOME)} 
              className="flex items-center gap-3 group"
            >
              <div className="bg-slate-900 p-1.5 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tighter text-slate-900 uppercase">Bunyan</span>
            </button>

            <div className="hidden xl:flex items-center gap-4">
              {publicLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setMode(link.id)}
                  className={`text-[11px] font-bold transition-all uppercase tracking-widest ${
                    currentMode === link.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            {toolsLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setMode(link.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold transition-all border ${
                  currentMode === link.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <button 
                onClick={() => setMode(AppMode.LOGIN)}
                className="bg-slate-900 text-white px-5 py-2 text-[11px] font-bold hover:bg-indigo-600 transition-all"
              >
                دخول / تسجيل
              </button>
            ) : (
              <button 
                onClick={onLogout}
                className="text-rose-500 text-[11px] font-bold hover:underline"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
