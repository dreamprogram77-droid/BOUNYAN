
import React, { useState, useEffect } from 'react';
import { getSiteRegulations } from '../services/geminiService';

const SiteExplorerView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [result, setResult] = useState<{ text: string; sources: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("متصفحك لا يدعم تحديد الموقع الجغرافي.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const res = await getSiteRegulations(latitude, longitude);
          setResult(res);
        } catch (err) {
          setError("فشل جلب البيانات الجغرافية. حاول مرة أخرى.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("تعذر الوصول إلى موقعك. يرجى تفعيل الصلاحيات.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">مستكشف أنظمة الموقع</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">
          حدد موقع أرض المشروع للحصول على ملخص ذكي للاشتراطات البلدية، الارتدادات، ونسب البناء المسموحة بناءً على الموقع الجغرافي الدقيق.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Interactive Map Mock & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 relative group overflow-hidden">
               {location ? (
                 <div className="absolute inset-0 bg-indigo-500/10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-indigo-500/30">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm">تم تحديد الإحداثيات بنجاح</p>
                    <p className="text-slate-400 text-[10px] font-mono mt-1">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                 </div>
               ) : (
                 <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    <p className="text-sm font-bold uppercase tracking-widest">Map Preview Area</p>
                 </div>
               )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-3">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {error}
              </div>
            )}

            <button 
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  تحديد الموقع الحالي والتحليل
                </>
              )}
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Location Intelligence</h4>
             <p className="text-xs text-slate-500 leading-relaxed font-bold">
               يقوم النظام بربط الإحداثيات الجغرافية مع بيانات كود البناء والاشتراطات الفنية للأمانات (الرياض، جدة، الشرقية، وغيرها) لتقديم إرشادات دقيقة حول الارتدادات المسموحة ونسب البناء.
             </p>
          </div>
        </div>

        {/* Right Column: AI Results */}
        <div className="lg:col-span-7">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">بانتظار تحديد الموقع</h3>
               <p className="text-sm text-slate-400 font-medium">سيظهر هنا ملخص الأنظمة والاشتراطات الهندسية الخاصة بالموقع المختار.</p>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-700">
               <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-indigo-50 dark:border-indigo-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 opacity-20"></div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">التقرير التنظيمي للذكاء الاصطناعي</h3>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-lg leading-loose font-medium whitespace-pre-wrap">
                    {result.text}
                  </div>
               </div>

               {result.sources.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {result.sources.map((source: any, i: number) => (
                     <a 
                       key={i}
                       href={source.maps?.uri || '#'} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                     >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-200 dark:shadow-none">{i+1}</div>
                          <div className="flex flex-col">
                             <span className="text-slate-900 dark:text-white font-black text-xs">مصدر جغرافي موثق</span>
                             <span className="text-slate-400 text-[10px] font-bold truncate max-w-[150px]">Google Maps Data</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-indigo-400 group-hover:translate-x-[-4px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                     </a>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteExplorerView;
