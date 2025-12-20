
import React from 'react';
import { AppMode } from '../types';

interface HomeViewProps {
  onStart: (mode: AppMode) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const features = [
    { title: 'تدقيق فوري', desc: 'فحص المخططات الإنشائية والمعمارية في ثوانٍ متوافقة مع SBC.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'indigo' },
    { title: 'امتثال تنظيمي', desc: 'تغطية شاملة لكافة بنود كود البناء السعودي وتحديثاته.', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571', color: 'emerald' },
    { title: 'ذكاء هندسي', desc: 'نماذج رؤية حاسوبية قادرة على تفسير الرموز المعقدة.', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7', color: 'blue' },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section - Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
        <div className="lg:col-span-7 py-20 lg:py-32 pr-4 border-l border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-[0.3em] mb-8">
            Established 2024 / Vision 2030
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 leading-none tracking-tight">
            أتمتة الامتثال <br/> الهنـدسي الذكي
          </h1>
          <p className="text-slate-500 max-w-lg mb-12 text-base font-medium leading-relaxed">
            المنصة السعودية المتقدمة لتدقيق المخططات الهندسية والتحقق من الامتثال للأكواد المحلية بدقة متناهية وسرعة فائقة.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onStart(AppMode.COMPLIANCE)}
              className="bg-indigo-600 text-white px-8 py-4 font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              ابدأ الفحص الفني
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <button 
              onClick={() => onStart(AppMode.SEARCH)}
              className="bg-white text-slate-900 border border-slate-200 px-8 py-4 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              استعراض الأنظمة
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-5 bg-slate-50 p-12 flex items-center justify-center relative overflow-hidden">
          <div className="relative w-full aspect-square border-2 border-slate-200 p-4 bg-white shadow-sm flex flex-col justify-between">
            <div className="flex justify-between border-b border-slate-100 pb-4">
              <div className="w-24 h-4 bg-slate-900"></div>
              <div className="w-8 h-4 bg-indigo-600"></div>
            </div>
            <div className="grid grid-cols-3 gap-2 flex-grow py-4">
              <div className="col-span-2 bg-slate-50 border border-slate-100 p-2">
                <div className="w-full h-1 bg-slate-200 mb-2"></div>
                <div className="w-full h-1 bg-slate-200 mb-2"></div>
                <div className="w-1/2 h-1 bg-indigo-600"></div>
              </div>
              <div className="bg-slate-900"></div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">
              BUNYAN_CORE_SYS_01
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Minimalist */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'دقة التحليل', val: '99.4%' },
          { label: 'وقت المعالجة', val: '12s' },
          { label: 'قاعدة البيانات', val: '1400+' },
          { label: 'المكاتب المشتركة', val: '240' },
        ].map((s, i) => (
          <div key={i} className="border-r-2 border-slate-100 pr-6">
            <div className="text-2xl font-bold text-slate-900">{s.val}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features Grid - Technical List */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
        {features.map((f, i) => (
          <div key={i} className="bg-white p-10 hover:bg-slate-50 transition-colors">
            <div className={`w-10 h-10 mb-6 flex items-center justify-center ${f.color === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} /></svg>
            </div>
            <h3 className="text-lg font-bold mb-3 text-slate-900">{f.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Call to Action - Compact */}
      <section className="bg-slate-900 p-12 lg:p-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">نقلة نوعية في تدقيق المخططات</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-10 text-sm font-medium">
          انضم إلى المكاتب الاستشارية التي اعتمدت بُنيان لرفع جودة مخرجاتها الهندسية وضمان الامتثال التام للأكواد السعودية.
        </p>
        <button 
          onClick={() => onStart(AppMode.REGISTER)}
          className="bg-indigo-600 text-white px-10 py-4 font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95"
        >
          سجل مكتبك الآن
        </button>
      </section>
    </div>
  );
};

export default HomeView;