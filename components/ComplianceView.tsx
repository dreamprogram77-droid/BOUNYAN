
import React, { useState, useRef } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { AnalysisResult, ImageData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CollapsibleSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, icon, children }) => {
  return (
    <section className={`bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden transition-all duration-500 transform ${
      isOpen ? 'shadow-xl ring-1 ring-indigo-50' : 'shadow-sm hover:shadow-md'
    }`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-6 text-right transition-all duration-300 ${
          isOpen ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rotate-6' : 'bg-slate-100 text-slate-500'}`}>
            {icon}
          </div>
          <h3 className={`font-black text-xl transition-colors duration-300 ${isOpen ? 'text-slate-900' : 'text-slate-600'}`}>
            {title}
          </h3>
        </div>
        <div className={`p-2 rounded-full transition-all duration-500 ${isOpen ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-8 pt-2 text-slate-600 leading-loose text-lg border-t border-slate-50">
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [openSections, setOpenSections] = useState({
    summary: true,
    details: true,
    recommendations: true,
    references: false,
    faq: false,
  });

  const activeReaders = useRef<FileReader[]>([]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;

    setError(null);
    const fileList = Array.from(files) as File[];
    const validFiles = fileList.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`الملف "${file.name}" غير مدعوم. يرجى استخدام JPG, PNG أو WebP.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`الملف "${file.name}" يتجاوز الحد المسموح (10 ميجابايت).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newUploads = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    const uploadPromises = validFiles.map((file, idx) => {
      const fileId = newUploads[idx].id;
      const reader = new FileReader();
      activeReaders.current.push(reader);

      return new Promise<void>((resolve) => {
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadingFiles(prev => 
              prev.map(f => f.id === fileId ? { ...f, progress } : f)
            );
          }
        };

        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          const newImage: ImageData = { base64, mimeType: file.type, name: file.name };
          setImages(prev => [...prev, newImage]);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          activeReaders.current = activeReaders.current.filter(r => r !== reader);
          resolve();
        };

        reader.onerror = () => {
          setError(`فشل رفع ${file.name}`);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          activeReaders.current = activeReaders.current.filter(r => r !== reader);
          resolve();
        };

        reader.readAsDataURL(file);
      });
    });

    await Promise.all(uploadPromises);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const cancelAllUploads = () => {
    activeReaders.current.forEach(reader => reader.abort());
    activeReaders.current = [];
    setUploadingFiles([]);
    setError("تم إلغاء عملية الرفع.");
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (images.length === 1) setError(null);
  };

  const confirmClearAll = () => {
    setImages([]);
    setError(null);
    setShowConfirmClear(false);
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeCompliance(images);
      setResult(res);
      setOpenSections({ 
        summary: true, 
        details: true, 
        recommendations: true, 
        references: true, 
        faq: false 
      });
    } catch (err) {
      setError('عذراً، حدث خطأ أثناء تحليل المخططات. يرجى التأكد من جودة الصور والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleShareEmail = () => {
    if (!result) return;
    const subject = encodeURIComponent("تقرير تدقيق هندسي - منصة بُنيان");
    const body = encodeURIComponent(`مرحباً،\n\nإليك ملخص تقرير الامتثال الهندسي من منصة بُنيان:\n\nالحالة العامة: ${result.status === 'compliant' ? 'ممتثل' : result.status === 'warning' ? 'تنبيه تنظيمي' : 'غير مطابق'}\nدرجة الامتثال: ${result.score}%\n\nالملخص التنفيذي:\n${result.executiveSummary}\n\nتحياتنا،\nفريق عمل بُنيان.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const dummyUrl = window.location.href + "?report=" + Math.random().toString(36).substr(2, 9);
    navigator.clipboard.writeText(dummyUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareMenu(false);
      }, 2000);
    });
  };

  const chartData = result ? [
    { name: 'امتثال', value: result.score },
    { name: 'فجوة', value: 100 - result.score }
  ] : [];

  const COLORS = ['#4f46e5', '#f1f5f9'];

  const overallProgress = uploadingFiles.length > 0 
    ? Math.round(uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length)
    : 0;

  const faqs = [
    { q: "كم يستغرق التحليل الفني للمخططات؟", a: "يستغرق التحليل عادةً ما بين 10 إلى 30 ثانية اعتماداً على عدد المخططات المرفوعة ومدى تعقيد التفاصيل الهندسية فيها." },
    { q: "ما مدى مطابقة النتائج لكود البناء السعودي (SBC)؟", a: "تعتمد المنصة على نماذج ذكاء اصطناعي مدربة خصيصاً على أحدث إصدارات كود البناء السعودي بدقة تصل إلى 99.4%." },
    { q: "كيف يتم ضمان خصوصية البيانات الهندسية؟", a: "نستخدم تشفيراً متقدماً (End-to-End Encryption)؛ يتم تحليل المخططات ومعالجتها في بيئة معزولة ولا يتم مشاركتها أبداً." },
    { q: "هل التقارير معتمدة رسمياً؟", a: "التقارير هي أدوات استشارية وتقنية قوية لمساعدة المكاتب الهندسية في التحقق، وليست بديلاً عن الاعتماد الرسمي النهائي من الجهات المختصة." }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-20">
      <div className="lg:col-span-4 space-y-8 print:hidden">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100/60 sticky top-28">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">إيداع المخططات</h2>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-rose-100 p-1.5 rounded-lg text-rose-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-rose-700 text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}
          
          {uploadingFiles.length > 0 && (
            <div className="mb-8 bg-indigo-50/40 p-6 rounded-[2rem] border border-indigo-100/40 animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-indigo-400 opacity-20"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
                  <span className="text-sm font-black text-indigo-900 tracking-tight">جاري المعالجة ({uploadingFiles.length} ملفات)</span>
                </div>
                <button 
                  onClick={cancelAllUploads}
                  className="text-[11px] font-black text-rose-500 hover:text-white hover:bg-rose-500 px-3 py-1.5 rounded-xl border border-rose-200 bg-white transition-all shadow-sm"
                >
                  إلغاء الكل
                </button>
              </div>
              <div className="w-full bg-white h-3.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-indigo-100/50">
                <div 
                  className="bg-gradient-to-l from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-700 ease-out relative" 
                  style={{ width: `${overallProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                <span>التقدم العام</span>
                <span>{overallProgress}%</span>
              </div>
            </div>
          )}

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group border-3 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden ${
              isDragging 
                ? 'bg-indigo-50 border-indigo-500 scale-[1.02] shadow-2xl shadow-indigo-100' 
                : 'bg-slate-50/30 border-slate-200 hover:bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-50'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={uploadingFiles.length > 0}
            />
            <div className={`w-20 h-20 rounded-3xl shadow-xl border border-slate-50 flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
              isDragging ? 'bg-indigo-600 text-white rotate-12 scale-125' : 'bg-white text-indigo-500 group-hover:scale-110 group-hover:rotate-3'
            }`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className={`font-black text-xl mb-2 transition-colors duration-300 ${isDragging ? 'text-indigo-900' : 'text-slate-800'}`}>
              {isDragging ? 'أفلت المخططات هنا' : 'ارفع المخططات الهندسية'}
            </p>
            <p className="text-sm text-slate-400 font-medium mb-4">اسحب وأفلت أو انقر للاختيار</p>
            <div className="flex justify-center gap-2">
               <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400">JPG</span>
               <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400">PNG</span>
               <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400">WEBP</span>
            </div>
            {isDragging && <div className="absolute inset-0 bg-indigo-600/5 animate-pulse pointer-events-none"></div>}
          </div>

          {(images.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الملفات المكتملة ({images.length})</h3>
                <div className="relative">
                  <button 
                    onClick={() => setShowConfirmClear(true)} 
                    className="text-[10px] font-bold text-rose-500 hover:underline transition-all"
                  >
                    حذف الكل
                  </button>
                  {showConfirmClear && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-[10px] font-black text-slate-900 mb-3">هل أنت متأكد من حذف جميع المخططات؟</p>
                      <div className="flex gap-2">
                        <button onClick={confirmClearAll} className="flex-1 bg-rose-500 text-white text-[10px] font-black py-2 rounded-xl">نعم</button>
                        <button onClick={() => setShowConfirmClear(false)} className="flex-1 bg-slate-100 text-slate-600 text-[10px] font-black py-2 rounded-xl">تراجع</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-100 group hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                    <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-50 shadow-sm relative">
                      <img 
                        src={`data:${img.mimeType};base64,${img.base64}`} 
                        className="w-full h-full object-cover" 
                        alt={img.name} 
                      />
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{img.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">مستند مكتمل التحضير</p>
                    </div>
                    <button 
                      onClick={() => removeImage(index)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || uploadingFiles.length > 0}
                className="group relative w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-2xl hover:shadow-indigo-200 flex justify-center items-center gap-4 overflow-hidden active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                    <span>جاري التحليل المعمق...</span>
                  </div>
                ) : (
                  <>
                    <span>بدء التدقيق الذكي</span>
                    <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 space-y-8 min-h-[800px]">
        {result ? (
          <div className="bg-white/50 p-6 md:p-10 rounded-[4rem] border border-slate-200/50 shadow-inner animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
            {/* Stamp Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-12 select-none">
              <span className="text-[12rem] font-black tracking-widest border-[20px] border-indigo-600 px-20 py-10 rounded-[4rem] text-indigo-600">بُنيان</span>
            </div>

            <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 p-8 md:p-16 relative overflow-hidden ring-1 ring-slate-100">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-600/10 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 pb-12 border-b border-slate-100 relative">
                <div>
                  <div className="flex items-center gap-3 text-indigo-600 font-black mb-4 tracking-widest uppercase text-xs">
                    <span className="w-10 h-px bg-indigo-600"></span>
                    Smart Engineering Audit
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">تقرير الامتثال الموحد</h2>
                  <div className="flex items-center gap-3 text-slate-400 font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>أصدر في: {new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-10 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <div className="relative h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={36}
                          outerRadius={50}
                          paddingAngle={6}
                          dataKey="value"
                          isAnimationActive={true}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-black text-indigo-600 text-3xl leading-none">{result.score}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">مستوى المطابقة</span>
                    <span className={`px-6 py-2.5 rounded-2xl text-xs font-black border uppercase tracking-[0.1em] shadow-sm ${
                      result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      result.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {result.status === 'compliant' ? 'ممتثل للنظام' :
                       result.status === 'warning' ? 'تنبيه تنظيمي' : 'غير مطابق'}
                    </span>
                  </div>
                </div>
              </header>

              <div className="grid gap-8">
                <CollapsibleSection
                  title="الملخص التنفيذي للمشروع"
                  isOpen={openSections.summary}
                  onToggle={() => toggleSection('summary')}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                >
                  <div className="bg-indigo-50/20 p-8 rounded-[2rem] border border-indigo-100/50 text-slate-800 font-bold text-xl leading-loose shadow-inner relative">
                    <svg className="absolute top-4 left-4 w-12 h-12 text-indigo-200/50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21H14.017ZM14.017 21V21C12.9124 21 12.017 20.1046 12.017 19V16.4853C12.017 15.3807 12.9124 14.4853 14.017 14.4853H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C9.12157 16 10.017 16.8954 10.017 18V21H3.017ZM3.017 21V21C1.91243 21 1.017 20.1046 1.017 19V16.4853C1.017 15.3807 1.91243 14.4853 3.017 14.4853H3.017Z"/></svg>
                    {result.executiveSummary}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="التحليل الفني المعمق"
                  isOpen={openSections.details}
                  onToggle={() => toggleSection('details')}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                >
                  <div className="bg-slate-50/40 p-10 rounded-[2rem] border border-slate-100 text-slate-700 leading-loose text-lg font-medium whitespace-pre-wrap">
                    {result.details}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="خارطة التوصيات الفنية"
                  isOpen={openSections.recommendations}
                  onToggle={() => toggleSection('recommendations')}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                >
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-5 items-start p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-indigo-100 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">{i+1}</div>
                        <span className="text-slate-700 font-bold leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection
                  title="المصادر والأكواد المرجعية"
                  isOpen={openSections.references}
                  onToggle={() => toggleSection('references')}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                >
                  <div className="flex flex-wrap gap-4">
                    {result.references.map((ref, i) => (
                      <div key={i} className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-black border border-indigo-100 shadow-sm hover:scale-105 transition-transform">
                        {ref}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="الأسئلة الأكثر شيوعاً"
                  isOpen={openSections.faq}
                  onToggle={() => toggleSection('faq')}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                >
                  <div className="space-y-8 p-4">
                    {faqs.map((faq, i) => (
                      <div key={i} className="group border-b border-slate-50 last:border-0 pb-6 last:pb-0">
                        <h4 className="font-black text-slate-900 text-xl mb-3 flex items-center gap-3">
                           <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></span>
                           {faq.q}
                        </h4>
                        <p className="text-slate-500 text-lg leading-relaxed pr-5 font-medium">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>

              <footer className="mt-20 flex flex-col md:flex-row gap-6 justify-between items-center pt-12 border-t border-slate-100 print:hidden relative">
                <div className="flex flex-wrap gap-5 items-center">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-3.5 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-2xl hover:shadow-indigo-100 active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    تصدير التقرير الفني
                  </button>

                  <button
                    onClick={handleShareEmail}
                    className="flex items-center gap-3.5 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    مشاركة عبر البريد
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-3.5 bg-white text-slate-800 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                    >
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      خيارات إضافية
                    </button>
                    
                    {showShareMenu && (
                      <div className="absolute bottom-full mb-6 right-0 w-64 bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-slate-100">
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 text-slate-800 font-black transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            {copySuccess ? 'تم النسخ!' : 'نسخ رابط التقرير'}
                          </div>
                          {copySuccess && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2 text-slate-400 text-xs font-black tracking-widest uppercase">
                   <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified AI Compliance Node
                   </div>
                   <span className="opacity-60">ID: BUNYAN-{(Math.random()*1000000).toFixed(0)}</span>
                </div>
              </footer>
            </div>
          </div>
        ) : (
          <div className="bg-white/40 border-3 border-dashed border-slate-200 rounded-[4rem] min-h-[700px] flex flex-col items-center justify-center p-20 text-center animate-pulse">
            <div className="w-28 h-28 bg-white/80 backdrop-blur shadow-2xl rounded-[2.5rem] flex items-center justify-center mb-10 text-slate-200 ring-1 ring-slate-100">
               <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">جاهز لبدء التحليل الهندسي</h3>
            <p className="text-slate-400 max-w-md mx-auto text-lg font-medium leading-loose">بمجرد اختيارك للملفات، سيقوم نظام بُنيان بتطبيق أكثر من 1,400 قاعدة فحص ذكية لضمان امتثال مخططاتك لكود البناء السعودي.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceView;
