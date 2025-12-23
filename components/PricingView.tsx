
import React from 'react';
import { AppMode } from '../types';

interface PricingViewProps {
  onSubscribe: (mode: AppMode) => void;
}

const PricingView: React.FC<PricingViewProps> = ({ onSubscribe }) => {
  const plans = [
    { name: 'الباقة الأساسية', price: 'مجاني', desc: 'للمكاتب الناشئة والمصممين المستقلين', features: ['5 مخططات شهرياً', 'تدقيق كود البناء الأساسي', 'دعم عبر البريد', 'تقارير PDF بسيطة'], btn: 'ابدأ مجاناً', highlight: false },
    { name: 'الباقة الاحترافية', price: '499', desc: 'للمكاتب الهندسية متوسطة الحجم', features: ['مخططات غير محدودة', 'تحليل ذكاء اصطناعي متقدم', 'مساعد صوتي هندسي', 'بحث تنظيمي كامل', 'تقارير احترافية موثقة'], btn: 'اشترك الآن', highlight: true },
    { name: 'باقة الشركات', price: 'تواصل معنا', desc: 'للشركات الكبرى والمشاريع الضخمة', features: ['تكامل API مخصص', 'دعم فني على مدار الساعة', 'تدريب مباشر للفريق', 'أمان بيانات متقدم', 'تخصيص كامل للمعايير'], btn: 'اطلب عرض سعر', highlight: false },
  ];

  return (
    <div className="py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">استثمر في كفاءة مكتبك</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">باقات مرنة صُممت لتناسب احتياجات السوق الهندسي السعودي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((p, i) => (
          <div key={i} className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl ${p.highlight ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-2xl scale-105 z-10' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'}`}>
            {p.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                الأكثر شيوعاً
              </div>
            )}
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{p.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{p.price}</span>
              {p.price !== 'مجاني' && p.price !== 'تواصل معنا' && (
                <span className="text-slate-400 text-sm font-bold mr-1">ر.س / شهرياً</span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium">{p.desc}</p>
            
            <ul className="space-y-4 mb-10 flex-1">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm font-bold">
                  <div className={`mt-0.5 p-0.5 rounded-full ${p.highlight ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => onSubscribe(AppMode.REGISTER)}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
                p.highlight 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none' 
                  : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {p.btn}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-20 p-10 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center">
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">هل لديك متطلبات خاصة لمكتبك الهندسي؟</p>
        <button className="text-indigo-600 dark:text-indigo-400 font-black hover:underline underline-offset-8">تواصل مع فريق المبيعات مباشرة</button>
      </div>
    </div>
  );
};

export default PricingView;
