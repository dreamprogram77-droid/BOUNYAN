
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { AnalysisResult, ImageData, DetailedFinding } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
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
  accentIcon?: React.ReactNode;
}> = ({ id, title, description, isOpen, onToggle, icon, children, shortcut, accentIcon }) => {
  const [isClicked, setIsClicked] = useState(false);
  const contentId = `content-${id}`;

  const handleToggle = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 400);
    onToggle();
  };

  return (
    <section id={id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all duration-700 transform ${
      isOpen 
        ? 'border-indigo-100 dark:border-indigo-900/40 shadow-2xl shadow-indigo-100/30 dark:shadow-none scale-[1.01]' 
        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/20'
    } scroll-mt-24 overflow-hidden`}>
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`w-full flex items-center justify-between p-7 md:p-9 text-right transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/20 group ${
          isOpen ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
        }`}
      >
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl transition-all duration-500 relative ${
            isClicked ? 'scale-75 rotate-12' : ''
          } ${
            isOpen 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none rotate-12 scale-110' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 group-hover:rotate-6'
          }`}>
            <div className={`transition-transform duration-500 ${isOpen ? 'animate-pulse' : 'group-hover:animate-bounce'}`}>
              {icon}
            </div>
            {isClicked && (
              <div className="absolute inset-0 rounded-2xl animate-ping bg-indigo-400/30"></div>
            )}
          </div>
          <div className="text-right">
            <h3 className={`font-black text-2xl md:text-3xl transition-all duration-500 flex items-center gap-3 ${
              isOpen ? 'text-slate-900 dark:text-white translate-x-[-4px]' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {title}
              {accentIcon && (
                <span className={`transition-all duration-700 ${isOpen ? 'opacity-100 scale-100 rotate-0 text-indigo-500' : 'opacity-0 scale-50 -rotate-45 text-slate-300'}`}>
                  {accentIcon}
                </span>
              )}
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
          isOpen ? 'bg-indigo-600 text-white rotate-180 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:text-indigo-500 group-hover:scale-125'
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
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'مراجعة المخططات الإنشائية والتأكد من تطابق الأحمال', completed: false },
    { id: '2', text: 'التحقق من متطلبات السلامة من الحريق وكاشفات الدخان', completed: false },
    { id: '3', text: 'مراجعة عزل الواجهات حسب كود الطاقة السعودي', completed: true },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const [openSections, setOpenSections] = useState({
    summary: false,
    details: true,
    recommendations: true,
    references: false,
    tasks: true,
    faq: false,
  });

  const activeReaders = useRef<FileReader[]>([]);
  const reportHeaderRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      const sectionKeys: Record<string, string> = {
        '1': 'summary', '2': 'details', '3': 'recommendations', '4': 'references', '5': 'tasks', '6': 'faq'
      };

      const sectionId = sectionKeys[e.key];
      if (sectionId) {
        toggleSection(sectionId as keyof typeof openSections);
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

    const sections = ['summary-section', 'details-section', 'recommendations-section', 'references-section', 'tasks-section', 'faq-section'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

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
      const button = element.querySelector('button');
      if (button) button.focus();
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setShowShareMenu(false);
    });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

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
      setOpenSections({ ...openSections, summary: false, details: true, recommendations: true, references: true });
    } catch (err) {
      setError('حدث خطأ فني أثناء تحليل المخططات.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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
            className={`group rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed ${
              isDragging 
                ? 'marching-ants-border bg-indigo-50 dark:bg-indigo-900/30 scale-[1.04] shadow-2xl shadow-indigo-500/20 border-indigo-400 dark:border-indigo-500 ring-8 ring-indigo-500/5' 
                : 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400'
            }`}
          >
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            
            <div className={`w-24 h-24 rounded-3xl shadow-xl border flex items-center justify-center mb-6 transition-all duration-700 ${
              isDragging 
                ? 'bg-indigo-600 text-white rotate-[15deg] scale-125 border-indigo-300 shadow-indigo-200 -translate-y-4' 
                : 'bg-white dark:bg-slate-900 text-indigo-500 border-slate-50 dark:border-slate-800'
            }`}>
              <svg className={`w-12 h-12 transition-all duration-500 ${isDragging ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            
            <div className="relative z-10 transition-all duration-500">
              <p className={`font-black text-2xl mb-2 transition-all duration-300 ${isDragging ? 'text-indigo-900 dark:text-indigo-100 scale-110' : 'text-slate-800 dark:text-white'}`}>
                {isDragging ? 'أسقط المخططات الآن' : 'ارفع المخططات الهندسية'}
              </p>
              <p className={`text-sm font-bold transition-opacity duration-300 ${isDragging ? 'text-indigo-600 dark:text-indigo-400 opacity-100' : 'text-slate-400 opacity-70'}`}>
                {isDragging ? 'بُنيان جاهز للتدقيق الفوري' : 'اسحب وأفلت أو انقر للاختيار'}
              </p>
            </div>

            {isDragging && (
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-indigo-500/10 animate-pulse pointer-events-none z-0"></div>
            )}
          </div>

          {(images.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-10 space-y-6 animate-in fade-in duration-700">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  المرفقات ({images.length + uploadingFiles.length})
                </h3>
                {images.length > 0 && (
                  <button onClick={() => setShowConfirmClear(true)} className="text-[10px] font-bold text-rose-500 hover:underline transition-colors hover:text-rose-600">حذف الكل</button>
                )}
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 truncate w-3/4">{file.name}</span>
                      <span className="text-[10px] font-black text-indigo-600">{file.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                    </div>
                  </div>
                ))}

                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 hover:scale-[1.03] transition-all duration-300 group animate-in slide-in-from-right-4">
                    <div className="w-14 h-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-50 dark:border-slate-800">
                      <img src={`data:${img.mimeType};base64,${img.base64}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{img.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">جاهز للفحص</p>
                    </div>
                    <button 
                      onClick={() => removeImage(index)} 
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                      title="إزالة المخطط"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || images.length === 0 || uploadingFiles.length > 0}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all flex justify-center items-center gap-4 active:scale-95 disabled:opacity-50 disabled:scale-100"
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
                 <button onClick={() => window.print()} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title="حفظ كـ PDF">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
                 <button onClick={() => scrollToSection('summary-section')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg">العودة للأعلى</button>
              </div>
            </div>
          </div>
        )}

        {result ? (
          <div className="bg-indigo-50/10 dark:bg-slate-900/50 p-6 md:p-12 rounded-[4.5rem] border border-indigo-100/50 dark:border-indigo-900/30 shadow-[inset_0_2px_15px_rgba(79,70,229,0.05)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12),0_30px_60px_-30px_rgba(79,70,229,0.15)] border-2 border-indigo-50/50 dark:border-indigo-900/20 p-8 md:p-16 relative overflow-hidden group/card">
              
              {/* Report Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600"></div>

              {/* Report Header */}
              <header ref={reportHeaderRef} className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12 pb-16 border-b border-slate-100 dark:border-slate-800 relative">
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
                  <div className="space-y-3 text-center md:text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">تقييم النظام</span>
                    <span className={`px-8 py-3 rounded-2xl text-xs font-black border uppercase tracking-widest shadow-lg block text-center ${
                      result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {result.status === 'compliant' ? 'ممتثل' : 'تنبيه'}
                    </span>
                  </div>
                </div>
              </header>

              {/* Permanent Executive Summary Card */}
              <div className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-indigo-600 dark:bg-indigo-600 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                      </pattern>
                      <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 text-indigo-100 font-black mb-6 tracking-widest uppercase text-xs">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      موجز المراجعة التنفيذية
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-black mb-6 leading-tight tracking-tight">
                          تم تحليل المخططات بنجاح؛ المشروع بنسبة امتثال تقنية بلغت {result.score}٪.
                        </h3>
                        <p className="text-indigo-50/80 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                          {result.executiveSummary}
                        </p>
                      </div>
                      
                      <div className="w-full md:w-auto shrink-0 bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">
                         <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-8">
                               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">النتيجة النهائية</span>
                               <span className="text-2xl font-black">{result.score}/100</span>
                            </div>
                            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-white h-full transition-all duration-1000 ease-out" style={{ width: `${result.score}%` }}></div>
                            </div>
                            <div className="pt-2">
                               <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                 result.status === 'compliant' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'
                               }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                  {result.status} Status
                               </span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-12">
                <CollapsibleSection
                  id="summary-section"
                  title="نص الملخص التفصيلي"
                  description="التفاصيل النصية الكاملة للملخص التنفيذي."
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
                  accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>}
                >
                  <div className="space-y-8">
                    <p className="text-lg mb-8 leading-relaxed whitespace-pre-wrap">{result.details}</p>
                    
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

                <CollapsibleSection 
                  id="recommendations-section" 
                  title="التوصيات والخطوات التصحيحية" 
                  isOpen={openSections.recommendations} 
                  onToggle={() => toggleSection('recommendations')} 
                  shortcut="3" 
                  accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                >
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-6 items-start p-8 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] hover:shadow-xl transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform">{i+1}</div>
                        <span className="text-slate-700 dark:text-slate-300 font-black text-lg leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>

                <CollapsibleSection 
                  id="references-section" 
                  title="المصادر والأكواد المرجعية" 
                  isOpen={openSections.references} 
                  onToggle={() => toggleSection('references')} 
                  shortcut="4" 
                  accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13" /></svg>}
                >
                   <div className="flex flex-wrap gap-4" role="list">
                    {result.references.map((ref, i) => (
                      <button key={i} onClick={() => handleCopyRef(ref, i)} className={`inline-flex items-center gap-3 px-8 py-5 rounded-[2rem] text-sm font-black border transition-all shadow-sm ${copiedRefIndex === i ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100'}`} aria-label={`Copy reference: ${ref}`}>
                        {copiedRefIndex === i ? 'تم النسخ!' : ref}
                        <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection 
                  id="tasks-section" 
                  title="المهام والخطوات الإجرائية" 
                  description="قائمة مرجعية لمتابعة الخطوات التصحيحية اللازمة للمشروع."
                  isOpen={openSections.tasks} 
                  onToggle={() => toggleSection('tasks')} 
                  shortcut="5" 
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4" /></svg>}
                >
                  <div className="space-y-8">
                    <form onSubmit={addTask} className="flex gap-4">
                      <input 
                        type="text" 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="إضافة مهمة جديدة..."
                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 outline-none"
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">إضافة</button>
                    </form>

                    <div className="grid grid-cols-1 gap-4">
                      {tasks.map((task) => (
                        <div key={task.id} className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all ${task.completed ? 'bg-emerald-50/30 border-emerald-100 dark:border-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                          >
                            {task.completed && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <span className={`flex-1 text-lg font-bold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.text}
                          </span>
                          <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl flex items-center justify-between">
                       <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">إنجاز المهام</span>
                       <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {tasks.filter(t => t.completed).length} من {tasks.length}
                          </span>
                          <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${(tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100}%` }}></div>
                          </div>
                       </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection 
                  id="faq-section" 
                  title="الأسئلة الشائعة حول الامتثال" 
                  description="إجابات سريعة حول أكثر النقاط تساؤلاً في كود البناء السعودي."
                  isOpen={openSections.faq} 
                  onToggle={() => toggleSection('faq')} 
                  shortcut="6" 
                  accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                >
                  <div className="space-y-6">
                    {[
                      { q: "ما هي المتطلبات الأساسية لمقاومة الحريق في المباني السكنية؟", a: "يتطلب الكود السعودي توفير مخارج طوارئ محددة، واستخدام مواد بناء مقاومة للحريق حسب تصنيف المبنى، وتركيب كاشفات دخان ونظم إنذار مربوطة بلوحة تحكم." },
                      { q: "هل يشمل التقرير بنود كود الطاقة؟", a: "نعم، يقوم الذكاء الاصطناعي بمراجعة قيم العزل الحراري (U-values) ونوعية الزجاج المستخدم لضمان كفاءة استهلاك الطاقة." },
                      { q: "كيف يتم تحديد درجة الامتثال النهائية؟", a: "يتم احتساب الدرجة بناءً على وزن كل بند في الكود؛ البنود الحرجة المتعلقة بالسلامة لها وزن أكبر وتؤثر بشكل مباشر على حالة الامتثال." }
                    ].map((item, i) => (
                      <div key={i} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-100">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {item.q}
                        </h4>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed pr-5">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>

              <footer className="mt-24 pt-16 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 justify-center print:hidden relative">
                 <button onClick={() => window.print()} className="flex items-center gap-4 bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all">
                    تحميل كـ PDF
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
                 
                 <div className="relative" ref={shareMenuRef}>
                   <button 
                     onClick={() => setShowShareMenu(!showShareMenu)}
                     className="flex items-center gap-4 bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-700 shadow-xl transition-all"
                   >
                     مشاركة التقرير
                     <svg className={`w-6 h-6 transition-transform duration-300 ${showShareMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                   </button>

                   <div className={`absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-4 transition-all duration-500 origin-bottom z-[70] ${showShareMenu ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
                      <div className="space-y-2">
                        <button 
                          onClick={handleCopyLink}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="font-black text-sm">{copySuccess ? 'تم النسخ!' : 'نسخ الرابط المباشر'}</span>
                          </div>
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <a 
                          href={`mailto:?subject=تقرير امتثال هندسي: #${Math.random().toString(36).substr(2,6).toUpperCase()}&body=يمكنك الاطلاع على التقرير الفني عبر الرابط التالي: ${window.location.href}`}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg>
                            </div>
                            <span className="font-black text-sm">إرسال عبر البريد</span>
                          </div>
                        </a>

                        <a 
                          href={`https://wa.me/?text=${encodeURIComponent(`اطلع على تقرير الامتثال الهندسي الجديد: ${window.location.href}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </div>
                            <span className="font-black text-sm">واتساب</span>
                          </div>
                        </a>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 rotate-45 border-r border-b border-slate-100 dark:border-slate-800"></div>
                   </div>
                 </div>
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

      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">هل أنت متأكد من الحذف؟</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">سيتم مسح كافة المخططّات المرفوعة حالياً.</p>
            <div className="flex gap-4">
              <button onClick={() => { setImages([]); setShowConfirmClear(false); }} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-sm transition-all hover:bg-rose-700">تأكيد الحذف</button>
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700">إلغاء [ESC]</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
