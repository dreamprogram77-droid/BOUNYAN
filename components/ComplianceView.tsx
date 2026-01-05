
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
                } group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 ${isClicked ? 'animate-ping text-indigo-600' : ''}`}>
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedRefIndex, setCopiedRefIndex] = useState<number | null>(null);
  const [copiedRecIndex, setCopiedRecIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [activeSection, setActiveSection] = useState('summary-section');
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  
  // Finding Editing State
  const [editingFindingIdx, setEditingFindingIdx] = useState<number | null>(null);
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
        setEditingFindingIdx(null);
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

  const handleCopyRec = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRecIndex(index);
      setTimeout(() => setCopiedRecIndex(null), 2000);
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

  const handleStartEditingFinding = (idx: number, text: string) => {
    setEditingFindingIdx(idx);
    setTempFindingText(text);
  };

  const handleSaveFindingUpdate = () => {
    if (editingFindingIdx === null || !result) return;
    const updatedFindings = [...(result.findings || [])];
    updatedFindings[editingFindingIdx] = {
      ...updatedFindings[editingFindingIdx],
      text: tempFindingText
    };
    setResult({ ...result, findings: updatedFindings });
    setEditingFindingIdx(null);
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
                  <div key={index} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-