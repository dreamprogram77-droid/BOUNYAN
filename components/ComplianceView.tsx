
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
            <div className="flex items-center gap-3">
              <h3 className={`font-black text-2xl md:text-3xl transition-all duration-500 ${
                isOpen ? 'text-slate-900 dark:text-white translate-x-[-4px]' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {title}
              </h3>
              {accentIcon && (
                <div className={`relative transition-all duration-500 transform ${
                  isOpen ? 'opacity-100 scale-110 rotate-0 text-indigo-500' : 'opacity-40 scale-75 -rotate-12 text-slate-300'
                } group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 group-hover:text-indigo-600 ${isClicked ? 'animate-ping text-indigo-600' : ''}`}>
                  {accentIcon}
                </div>
              )}
              {shortcut && <ShortcutBadge keys={shortcut} />}
            </div>
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copiedRecIndex, setCopiedRecIndex] = useState<number | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  // State for sharing configuration
  const [shareConfig, setShareConfig] = useState({
    sections: {
      summary: true,
      details: true,
      recommendations: true,
      references: true,
    },
    expiration: '24h' // 1h, 24h, 7d, never
  });

  // State for editing findings
  const [editingFindingIndex, setEditingFindingIndex] = useState<number | null>(null);
  const [tempFindingText, setTempFindingText] = useState('');

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

  // Auto-dismiss error banner
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

      if (e.key === 'Escape') {
        setShowConfirmClear(false);
        setEditingFindingIndex(null);
        setShowShareModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, loading, uploadingFiles]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const cancelUploads = () => {
    activeReaders.current.forEach(reader => reader.abort());
    activeReaders.current = [];
    setUploadingFiles([]);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) { 
        setError(`نوع ملف غير صالح: المستند "${file.name}" غير مدعوم.`); 
        return false; 
      }
      if (file.size > MAX_FILE_SIZE) { 
        setError(`حجم الملف كبير جداً: المستند "${file.name}" يتجاوز 10 ميجابايت.`); 
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
            setUploadingFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: Math.round((event.loaded / event.total) * 100) } : f));
          }
        };

        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setImages(prev => [...prev, { base64, mimeType: file.type, name: file.name }]);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          // Remove reader from active list
          activeReaders.current = activeReaders.current.filter(r => r !== reader);
          resolve();
        };

        reader.onerror = () => {
          if (reader.error?.name !== 'AbortError') {
            setError(`فشل رفع المستند: ${file.name}`);
          }
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

  const handleCopyRec = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRecIndex(index);
      setTimeout(() => setCopiedRecIndex(null), 1500);
    });
  };

  const handleShareReport = () => {
    const reportId = Math.random().toString(36).substring(2, 12).toUpperCase();
    // Build query params based on config
    const sections = Object.entries(shareConfig.sections)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
      .join(',');
    const link = `${window.location.origin}/report/${reportId}?s=${sections}&exp=${shareConfig.expiration}`;
    setGeneratedLink(link);
    setIsLinkCopied(false);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    });
  };

  const startEditFinding = (index: number) => {
    if (!result?.findings) return;
    setEditingFindingIndex(index);
    setTempFindingText(result.findings[index].text);
  };

  const saveFindingEdit = () => {
    if (result && result.findings && editingFindingIndex !== null) {
      const newFindings = [...result.findings];
      newFindings[editingFindingIndex] = { ...newFindings[editingFindingIndex], text: tempFindingText };
      setResult({ ...result, findings: newFindings });
      setEditingFindingIndex(null);
    }
  };

  const handleScrollToDetails = () => {
    setOpenSections(prev => ({ ...prev, details: true }));
    setTimeout(() => {
      const element = document.getElementById('details-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const COLORS = ['#4f46e5', '#f1f5f9'];
  const chartData = result ? [{ name: 'امتثال', value: result.score }, { name: 'فجوة', value: 100 - result.score }] : [];

  const overallUploadProgress = uploadingFiles.length > 0 
    ? Math.round(uploadingFiles.reduce((acc, curr) => acc + curr.progress, 0) / uploadingFiles.length)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-24">
      
      {/* Sidebar Upload */}
      <aside className="lg:col-span-4 space-y-8 print:hidden sticky top-28">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden">
          
          {/* Error Banner */}
          {error && (
            <div className="absolute top-0 left-0 right-0 z-50 animate-in slide-in-from-top-full duration-500">
              <div className="mx-6 mt-6 p-4 bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-800 rounded-2xl shadow-xl backdrop-blur-sm flex items-center justify-between group/error">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-[11px] font-black text-rose-700 dark:text-rose-200 leading-tight pr-1">
                    {error}
                  </p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-800 rounded-lg transition-all shrink-0"
                  title="إغلاق التنبيه"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Consolidated Progress Bar - At the very top of the Sidebar area */}
          {uploadingFiles.length > 0 && (
            <div className="mb-10 p-7 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl animate-in fade-in slide-in-from-top-4 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black animate-pulse shadow-lg shadow-indigo-200 dark:shadow-none">
                    {uploadingFiles.length}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mb-1">جاري الرفع...</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Multi-Upload Active</span>
                  </div>
                </div>
                <button 
                  onClick={cancelUploads}
                  className="px-3 py-2 bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all group/cancel flex items-center gap-2 border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95"
                  title="إلغاء جميع عمليات الرفع"
                >
                  <span className="text-[10px] font-black">إلغاء الكل</span>
                  <svg className="w-4 h-4 transition-transform group-hover/cancel:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-700 ease-out relative" 
                  style={{ width: `${overallUploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite_linear]"></div>
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <div className="flex items-center gap-1.5">
                   <span className="text-[10px] font-black text-slate-500">الإجمالي:</span>
                   <span className="text-[10px] font-black text-indigo-600">{overallUploadProgress}%</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 italic">نظام المعالجة الفوري نشط</span>
              </div>
            </div>
          )}

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
            className={`group rounded-[2.5rem] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[350px] ${
              isDragging 
                ? 'bg-gradient-to-br from-indigo-100/40 via-blue-50/40 to-emerald-50/40 dark:from-indigo-900/40 dark:via-blue-900/30 dark:to-slate-900/40 marching-ants-border scale-[1.05] shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-900/50' 
                : 'bg-slate-50/30 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400'
            }`}
          >
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-30" />
            
            <div className={`w-28 h-28 rounded-3xl shadow-xl border flex items-center justify-center mb-8 transition-all duration-700 ${
              isDragging 
                ? 'bg-indigo-600 text-white rotate-[15deg] scale-125 border-indigo-300 ring-8 ring-indigo-500/20 animate-pulse' 
                : 'bg-white dark:bg-slate-900 text-indigo-500 border-slate-50 dark:border-slate-800 group-hover:scale-110'
            }`}>
              <svg className={`w-14 h-14 ${isDragging ? 'animate-bounce' : 'group-hover:translate-y-[-4px] transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            
            <div className="relative z-10 transition-all duration-500">
              <p className={`font-black text-2xl mb-2 transition-all duration-300 ${isDragging ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-800 dark:text-white'}`}>
                {isDragging ? 'أفلت الملفات الآن!' : 'ارفع المخططات'}
              </p>
              <p className={`text-sm font-bold transition-all duration-300 ${isDragging ? 'text-indigo-500/70 dark:text-indigo-300/70 opacity-100' : 'text-slate-400 opacity-70'}`}>
                {isDragging ? 'سيتم التعرف على التفاصيل الهندسية' : 'اسحب وأفلت أو انقر للاختيار'}
              </p>
            </div>

            {isDragging && (
              <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none ring-inset ring-4 ring-indigo-500/20"></div>
            )}
          </div>

          {(images.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  المرفقات ({images.length + uploadingFiles.length})
                </h3>
                {images.length > 0 && (
                  <button onClick={() => setShowConfirmClear(true)} className="text-[10px] font-bold text-rose-500 hover:underline transition-all">حذف الكل</button>
                )}
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 opacity-60">
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
                  <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 group relative hover:shadow-lg transition-all transform hover:scale-[1.02] animate-in fade-in slide-in-from-right-2">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-50 dark:border-slate-600 shrink-0">
                      <img src={`data:${img.mimeType};base64,${img.base64}`} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={img.name}>{img.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{(img.base64.length * 0.75 / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={() => removeImage(index)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all group/btn"
                      title="حذف هذا المخطط"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover/btn:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || images.length === 0 || uploadingFiles.length > 0}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 mt-8 relative overflow-hidden group/btn"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                    <span>جاري التحليل...</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
                    <span className="relative z-10">بدء الفحص الذكي</span>
                    <svg className="w-5 h-5 relative z-10 transition-transform group-hover/btn:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Results Area */}
      <main className="lg:col-span-8 space-y-10">
        {!result && !loading && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-8 text-slate-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">بانتظار المخططات الهندسية</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">ارفع المخططات في القائمة الجانبية ثم اضغط على "بدء الفحص الذكي" للحصول على تقرير الامتثال الفوري.</p>
          </div>
        )}

        {result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex justify-end gap-3 print:hidden">
              <button 
                onClick={handleShareReport}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                مشاركة التقرير
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                طباعة / PDF
              </button>
            </div>

            <CollapsibleSection
              id="summary-section"
              title="ملخص الامتثال"
              isOpen={openSections.summary}
              onToggle={() => toggleSection('summary')}
              accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{result.score}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">معدل الامتثال</span>
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl font-black text-sm ${
                        result.status === 'compliant' ? 'bg-emerald-100 text-emerald-700' :
                        result.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {result.status === 'compliant' ? 'مطابق للكود' : result.status === 'warning' ? 'تنبيهات هامة' : 'غير مطابق'}
                      </div>
                   </div>
                   <p className="text-lg font-medium leading-loose text-slate-600 dark:text-slate-300">{result.executiveSummary}</p>
                   
                   <button 
                     onClick={handleScrollToDetails}
                     className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-xs font-black hover:bg-indigo-600 transition-all shadow-xl group/btn-scroll"
                   >
                     <span>عرض الملاحظات التفصيلية</span>
                     <svg className="w-4 h-4 transition-transform group-hover/btn-scroll:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="details-section"
              title="التفاصيل والملاحظات"
              isOpen={openSections.details}
              onToggle={() => toggleSection('details')}
              accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            >
              <div className="space-y-8">
                <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed">{result.details}</div>
                {result.findings && result.findings.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {result.findings.map((finding, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-400 transition-all relative">
                        <div className="flex items-start justify-between mb-4">
                           <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-200 transition-transform group-hover:scale-110">
                             {finding.imageIndex !== undefined ? finding.imageIndex + 1 : idx + 1}
                           </span>
                           <button 
                             onClick={() => startEditFinding(idx)}
                             className="opacity-0 group-hover:opacity-100 p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                             title="تعديل الملاحظة"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{finding.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="recommendations-section"
              title="توصيات التحسين"
              isOpen={openSections.recommendations}
              onToggle={() => toggleSection('recommendations')}
              accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            >
              <ul className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 mt-1 transition-transform group-hover:scale-125">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-4">
                      <span className="text-lg font-medium text-slate-700 dark:text-slate-200">{rec}</span>
                      <button 
                        onClick={() => handleCopyRec(rec, idx)}
                        className={`shrink-0 p-2 rounded-xl transition-all ${copiedRecIndex === idx ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100'}`}
                        title="نسخ التوصية"
                      >
                        {copiedRecIndex === idx ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            <CollapsibleSection
              id="references-section"
              title="المراجع النظامية (SBC)"
              isOpen={openSections.references}
              onToggle={() => toggleSection('references')}
              accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            >
              <div className="flex flex-wrap gap-3">
                {result.references.map((ref, idx) => (
                  <div key={idx} className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-110 hover:-rotate-2 transition-all cursor-pointer">{ref}</div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              id="faq-section" 
              title="الأسئلة الشائعة حول الامتثال" 
              description="إجابات سريعة حول أكثر النقاط تساؤلاً في كود البناء السعودي."
              isOpen={openSections.faq} 
              onToggle={() => toggleSection('faq')} 
              accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" /></svg>}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            >
              <div className="space-y-6">
                {[
                  { q: "ما هي المتطلبات الأساسية لمقاومة الحريق في المباني السكنية؟", a: "يتطلب الكود السعودي توفير مخارج طوارئ محددة، واستخدام مواد بناء مقاومة للحريق حسب تصنيف المبنى، وتركيب كاشفات دخان ونظم إنذار مربوطة بلوحة تحكم." },
                  { q: "هل يشمل التقرير بنود كود الطاقة؟", a: "نعم، يقوم الذكاء الاصطناعي بمراجعة قيم العزل الحراري (U-values) ونوعية الزجاج المستخدم لضمان كفاءة استهلاك الطاقة." },
                  { q: "كيف يتم تحديد درجة الامتثال النهائية؟", a: "يتم احتساب الدرجة بناءً على وزن كل بند في الكود؛ البنود الحرجة المتعلقة بالسلامة لها وزن أكبر وتؤثر بشكل مباشر على حالة الامتثال." }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-100 group/faq">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-3 transition-transform group-hover/faq:translate-x-[-8px]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
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
        )}

        {/* Tasks Section */}
        <div id="tasks-section" className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">قائمة مهام التدقيق</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">Checklist</span>
           </div>
           
           <form onSubmit={addTask} className="flex gap-4 mb-8">
             <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="أضف مهمة تدقيق جديدة..." className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all font-medium dark:text-white" />
             <button type="submit" className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-90">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
             </button>
           </form>

           <div className="space-y-3">
             {tasks.map((task) => (
               <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                 <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                   {task.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                 </button>
                 <span className={`flex-1 font-bold text-sm ${task.completed ? 'text-slate-300 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{task.text}</span>
                 <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
             ))}
           </div>
        </div>
      </main>

      {/* Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row gap-10">
            <div className="flex-1">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center mb-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">مشاركة التقرير الفني</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">خصص الأقسام التي ترغب في مشاركتها وحدد مدة صلاحية الرابط لضمان أمان بياناتك.</p>
              
              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">الأقسام المشمولة:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'summary', label: 'الملخص التنفيذي' },
                    { id: 'details', label: 'التفاصيل والنتائج' },
                    { id: 'recommendations', label: 'توصيات التحسين' },
                    { id: 'references', label: 'المراجع النظامية' },
                  ].map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        const newSections = { ...shareConfig.sections, [s.id as keyof typeof shareConfig.sections]: !shareConfig.sections[s.id as keyof typeof shareConfig.sections] };
                        setShareConfig({ ...shareConfig, sections: newSections });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs font-bold ${
                        shareConfig.sections[s.id as keyof typeof shareConfig.sections] 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${shareConfig.sections[s.id as keyof typeof shareConfig.sections] ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {shareConfig.sections[s.id as keyof typeof shareConfig.sections] && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">صلاحية الرابط:</h4>
                <div className="flex gap-2">
                  {[
                    { id: '1h', label: 'ساعة واحدة' },
                    { id: '24h', label: 'يوم كامل' },
                    { id: '7d', label: 'أسبوع' },
                    { id: 'never', label: 'دائم' },
                  ].map((exp) => (
                    <button 
                      key={exp.id}
                      onClick={() => setShareConfig({ ...shareConfig, expiration: exp.id })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                        shareConfig.expiration === exp.id 
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:w-64 flex flex-col justify-end">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">رابط المشاركة:</p>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden">
                  <p className="text-[9px] font-mono font-bold text-indigo-600 truncate">{generatedLink}</p>
                </div>
                <button 
                  onClick={copyShareLink}
                  className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    isLinkCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                  }`}
                >
                  {isLinkCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      تم النسخ!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      نسخ الرابط
                    </>
                  )}
                </button>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs hover:bg-slate-200 transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Finding Modal */}
      {editingFindingIndex !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">تعديل الملاحظة الفنية</h3>
            <textarea 
              value={tempFindingText}
              onChange={(e) => setTempFindingText(e.target.value)}
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 transition-all font-medium text-lg leading-relaxed dark:text-white mb-8"
            />
            <div className="flex gap-4">
              <button onClick={saveFindingEdit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">حفظ التعديلات</button>
              <button onClick={() => setEditingFindingIndex(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-10 rounded-[3rem] text-center shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">حذف جميع المخططات؟</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 text-center px-4">لا يمكن التراجع عن هذا الإجراء، سيتم مسح كافة البيانات المرفوعة.</p>
            <div className="flex gap-4">
              <button onClick={() => { setImages([]); setShowConfirmClear(false); setResult(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all">تأكيد الحذف</button>
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
