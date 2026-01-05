
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

          {/* Consolidated Progress Bar */}
          {uploadingFiles.length > 0 && (
            <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black animate-pulse">
                    {uploadingFiles.length}
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">جاري رفع المستندات...</span>
                </div>
                <button 
                  onClick={cancelUploads}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all group/cancel"
                  title="إلغاء الرفع"
                >
                  <svg className="w-5 h-5 transition-transform group-hover/cancel:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                  style={{ width: `${overallUploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-slate-400">الإجمالي: {overallUploadProgress}%</span>
                <span className="text-[10px] font-bold text-indigo-600 animate-pulse">معالجة فورية</span>
              </div>
            </div>
          )}

          {(images.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  المرفقات ({images.length + uploadingFiles.length})
                </h3>
                {images.length > 0 && (
                  <button onClick={() => setShowConfirmClear(true)} className="text-[10px] font-bold text-rose-500 hover:underline">حذف الكل</button>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C