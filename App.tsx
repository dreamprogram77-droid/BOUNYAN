
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

  useEffect(() => {
    localStorage.setItem('bunyan_app_mode', mode);
  }, [mode]);

  const renderContent = () => {
    switch (mode) {
      case AppMode.HOME:
        return <HomeView onStart={setMode} />;
      case AppMode.PRICING:
        return <PricingView />;
      case AppMode.LOGIN:
        return <LoginView onSwitch={setMode} />;
      case AppMode.REGISTER:
        return <RegisterView onSwitch={setMode} />;
      case AppMode.COMPLIANCE:
        return <ComplianceView />;
      case AppMode.VOICE_ASSISTANT:
        return <VoiceAssistant />;
      case AppMode.SEARCH:
        return <SearchView />;
      case AppMode.IMAGE_EDITOR:
        return <ImageEditor />;
      default:
        return <HomeView onStart={setMode} />;
    }
  };

  const isPublicMode = [AppMode.HOME, AppMode.PRICING, AppMode.LOGIN, AppMode.REGISTER].includes(mode);

  return (
    <div className="min-h-screen flex flex-col font-['Tajawal'] selection:bg-indigo-100 selection:text-indigo-700" dir="rtl">
      <Navbar currentMode={mode} setMode={setMode} />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {isPublicMode ? null : (
          <header className="py-12 md:py-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-widest uppercase animate-bounce">
              الأداة الذكية: {
                mode === AppMode.COMPLIANCE ? 'فحص الامتثال' :
                mode === AppMode.SEARCH ? 'البحث التنظيمي' :
                mode === AppMode.IMAGE_EDITOR ? 'محرر المخططات' : 'المساعد الصوتي'
              }
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              تعزيز <span className="relative inline-block">
                <span className="relative z-10 text-indigo-600">الكفاءة</span>
                <span className="absolute bottom-2 left-0 w-full h-4 bg-indigo-100 -z-10 rounded-sm"></span>
              </span> الهندسية في دقائق
            </h1>
          </header>
        )}

        {/* Hero for Home Page only */}
        {mode === AppMode.HOME && (
          <header className="py-20 md:py-32 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid-large" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-large)" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight">
              أتمتة الامتثال مع <br/> <span className="text-indigo-600">منصة بُنيان</span>
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-xl font-medium mb-12">
              المنصة السعودية الأولى لتدقيق المخططات الهندسية والتحقق من الامتثال للأكواد المحلية بدقة متناهية وسرعة فائقة.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
               <button onClick={() => setMode(AppMode.REGISTER)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all">ابدأ الآن مجاناً</button>
               <button onClick={() => setMode(AppMode.PRICING)} className="bg-white text-slate-700 border border-slate-200 px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">مشاهدة الباقات</button>
            </div>
          </header>
        )}

        <div className={isPublicMode ? "" : "pb-20"}>
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs text-white font-bold">ب</div>
                <span className="font-black text-slate-900 text-2xl">بنيان</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-md">نحن في بنيان نسعى لإعادة تعريف العمل الهندسي في المملكة عبر دمج الذكاء الاصطناعي في صلب عمليات التدقيق والامتثال، لخدمة رؤية السعودية 2030.</p>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-slate-500 font-bold">
                <li><button onClick={() => setMode(AppMode.HOME)} className="hover:text-indigo-600 transition-colors">الرئيسية</button></li>
                <li><button onClick={() => setMode(AppMode.PRICING)} className="hover:text-indigo-600 transition-colors">الباقات والأسعار</button></li>
                <li><button onClick={() => setMode(AppMode.SEARCH)} className="hover:text-indigo-600 transition-colors">كود البناء السعودي</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-6">الدعم</h4>
              <ul className="space-y-4 text-slate-500 font-bold">
                <li><button className="hover:text-indigo-600 transition-colors">مركز المساعدة</button></li>
                <li><button className="hover:text-indigo-600 transition-colors">الأسئلة الشائعة</button></li>
                <li><button className="hover:text-indigo-600 transition-colors">تواصل معنا</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm font-bold">© 2024 جميع الحقوق محفوظة - بُنيان للحلول التقنية الهندسية</p>
            <div className="flex gap-4">
               {/* Social Icons Placeholder */}
               <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
               </div>
               <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.016 18l-2.247-3.231H9.23L6.984 18H4.656l4.632-6.611L4.8 5h2.328l2.105 3.023h5.534L16.872 5h2.328l-4.512 6.444L19.344 18h-2.328zM10.056 9.21l3.888 5.58h1.224l-3.888-5.58h-1.224z"/></svg>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
