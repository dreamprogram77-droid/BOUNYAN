
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { AnalysisResult, ImageData, DetailedFinding } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ShortcutBadge: React.FC<{ keys: string }> = ({ keys }) => (
  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-400 ml-2 group-hover:border-indigo-300 transition-colors">
    {keys}
  </span>
);

const CollapsibleSection: React.FC<{
  id: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  shortcut?: string;
}> = ({ id, title, description, isOpen, onToggle, icon, children, shortcut }) => {
  const contentId = `content-${id}`;
  return (
    <section id={id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all duration-700 transform ${
      isOpen 
        ? 'border-indigo-100 dark:border-indigo-900/40 shadow-2xl shadow-indigo-100/30 dark:shadow-none scale-[1.01]' 
        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/20'
    } scroll-mt-24 overflow-hidden`}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`w-full flex items-center justify-between p-7 md:p-9 text-right transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/20 ${
          isOpen ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
        }`}
      >
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl transition-all duration-500 ${
            isOpen 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none rotate-12 scale-110' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500'
          }`}>
            {icon}
          </div>
          <div className="text-right">
            <h3 className={`font-black text-2xl md:text-3xl transition-all duration-500 flex items-center ${
              isOpen ? 'text-slate-900 dark:text-white translate-x-[-4px]' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {title}
              {shortcut && <ShortcutBadge keys={shortcut} />}
            </h3>
            {description && (
              <p className={`text-sm mt-1 transition-all duration-500 ${isOpen ? 'text-indigo-600/70 dark:text-indigo-400/70' : 'text-slate-400 opacity-0'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full transition-all duration-700 ${
          isOpen ? 'bg-indigo-600 text-white rotate-180 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div 
        id={contentId}
        role="region"
        aria-labelledby={`title-${id}`}
        className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
        isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <div className="p-8 md:p-14 pt-2 text-slate-600 dark:text-slate-300 leading-relaxed text-xl border-t border-slate-50 dark:border-slate-800">
          <div className={`transition-all duration-1000 delay-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {children}
          </div>
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
  const [copiedRefIndex, setCopiedRefIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [activeSection, setActiveSection] = useState('summary-section');
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  
  const [openSections, setOpenSections] = useState({
    summary: true,
    details: true,
    recommendations: true,
    references: false,
    faq: false,
  });

  const activeReaders = useRef<FileReader[]>([]);
  const reportHeaderRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (images.length > 0 && !loading && uploadingFiles.length === 0) {
          handleAnalyze();
        }
      }

      if (e.altKey && e.key === 'Backspace') {
        if (images.length > 0) setShowConfirmClear(true);
      }

      const sectionKeys: Record<string, keyof typeof openSections> = {
        '1': 'summary', '2': 'details', '3': 'recommendations', '4': 'references', '5': 'faq'
      };

      // Fix: Wrapping sectionId in String() to avoid implicit conversion of a symbol to a string
      const sectionId = sectionKeys[e.key];
      if (sectionId) {
        toggleSection(sectionId);
        if (result) scrollToSection(`${String(sectionId)}-section`);
      }

      if (e.key === 'Escape') {
        setShowConfirmClear(false);
        setShowShareMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, loading, uploadingFiles, result, openSections]);

  // Intersection Observer for Active Section & Sticky Header
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -40% 0px' }
    );

    const sections = ['summary-section', 'details-section', 'recommendations-section', 'references-section', 'faq-section'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Sticky Header Scroll Logic
    const handleScroll = () => {
      if (reportHeaderRef.current) {
        const { bottom } = reportHeaderRef.current.getBoundingClientRect();
        setIsHeaderSticky(bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [result]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Accessibility: move focus to the section
      const button = element.querySelector('button');
      if (button) button.focus();
    }
  };

  const isUrl = (text: string) => {
    try { new URL(text); return true; } catch (_) { return false; }
  };

  const handleCopyRef = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRefIndex(index);
      setTimeout(() => setCopiedRefIndex(null), 2000);
    });
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) { setError(`المستند "${file.name}" غير مدعوم.`); return false; }
      if (file.size > MAX_FILE_SIZE) { setError(`المستند "${file.name}" يتجاوز 10 ميجابايت.`); return false; }
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
            setUploadingFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: Math.round((event.loaded / event.total) * 100) } : f));
          }
        };

        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setImages(prev => [...prev, { base64, mimeType: file.type, name: file.name }]);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          resolve();
        };

        reader.onerror = () => {
          setError(`فشل رفع ${file.name}`);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(uploadPromises);
  };

  // Fix: Correctly define handleFileUpload inside the component scope to access processFiles
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  // Fix: Correctly define removeImage inside the component scope to access setImages
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeCompliance(images);
      setResult(res);
      setOpenSections({ summary: true, details: true, recommendations: true, references: true, faq: false });
    } catch (err) {
      setError('حدث خطأ فني أثناء تحليل المخططات.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4f46e5', '#f1f5f9'];
  const chartData = result ? [{ name: 'امتثال', value: result.score }, { name: 'فجوة', value: 100 - result.score }] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-24">
      
      {/* Sidebar Upload */}
      <div className="lg:col-span-4 space-y-8 print:hidden sticky top-28">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-10 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100 dark:shadow-none"></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">إيداع المخططات</h2>
            </div>
          </div>
          
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
            className={`group border-3 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden ${
              isDragging ? 'bg-indigo-600/5 border-indigo-600 ring-8 ring-indigo-600/5 scale-[1.02]' : 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
          >
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 text-indigo-500 shadow-xl border border-slate-50 flex items-center justify-center mx-auto mb-6 transition-all">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <p className="font-black text-xl mb-2 text-slate-800 dark:text-white">ارفع المخططات الهندسية</p>
            <p className="text-sm text-slate-400 font-medium">اسحب وأفلت أو انقر للاختيار</p>
          </div>

          {(images.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">المرفقات ({images.length})</h3>
                <button onClick={() => setShowConfirmClear(true)} className="text-[10px] font-bold text-rose-500 hover:underline">حذف الكل</button>
              </div>
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <img src={`data:${img.mimeType};base64,${img.base64}`} className="w-12 h-10 object-cover rounded-lg" alt="" />
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate flex-1">{img.name}</p>
                    <button onClick={() => removeImage(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all flex justify-center items-center gap-4 active:scale-95"
              >
                {loading ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div> : <><span>بدء التدقيق الفني</span> <ShortcutBadge keys="CTRL + ↵" /></>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Report Area */}
      <div className="lg:col-span-8 space-y-8 min-h-[800px]">
        {/* Sticky Header */}
        {result && (
          <div className={`fixed top-[64px] left-0 right-0 z-[60] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-indigo-100 dark:border-indigo-900/40 px-6 py-4 transition-all duration-500 transform ${isHeaderSticky ? 'translate-y-0 opacity-100 shadow-2xl' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                    {result.score}%
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase">درجة الامتثال</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">المشروع الحالي</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${result.status === 'compliant' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                   <span className="text-xs font-black uppercase tracking-widest text-slate-500">{result.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => window.print()} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
                 <button onClick={() => scrollToSection('summary-section')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg">العودة للأعلى</button>
              </div>
            </div>
          </div>
        )}

        {result ? (
          <div className="bg-white/50 dark:bg-slate-900/50 p-6 md:p-10 rounded-[4rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-16 relative overflow-hidden">
              
              {/* Report Header */}
              <header ref={reportHeaderRef} className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20 pb-16 border-b border-slate-100 dark:border-slate-800 relative">
                <div className="flex-1 text-center md:text-right">
                  <div className="flex items-center justify-center md:justify-start gap-3 text-indigo-600 dark:text-indigo-400 font-black mb-6 tracking-widest uppercase text-xs">
                    <span className="w-10 h-px bg-indigo-600"></span>
                    Smart Compliance Verification
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">تقرير الامتثال الهندسي</h2>
                  <p className="text-slate-400 font-bold">رقم التقرير الفني: #BUN-{Math.random().toString(36).substr(2,6).toUpperCase()}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner flex items-center gap-10">
                  <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} innerRadius={38} outerRadius={54} paddingAngle={8} dataKey="value" isAnimationActive={true}>
                          {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={12} stroke="none" />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-black text-indigo-600 text-4xl leading-none">{result.score}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase">%</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">تقييم النظام</span>
                    <span className={`px-8 py-3 rounded-2xl text-xs font-black border uppercase tracking-widest shadow-lg block text-center ${
                      result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {result.status === 'compliant' ? 'ممتثل' : 'تنبيه'}
                    </span>
                  </div>
                </div>
              </header>

              <div className="grid gap-12">
                <CollapsibleSection
                  id="summary-section"
                  title="الملخص التنفيذي"
                  description="نظرة عامة على حالة المشروع والامتثال للأكواد."
                  isOpen={openSections.summary}
                  onToggle={() => toggleSection('summary')}
                  shortcut="1"
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
                >
                  <div className="bg-indigo-50/20 dark:bg-indigo-900/10 p-10 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-800/50 text-slate-800 dark:text-slate-200 font-bold text-xl leading-relaxed">
                    {result.executiveSummary}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="details-section"
                  title="التحليل الفني المرتبط بالمخططات"
                  description="ربط الملاحظات الفنية بالمستندات المرفوعة للتحقق."
                  isOpen={openSections.details}
                  onToggle={() => toggleSection('details')}
                  shortcut="2"
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>}
                >
                  <div className="space-y-8">
                    <p className="text-lg mb-8 leading-relaxed whitespace-pre-wrap">{result.details}</p>
                    
                    {/* Visual Mapping Interface */}
                    {result.findings && result.findings.length > 0 && (
                      <div className="mt-12 space-y-6">
                        <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                           <span className="w-8 h-px bg-indigo-500"></span>
                           الملاحظات المرتبطة بصرياً
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {result.findings.map((finding, idx) => (
                             <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all flex gap-6">
                                {finding.imageIndex !== undefined && images[finding.imageIndex] && (
                                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white dark:border-slate-700 shadow-md">
                                    <img src={`data:${images[finding.imageIndex].mimeType};base64,${images[finding.imageIndex].base64}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                  </div>
                                )}
                                <div className="flex-1">
                                   <div className="text-[10px] font-black text-slate-400 uppercase mb-2">ملاحظة فنية #{idx + 1}</div>
                                   <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{finding.text}</p>
                                   {finding.imageIndex !== undefined && (
                                     <span className="inline-block mt-3 text-[9px] font-black bg-white dark:bg-slate-700 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-50 dark:border-indigo-900">
                                       مخطط: {images[finding.imageIndex].name}
                                     </span>
                                   )}
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Remaining sections maintained for completeness */}
                <CollapsibleSection id="recommendations-section" title="التوصيات والخطوات التصحيحية" isOpen={openSections.recommendations} onToggle={() => toggleSection('recommendations')} shortcut="3" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-6 items-start p-8 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] hover:shadow-xl transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform">{i+1}</div>
                        <span className="text-slate-700 dark:text-slate-300 font-black text-lg leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>

                {/* Reference Section with aria-labeling */}
                <CollapsibleSection id="references-section" title="المصادر والأكواد المرجعية" isOpen={openSections.references} onToggle={() => toggleSection('references')} shortcut="4" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13" /></svg>}>
                   <div className="flex flex-wrap gap-4" role="list">
                    {result.references.map((ref, i) => (
                      <button key={i} onClick={() => handleCopyRef(ref, i)} className={`inline-flex items-center gap-3 px-8 py-5 rounded-[2rem] text-sm font-black border transition-all shadow-sm ${copiedRefIndex === i ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100'}`} aria-label={`Copy reference: ${ref}`}>
                        {copiedRefIndex === i ? 'تم النسخ!' : ref}
                        <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>

              {/* Actions Footer */}
              <footer className="mt-24 pt-16 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 justify-center print:hidden">
                 <button onClick={() => window.print()} className="flex items-center gap-4 bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all">
                    تصدير التقرير
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
                 <button onClick={() => window.location.href = `mailto:?subject=Engineering Audit&body=Compliance: ${result.score}%`} className="flex items-center gap-4 bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-700 shadow-xl transition-all">
                    مشاركة
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg>
                 </button>
              </footer>
            </div>
          </div>
        ) : (
          <div className="bg-white/40 dark:bg-slate-900/40 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[4rem] min-h-[700px] flex flex-col items-center justify-center p-20 text-center">
            <div className="w-32 h-32 bg-white dark:bg-slate-800 shadow-2xl rounded-[3rem] flex items-center justify-center mb-10 text-slate-200 dark:text-slate-700 animate-[bounce_3s_infinite]">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">جاهز لبدء التحليل الهندسي</h3>
            <p className="text-slate-400 max-w-md mx-auto text-2xl font-medium">ارفع مخططاتك الهندسية الآن وسيقوم نظام بُنيان الذكي بفحص الامتثال بدقة فائقة.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">هل أنت متأكد من الحذف؟</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">سيتم مسح كافة المخططّات المرفوعة حالياً.</p>
            <div className="flex gap-4">
              <button onClick={() => { setImages([]); setShowConfirmClear(false); }} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-sm">تأكيد الحذف</button>
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black text-sm">إلغاء [ESC]</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
