import React, { useState } from 'react';
import { searchSaudiRegulations } from '../services/geminiService';

const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await searchSaudiRegulations(query);
      setResult(res);
    } catch (err) {
      alert('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">البحث التنظيمي المتطور</h2>
        <p className="text-slate-500 text-lg font-medium">الوصول الفوري لأحدث نصوص الأكواد الهندسية واللوائح الوزارية</p>
      </div>

      <div className="relative mb-20 max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="group relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: متطلبات العزل الحراري في الكود السعودي 2024..."
            className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-white border border-slate-200 shadow-2xl shadow-indigo-100/20 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-xl font-medium placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute left-4 top-4 bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? (
              <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 opacity-20"></div>
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
               <span className="w-8 h-px bg-indigo-500"></span>
               AI Generated Insight
            </h3>
            <div className="prose prose-slate max-w-none text-slate-700 text-lg leading-loose font-medium">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl">
              <h3 className="font-black text-white text-xl mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                </div>
                المصادر المرجعية الموثقة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.sources.map((source: any, i: number) => (
                  <a 
                    key={i}
                    href={source.web?.uri || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">{i+1}</div>
                      <span className="text-slate-300 font-bold group-hover:text-white transition-colors">{source.web?.title || 'وثيقة رسمية'}</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-[-4px] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;