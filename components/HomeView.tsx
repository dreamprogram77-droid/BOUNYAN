
import React from 'react';
import { AppMode } from '../types';

interface HomeViewProps {
  onStart: (mode: AppMode) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const features = [
    { 
      title: 'تدقيق فوري وذكي', 
      desc: 'فحص المخططات الإنشائية والمعمارية في ثوانٍ متوافقة مع اشتراطات كود البناء السعودي SBC.', 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 
      color: 'indigo' 
    },
    { 
      title: 'امتثال تنظيمي شامل', 
      desc: 'تغطية كاملة لكافة بنود كود البناء السعودي وتحديثاته الوزارية المستمرة.', 
      icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571', 
      color: 'emerald' 
    },
    { 
      title: 'ذكاء هندسي متقدم', 
      desc: 'نماذج رؤية حاسوبية مدربة هندسياً قادرة على تفسير المخططات والرموز المعقدة.', 
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7', 
      color: 'blue' 
    },
  ];

  return (
    <div className="space-y-32 pb-24">
      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Content */}
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">رؤية المملكة 2030 / التحول الرقمي</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              أتمتة الامتثال <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-blue-500">الهنـدسي الذكي</span>
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 max-w-xl text-lg md:text-xl font-medium leading-relaxed">
              المنصة السعودية الرائدة لتدقيق المخططات الهندسية والتحقق من الامتثال للأكواد المحلية بدقة متناهية وسرعة معالجة غير مسبوقة.
            </p>
            
            <div className="flex flex-wrap gap-5 pt-4">
              <button 
                onClick={() => onStart(AppMode.COMPLIANCE)}
                className="group bg-slate-900 dark:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-base hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-200 dark:shadow-none active:scale-95"
              >
                ابدأ الفحص الفني
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button 
                onClick={() => onStart(AppMode.SEARCH)}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-10 py-5 rounded-2xl font-black text-base hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              >
                استعراض الأنظمة
              </button>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
               <div className="flex -space-x-3 space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                       {String.fromCharCode(64 + i)}
                    </div>
                  ))}
               </div>
               <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  <span className="text-slate-900 dark:text-white font-black">+240 مكتب هندسي</span> يعتمدون على بنيان يومياً
               </div>
            </div>
          </div>
          
          {/* Right Side: Visual Illustration */}
          <div className="lg:col-span-5 relative animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
            <div className="relative z-10 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] dark:shadow-none overflow-hidden group">
               {/* Blueprint Background Pattern */}
               <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none"></div>
               
               <div className="relative aspect-square flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-2">
                        <div className="w-12 h-2 bg-indigo-600 rounded-full"></div>
                        <div className="w-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                     </div>
                     <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                        SBC Compliant
                     </div>
                  </div>

                  {/* Abstract Engineering Elements */}
                  <div className="relative flex-grow flex items-center justify-center py-10">
                     <div className="w-full h-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl rotate-12 transition-transform group-hover:rotate-0 duration-700"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-2 border-indigo-500/20 rounded-2xl -rotate-6 transition-transform group-hover:rotate-0 duration-700"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col p-6 shadow-2xl">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                              </div>
                              <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                           </div>
                           <div className="space-y-3">
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                              <div className="h-1.5 w-4/5 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                              <div className="h-1.5 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full"></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-end">
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Scan</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">PROJECT_REF_0248</div>
                     </div>
                     <div className="flex gap-1">
                        {[1,2,3].map(i => <div key={i} className={`w-1 h-4 rounded-full ${i === 3 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>)}
                     </div>
                  </div>
               </div>
            </div>
            
            {/* Background Decorations */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Stats - Modern & Clean */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-20">
        {[
          { label: 'دقة التحليل الهيكلي', val: '99.4%' },
          { label: 'سرعة المعالجة الفورية', val: '12s' },
          { label: 'بند في قاعدة البيانات', val: '1400+' },
          { label: 'مكتب هندسي مشترك', val: '240' },
        ].map((s, i) => (
          <div key={i} className="group flex flex-col items-start gap-2">
            <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-indigo-600 transition-colors">
              {s.val}
            </div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{s.label}</div>
            <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 group-hover:w-16 group-hover:bg-indigo-500 transition-all duration-500"></div>
          </div>
        ))}
      </section>

      {/* Modern Features Grid */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">أدوات هندسية ذكية</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">نجمع بين الخبرة الهندسية العريقة وأحدث تقنيات الذكاء الاصطناعي.</p>
           </div>
           <div className="h-px flex-grow bg-slate-100 dark:bg-slate-800 mx-8 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-br-[100px] -ml-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className={`relative z-10 w-14 h-14 mb-8 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${f.color === 'indigo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-slate-200 dark:shadow-none'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={f.icon} />
                </svg>
              </div>
              
              <h3 className="relative z-10 text-xl font-black mb-4 text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                {f.title}
              </h3>
              
              <p className="relative z-10 text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed">
                {f.desc}
              </p>
              
              <div className="relative z-10 mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                اكتشف المزيد
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action - Modern & Impactful */}
      <section className="relative bg-slate-900 dark:bg-indigo-900/20 p-12 lg:p-24 rounded-[4rem] text-center overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full -ml-48 -mb-48 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight max-w-3xl mx-auto">
            ارتقِ بجودة مخرجات مكتبك الهندسي مع بنيان
          </h2>
          <p className="text-slate-400 dark:text-slate-300 max-w-xl mx-auto text-lg font-medium leading-relaxed">
            انضم إلى المئات من المكاتب الاستشارية التي اعتمدت بُنيان كشريك تقني لضمان الامتثال التام وسرعة الإنجاز.
          </p>
          <div className="flex justify-center pt-4">
            <button 
              onClick={() => onStart(AppMode.REGISTER)}
              className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-950/50 active:scale-95 flex items-center gap-3"
            >
              سجل مكتبك الآن
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
