
import React, { useState } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { AnalysisResult, ImageData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

const CollapsibleSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, icon, children }) => {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${
      isOpen ? 'shadow-lg ring-1 ring-indigo-100' : 'shadow-sm hover:shadow-md'
    }`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-right transition-colors duration-300 ${
          isOpen ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl transition-colors duration-300 ${isOpen ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'bg-slate-100 text-slate-500'}`}>
            {icon}
          </div>
          <h3 className={`font-bold text-lg transition-colors duration-300 ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
            {title}
          </h3>
        </div>
        <div className={`p-1.5 rounded-full transition-all duration-300 ${isOpen ? 'bg-indigo-200/50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-2 text-slate-600 leading-relaxed text-base border-t border-slate-50">
          {children}
        </div>
      </div>
    </section>
  );
};

const ComplianceView: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [openSections, setOpenSections] = useState({
    summary: true,
    details: true,
    recommendations: true,
    references: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    
    for (const file of fileList) {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      setUploadingFiles(prev => [...prev, { id: fileId, name: file.name, progress: 0 }]);

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress } : f)
          );
        }
      };

      const imageData = await new Promise<ImageData>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setTimeout(() => {
            resolve({ base64, mimeType: file.type });
          }, 400);
        };
        reader.readAsDataURL(file);
      });

      setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      setImages(prev => [...prev, imageData]);
    }
    
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    try {
      const res = await analyzeCompliance(images);
      setResult(res);
      setOpenSections({ summary: true, details: true, recommendations: true, references: true });
    } catch (err) {
      alert('خطأ في التحليل، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const chartData = result ? [
    { name: 'امتثال', value: result.score },
    { name: 'فجوة', value: 100 - result.score }
  ] : [];

  const COLORS = ['#4f46e5', '#e2e8f0'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-4 space-y-8 print:hidden">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">إيداع المخططات</h2>
          </div>
          
          <div className="group border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="bg-white w-16 h-16 rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-slate-700 font-bold mb-1">اسحب المخططات هنا</p>
            <p className="text-xs text-slate-400">يدعم رفع ملفات متعددة عالية الدقة</p>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadingFiles.map(file => (
                <div key={file.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{file.name}</span>
                    <span className="text-[10px] font-black text-indigo-600">{file.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300" 
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm">
                    <img 
                      src={`data:${img.mimeType};base64,${img.base64}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={`مخطط ${index + 1}`} 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => removeImage(index)}
                        className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-rose-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={loading || uploadingFiles.length > 0}
                className="group relative w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl hover:shadow-indigo-200 flex justify-center items-center gap-3 overflow-hidden"
              >
                {loading ? (
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <span>تحليل المخططات</span>
                    <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 space-y-8">
        {result ? (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-black mb-2 tracking-tighter uppercase text-xs">
                  <span className="w-6 h-px bg-indigo-600"></span>
                  Engineering Report
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">تقرير التدقيق الشامل</h2>
                <p className="text-slate-400 font-medium">مُنشأ بواسطة بُنيان في {new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              <div className="flex items-center gap-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="relative h-20 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={28}
                        outerRadius={38}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={true}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xl">{result.score}%</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">حالة الامتثال</span>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${
                    result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    result.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {result.status === 'compliant' ? 'ممتثل' :
                     result.status === 'warning' ? 'تحذير' : 'مرفوض'}
                  </span>
                </div>
              </div>
            </header>

            <div className="grid gap-6">
              <CollapsibleSection
                title="الملخص التنفيذي"
                isOpen={openSections.summary}
                onToggle={() => toggleSection('summary')}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              >
                <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100 text-slate-800 font-bold text-lg leading-relaxed shadow-inner italic">
                  {result.executiveSummary}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="التحليل الفني المعمق"
                isOpen={openSections.details}
                onToggle={() => toggleSection('details')}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              >
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-loose">
                  {result.details}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="توصيات التحسين الفوري"
                isOpen={openSections.recommendations}
                onToggle={() => toggleSection('recommendations')}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              >
                <ul className="grid gap-4">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-4 items-start p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-indigo-50 transition-all">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xs shrink-0">{i+1}</div>
                      <span className="text-slate-700 font-medium">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>

              <CollapsibleSection
                title="المراجع والأنظمة"
                isOpen={openSections.references}
                onToggle={() => toggleSection('references')}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              >
                <div className="flex flex-wrap gap-3">
                  {result.references.map((ref, i) => (
                    <div key={i} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-black border border-indigo-100 shadow-sm">
                      {ref}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>

            <footer className="mt-12 flex flex-col md:flex-row gap-4 justify-between items-center pt-8 border-t border-slate-100 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                تصدير بصيغة PDF
              </button>
              <div className="flex gap-2 text-slate-400 text-xs font-bold items-center">
                 <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                 موقع من الخوارزمية الفنية المعتمدة
              </div>
            </footer>
          </div>
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] min-h-[600px] flex flex-col items-center justify-center p-12 text-center animate-pulse">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">في انتظار المخططات</h3>
            <p className="text-slate-400 max-w-xs font-medium leading-relaxed">بمجرد رفعك للملفات، سيقوم محرك بُنيان الذكي بفحص مئات المعايير الهندسية في ثوانٍ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceView;
