
import React from 'react';
import { AppMode } from '../types';

interface HomeViewProps {
  onStart: (mode: AppMode) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  return (
    <div className="space-y-24 pb-20">
      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'تدقيق فوري', desc: 'فحص المخططات الإنشائية والمعمارية في ثوانٍ معدودة.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-500' },
          { title: 'امتثال كامل', desc: 'تغطية شاملة لكود البناء السعودي (SBC) وتحديثاته الدورية.', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20c4.083 0 7.774-2.147 9.412-5.384M7.561 7.28c-1.18-.302-2.359-.534-3.528-.658m14.506.658c1.18-.302 2.359-.534 3.528-.658M7.561 7.28c.587 1.303.925 2.747.925 4.265 0 2.973-1.29 5.641-3.331 7.487m13.407-11.752c-.587 1.303-.925 2.747-.925 4.265 0 2.973 1.29 5.641 3.331 7.487m-13.407-11.752l.054.09A10.003 10.003 0 0112 3c4.083 0 7.774 2.147 9.412 5.384', color: 'bg-emerald-500' },
          { title: 'ذكاء اصطناعي', desc: 'نماذج رؤية حاسوبية مدربة على آلاف المخططات الهندسية.', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'bg-indigo-500' },
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
            <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} /></svg>
            </div>
            <h3 className="text-xl font-black mb-3 text-slate-800">{f.title}</h3>
            <p className="text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 L100 0" stroke="white" strokeWidth="0.1" fill="none" />
             <path d="M0 0 L100 100" stroke="white" strokeWidth="0.1" fill="none" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-8">شريكك الرقمي الموثوق</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'مخطط تم تحليله', value: '+50k' },
            { label: 'مكتب هندسي', value: '+1,200' },
            { label: 'دقة التحليل', value: '99.4%' },
            { label: 'توفير الوقت', value: '85%' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-indigo-400 mb-2">{s.value}</div>
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => onStart(AppMode.COMPLIANCE)}
          className="mt-12 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl"
        >
          ابدأ الفحص الآن
        </button>
      </section>
    </div>
  );
};

export default HomeView;
