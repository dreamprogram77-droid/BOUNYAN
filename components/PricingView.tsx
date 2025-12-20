
import React from 'react';

const PricingView: React.FC = () => {
  const plans = [
    { name: 'الباقة الأساسية', price: 'مجاني', desc: 'للمكاتب الناشئة والمصممين المستقلين', features: ['5 مخططات شهرياً', 'تدقيق كود البناء الأساسي', 'دعم عبر البريد', 'تقارير PDF بسيطة'], btn: 'ابدأ مجاناً', highlight: false },
    { name: 'الباقة الاحترافية', price: '499', desc: 'للمكاتب الهندسية متوسطة الحجم', features: ['مخططات غير محدودة', 'تحليل ذكاء اصطناعي متقدم', 'مساعد صوتي هندسي', 'بحث تنظيمي كامل', 'تقارير احترافية موثقة'], btn: 'اشترك الآن', highlight: true },
    { name: 'باقة الشركات', price: 'تواصل معنا', desc: 'للشركات الكبرى والمشاريع الضخمة', features: ['تكامل API مخصص', 'دعم فني على مدار الساعة', 'تدريب مباشر للفريق', 'أمان بيانات متقدم', 'تخصيص كامل للمعايير'], btn: 'اطلب عرض سعر', highlight: false },
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-900 mb-4">استثمر في كفاءة مكتبك</h2>
        <p className="text-slate-500 text-lg">باقات مرنة صُممت لتناسب احتياجات السوق الهندسي السعودي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p, i) => (
          <div key={i} className={`relative flex flex-col p-8 rounded-[2.5rem] border ${p.highlight ? 'border-indigo-500 bg-white shadow-2xl scale-105 z-10' : 'border-slate-200 bg-white/50'}`}>
            {p.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">الأكثر شيوعاً</div>}
            <h3 className="text-xl font-black text-slate-800 mb-2">{p.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-black text-slate-900">{p.price}</span>
              {p.price !== 'مجاني' && p.price !== 'تواصل معنا' && <span className="text-slate-400 text-sm font-bold mr-1">ر.س / شهرياً</span>}
            </div>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{p.desc}</p>
            <ul className="space-y-4 mb-10 flex-1">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <svg className={`w-5 h-5 ${p.highlight ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-2xl font-black transition-all ${p.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
              {p.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingView;
