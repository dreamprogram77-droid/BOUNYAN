
import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, setMode }) => {
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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center py-3">
          <div className="flex items-center gap-8">
            <button onClick={() => setMode(AppMode.HOME)} className="flex items-center gap-4 group">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2.5 rounded-xl shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-black bg-gradient-to-l from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent tracking-tight">
                  بُنـــــيان
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Smart Engineering</span>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-1 border-r border-slate-100 pr-8 mr-2">
              {publicLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setMode(link.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    currentMode === link.id ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex space-x-reverse space-x-2">
            {toolsLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setMode(link.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  currentMode === link.id
                    ? 'text-indigo-600 bg-indigo-50 shadow-sm shadow-indigo-100/50'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                </svg>
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMode(AppMode.LOGIN)}
              className="text-slate-600 font-bold text-sm px-4 hover:text-indigo-600"
            >
              تسجيل الدخول
            </button>
            <button 
              onClick={() => setMode(AppMode.REGISTER)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
