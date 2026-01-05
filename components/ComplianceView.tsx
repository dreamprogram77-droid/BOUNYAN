
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { analyzeCompliance, editBlueprintImage } from '../services/geminiService';
import { AnalysisResult, ImageData, DetailedFinding } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

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
  const [isHovered, setIsHovered] = useState(false);
  const contentId = `content-${id}`;

  const handleToggle = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 500);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            <div className="flex items-center gap-4">
              <h3 className={`font-black text-2xl md:text-3xl transition-all duration-500 ${
                isOpen ? 'text-slate-900 dark:text-white translate-x-[-4px]' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {title}
              </h3>
              {accentIcon && (
                <div className="relative flex items-center justify-center">
                  <div className={`transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${
                    isOpen ? 'opacity-100 scale-150 rotate-0 text-indigo-500' : 'opacity-40 scale-100 -rotate-12 text-slate-300'
                  } group-hover:opacity-100 group-hover:scale-[2.5] group-hover:rotate-[20deg] group-hover:text-indigo-600 ${
                    isClicked ? 'animate-[wiggle_0.4s_ease-in-out_infinite] scale-[3.2] text-indigo-400 drop-shadow-[0_0_25px_rgba(79,70,229,0.8)]' : ''
                  }`}>
                    {accentIcon}
                  </div>
                  <div className={`absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full transition-all duration-1000 -z-10 ${isHovered || isOpen ? 'scale-[6] opacity-100' : 'scale-0 opacity-0'}`}></div>
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
  const [fileSearch, setFileSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedRecIndex, setCopiedRecIndex] = useState<number | null>(null);
  const [copiedReferenceIndex, setCopiedReferenceIndex] = useState<number | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  // Image Editing States
  const [editImage, setEditImage] = useState<ImageData | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editScale, setEditScale] = useState(1);

  // AI Processing Stages State
  const [analysisStage, setAnalysisStage] = useState(0);
  const analysisStages = [
    "جاري قراءة المخططات الهندسية...",
    "التحقق من بنود كود البناء السعودي (SBC)...",
    "فحص معايير السلامة ومقاومة الحريق...",
    "تحليل كفاءة الطاقة والواجهات...",
    "توليد التوصيات الفنية والحلول البديلة...",
    "إعداد التقرير النهائي الموثق..."
  ];

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setAnalysisStage(prev => (prev + 1) % analysisStages.length);
      }, 3000);
    } else {
      setAnalysisStage(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const [shareConfig, setShareConfig] = useState({
    reportId: '',
    sections: {
      summary: true,
      details: true,
      recommendations: true,
      references: true,
    },
    expiration: '24h', 
    passwordProtected: false,
    password: '',
    accessLevel: 'view' 
  });

  const [editingFindingIndex, setEditingFindingIndex] = useState<number | null>(null);
  const [tempFindingText, setTempFindingText] = useState('');

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'مراجعة المخططات الإنشائية والتأكد من تطابق الأحمال', completed: false },
    { id: '2', text: 'التحقق من متطلبات السلامة من الحريق وكاشفات الدخان', completed: false },
    { id: '3', text: 'مراجعة عزل الواجهات حسب كود الطاقة السعودي', completed: true },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTaskText, setTempTaskText] = useState('');

  const [openSections, setOpenSections] = useState({
    summary: false,
    details: true,
    recommendations: false,
    references: false,
    tasks: true,
    faq: false,
    history: false,
    imageEditing: false,
  });

  const activeReaders = useRef<FileReader[]>([]);

  const historicalData = useMemo(() => [
    { date: 'يناير', score: 45 },
    { date: 'فبراير', score: 52 },
    { date: 'مارس', score: 68 },
    { date: 'أبريل', score: 75 },
    { date: 'مايو', score: result?.score || 85 },
  ], [result?.score]);

  const filteredImages = useMemo(() => {
    if (!fileSearch.trim()) return images;
    return images.filter(img => img.name.toLowerCase().includes(fileSearch.toLowerCase()));
  }, [images, fileSearch]);

  const filteredUploadingFiles = useMemo(() => {
    if (!fileSearch.trim()) return uploadingFiles;
    return uploadingFiles.filter(file => file.name.toLowerCase().includes(fileSearch.toLowerCase()));
  }, [uploadingFiles, fileSearch]);

  const generatedLink = useMemo(() => {
    if (!shareConfig.reportId) return '';
    const sections = Object.entries(shareConfig.sections)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
      .join(',');
    
    const params = new URLSearchParams();
    params.set('s', sections);
    params.set('exp', shareConfig.expiration);
    params.set('access', shareConfig.accessLevel);
    if (shareConfig.passwordProtected && shareConfig.password) {
      params.set('pw', '1'); 
    }
    
    return `${window.location.origin}/report/${shareConfig.reportId}?${params.toString()}`;
  }, [shareConfig]);

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
        if (images.length > 0 || uploadingFiles.length > 0) setShowConfirmClear(true);
      }

      if (e.key === 'Escape') {
        setShowConfirmClear(false);
        setEditingFindingIndex(null);
        setShowShareModal(false);
        setEditingTaskId(null);
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

  const clearAllData = () => {
    cancelUploads();
    setImages([]);
    setResult(null);
    setShowConfirmClear(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) { 
        setError(`نوع ملف غير صالح: المستند "${file.name}" غير مدعوم. يرجى استخدام JPG أو PNG أو WebP.`); 
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
      setOpenSections({ ...openSections, summary: false, details: true, recommendations: true, references: true, history: true });
    } catch (err) {
      setError('حدث خطأ فني أثناء تحليل المخططات.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setEditImage({ 
          base64: (reader.result as string).split(',')[1], 
          mimeType: file.type,
          name: file.name 
        });
        setEditedImageUrl(null);
        setEditScale(1);
      };
      reader.onerror = () => setEditError('فشل في قراءة الملف.');
      reader.readAsDataURL(file);
    }
  };

  const runImageEdit = async () => {
    if (!editImage || !editPrompt) return;
    setIsEditingImage(true);
    setEditError(null);
    try {
      const res = await editBlueprintImage(editImage, editPrompt);
      if (res) {
        setEditedImageUrl(res);
      } else {
        setEditError('فشل تعديل الصورة.');
      }
    } catch (err) {
      setEditError('حدث خطأ أثناء معالجة الصورة.');
    } finally {
      setIsEditingImage(false);
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
    if (editingTaskId === id) setEditingTaskId(null);
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTempTaskText(task.text);
  };

  const saveTaskEdit = (id: string) => {
    if (!tempTaskText.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: tempTaskText } : t));
    setEditingTaskId(null);
  };

  const handleCopyRec = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRecIndex(index);
      setTimeout(() => setCopiedRecIndex(null), 1500);
    });
  };

  const handleCopyReference = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedReferenceIndex(index);
      setTimeout(() => setCopiedReferenceIndex(null), 1500);
    });
  };

  const isLink = (text: string) => {
    return text.startsWith('http://') || text.startsWith('https://');
  };

  const handleShareReport = () => {
    const reportId = Math.random().toString(36).substring(2, 12).toUpperCase();
    setShareConfig(prev => ({ ...prev, reportId }));
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'compliant':
        return { 
          color: 'emerald', 
          label: 'مطابق', 
          icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>,
          bg: 'bg-emerald-50 dark:bg-emerald-900/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-100 dark:border-emerald-900/50'
        };
      case 'warning':
        return { 
          color: 'amber', 
          label: 'تحذير', 
          icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
          bg: 'bg-amber-50 dark:bg-amber-900/30',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-100 dark:border-amber-900/50'
        };
      case 'non-compliant':
        return { 
          color: 'rose', 
          label: 'غير مطابق', 
          icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>,
          bg: 'bg-rose-50 dark:bg-rose-900/30',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-900/50'
        };
      default:
        return { 
          color: 'indigo', 
          label: 'مراجعة', 
          icon: null,
          bg: 'bg-indigo-50 dark:bg-indigo-900/30',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-100 dark:border-indigo-900/50'
        };
    }
  };

  const chartData = result ? [{ name: 'امتثال', value: result.score }, { name: 'فجوة', value: 100 - result.score }] : [];

  const overallUploadProgress = uploadingFiles.length > 0 
    ? Math.round(uploadingFiles.reduce((acc, curr) => acc + curr.progress, 0) / uploadingFiles.length)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-24">
      
      {/* Sidebar Upload */}
      <aside className="lg:col-span-4 space-y-8 print:hidden sticky top-28">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden">
          
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
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

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
                  className="px-3 py-2 bg-white dark:bg-slate-800 text-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all group/cancel flex items-center gap-2 border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95"
                >
                  <span className="text-[10px] font-black text-rose-500">إلغاء الكل</span>
                  <svg className="w-4 h-4 text-rose-500 transition-transform group-hover/cancel:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                ? 'bg-indigo-100/50 dark:bg-indigo-900/30 marching-ants-border scale-[1.02] shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-900/50 border-transparent' 
                : 'bg-slate-50/30 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-700'
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
                {isDragging ? 'أفلت المخططات هنا!' : 'ارفع المخططات'}
              </p>
              <p className={`text-sm font-bold transition-all duration-300 ${isDragging ? 'text-indigo-500/70 dark:text-indigo-300/70 opacity-100' : 'text-slate-400 opacity-70'}`}>
                {isDragging ? 'التطبيق جاهز لاستقبال ملفاتك' : 'اسحب وأفلت أو انقر للاختيار'}
              </p>
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isDragging ? 'bg-indigo-600 text-white border-indigo-400 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                 JPG, PNG, WebP Supported
              </div>
            </div>

            {isDragging && (
              <div className="absolute inset-0 border-[10px] border-indigo-500/10 pointer-events-none rounded-[2.5rem] animate-pulse"></div>
            )}
          </div>

          {(images.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  المرفقات ({images.length + uploadingFiles.length})
                </h3>
                {(images.length > 0 || uploadingFiles.length > 0) && (
                  <button onClick={() => setShowConfirmClear(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors group/clear">
                    <svg className="w-3.5 h-3.5 transition-transform group-hover/clear:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    حذف الكل
                  </button>
                )}
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="بحث في المرفقات..."
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold dark:text-white"
                />
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUploadingFiles.map((file, idx) => (
                  <div 
                    key={file.id} 
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 opacity-60 animate-in fade-in slide-in-from-right-4 duration-300 fill-mode-both"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 truncate w-3/4 transition-all duration-300">{file.name}</span>
                      <span className="text-[10px] font-black text-indigo-600">{file.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                    </div>
                  </div>
                ))}

                {filteredImages.map((img, index) => (
                  <div 
                    key={index} 
                    style={{ animationDelay: `${(uploadingFiles.length + index) * 50}ms` }}
                    className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 group relative hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all transform hover:scale-[1.02] animate-in fade-in slide-in-from-right-4 duration-300 fill-mode-both overflow-hidden"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-50 dark:border-slate-600 shrink-0">
                      <img src={`data:${img.mimeType};base64,${img.base64}`} alt={img.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate transition-all duration-500 group-hover:text-indigo-600 group-hover:translate-x-[-2px]">{img.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{(img.base64.length * 0.75 / 1024).toFixed(1)} KB</p>
                    </div>
                    <button 
                      onClick={() => removeImage(index)} 
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all group/del active:scale-90"
                      title="حذف المخطط"
                    >
                      <svg className="w-4 h-4 transition-all duration-500 group-hover/del:rotate-90 group-hover/del:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                
                {(fileSearch && filteredImages.length === 0 && filteredUploadingFiles.length === 0) && (
                  <div className="py-10 text-center animate-in fade-in zoom-in-95">
                    <p className="text-xs font-bold text-slate-400 italic">لا توجد ملفات تطابق البحث...</p>
                  </div>
                )}
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
                    <span>بدء الفحص الذكي</span>
                    <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 md:p-16 border border-indigo-100 dark:border-indigo-900/40 shadow-2xl shadow-indigo-100/30 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
             <div className="absolute inset-0 bg-indigo-50/20 dark:bg-indigo-900/10 pointer-events-none"></div>
             <div className="relative z-10 text-center space-y-10">
               <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 dark:shadow-none relative">
                  <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-400/30 animate-ping"></div>
               </div>

               <div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">بُنيان يقوم بالتحليل الآن</h3>
                 <div className="h-8 overflow-hidden relative max-w-md mx-auto">
                    <div 
                      className="transition-all duration-700 transform flex flex-col items-center"
                      style={{ transform: `translateY(-${analysisStage * 2}rem)` }}
                    >
                      {analysisStages.map((stage, idx) => (
                        <p key={idx} className="h-8 flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                          {stage}
                        </p>
                      ))}
                    </div>
                 </div>
               </div>

               <div className="max-w-xl mx-auto">
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                   <div 
                    className="h-full bg-indigo-600 rounded-full relative transition-all duration-1000 ease-out"
                    style={{ width: `${((analysisStage + 1) / analysisStages.length) * 100}%` }}
                   >
                     <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite_linear]"></div>
                   </div>
                 </div>
                 <div className="mt-4 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                   <span>مرحلة {analysisStage + 1} من {analysisStages.length}</span>
                   <span>نظام الذكاء الاصطناعي نشط</span>
                 </div>
               </div>

               <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 opacity-60">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 tracking-tighter">SBC Engine V3</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                    <span className="text-[9px] font-black text-slate-400 tracking-tighter">Vision Model L4</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150"></div>
                    <span className="text-[9px] font-black text-slate-400 tracking-tighter">Real-time KSA Laws</span>
                 </div>
               </div>
             </div>
          </div>
        )}

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
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-12 border border-indigo-100 dark:border-indigo-900/40 shadow-2xl shadow-indigo-100/30 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full blur-3xl opacity-50 -z-10 group-hover:scale-110 transition-transform duration-1000"></div>
               
               <div className="flex flex-col md:flex-row items-start gap-10">
                  <div className="shrink-0 relative self-center">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={chartData} 
                            innerRadius={65} 
                            outerRadius={85} 
                            paddingAngle={5} 
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? (result.status === 'non-compliant' ? '#f43f5e' : result.status === 'warning' ? '#f59e0b' : '#4f46e5') : '#f1f5f9'} 
                                className="transition-all duration-1000"
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{result.score}%</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">SBC Score</span>
                    </div>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border ${
                      result.status === 'compliant' ? 'bg-emerald-500 text-white border-emerald-400' :
                      result.status === 'warning' ? 'bg-amber-500 text-white border-amber-400' : 'bg-rose-500 text-white border-rose-400'
                    }`}>
                      {result.status === 'compliant' ? 'مطابق' : result.status === 'warning' ? 'تحذير' : 'غير مطابق'}
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 text-right">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">الملخص التنفيذي</h2>
                      <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium italic">
                        "{result.executiveSummary}"
                      </p>
                    </div>

                    {result.findings && result.findings.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">أبرز الملاحظات الهندسية</h4>
                        </div>
                        <ul className="space-y-2">
                          {result.findings.slice(0, 2).map((f, i) => (
                            <li key={i} className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-start gap-2">
                              <span className="text-indigo-600">•</span>
                              <span className="truncate">{f.text}</span>
                            </li>
                          ))}
                          {result.findings.length > 2 && (
                            <li className="text-[10px] font-black text-indigo-500/70 mr-4">+{result.findings.length - 2} ملاحظة إضافية في التقرير المفصل</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1">الملاحظات</div>
                         <div className="text-2xl font-black text-indigo-600">{result.findings?.length || 0}</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1">التوصيات</div>
                         <div className="text-2xl font-black text-indigo-600">{result.recommendations.length}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <div className="text-[10px] font-black text-slate-400 uppercase mb-1">المراجع</div>
                         <div className="text-2xl font-black text-indigo-600">{result.references.length}</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <button 
                onClick={handleShareReport}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                مشاركة التقرير
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                طباعة / PDF
              </button>
            </div>

            <div className="space-y-6">
              <CollapsibleSection
                id="history-section"
                title="تطور الامتثال الزمني"
                description="مخطط بياني يوضح تحسن نسبة الامتثال عبر مراجعات المشروع المختلفة."
                isOpen={openSections.history}
                onToggle={() => toggleSection('history')}
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              >
                <div className="h-80 w-full bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '16px', 
                          border: 'none', 
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                id="details-section"
                title="التفاصيل والملاحظات الفنية"
                isOpen={openSections.details}
                onToggle={() => toggleSection('details')}
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              >
                <div className="space-y-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap">{result.details}</div>
                  {result.findings && result.findings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {result.findings.map((finding, idx) => {
                        const status = getStatusInfo(finding.status);
                        return (
                          <div 
                            key={idx} 
                            className={`bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/50 p-7 rounded-2xl border ${status.border} group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all relative shadow-sm hover:shadow-lg transform hover:-translate-y-1 overflow-hidden`}
                          >
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${status.bg} group-hover:bg-indigo-500 transition-colors`}></div>
                            <div className="flex items-start justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <span className="bg-indigo-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-200 transition-all group-hover:scale-110 group-hover:rotate-6">
                                   {finding.imageIndex !== undefined ? finding.imageIndex + 1 : idx + 1}
                                 </span>
                                 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${status.bg} ${status.text} text-[10px] font-black uppercase tracking-widest`}>
                                   {status.icon}
                                   {status.label}
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                 {finding.category && (
                                   <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                     {finding.category}
                                   </span>
                                 )}
                                 <button 
                                   onClick={() => startEditFinding(idx)}
                                   className="opacity-0 group-hover:opacity-100 p-2 text-indigo-500 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                   title="تعديل الملاحظة"
                                 >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                               </div>
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed pr-2">
                              {finding.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                id="recommendations-section"
                title="توصيات التحسين المقترحة"
                isOpen={openSections.recommendations}
                onToggle={() => toggleSection('recommendations')}
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
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
                          className={`shrink-0 p-2 rounded-xl transition-all ${copiedRecIndex === idx ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 active:scale-90'}`}
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
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              >
                <div className="flex flex-wrap gap-3">
                  {result.references.map((ref, idx) => {
                    const isUrl = isLink(ref);
                    return (
                      <div key={idx} className="relative group">
                        {isUrl ? (
                          <div className="flex items-center gap-1">
                            <a 
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 border border-transparent hover:border-indigo-400 active:scale-95"
                            >
                              <span className="max-w-[150px] truncate">{ref}</span>
                              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <button 
                              onClick={() => handleCopyReference(ref, idx)}
                              className={`p-3 rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90 ${copiedReferenceIndex === idx ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                              title="نسخ الرابط"
                            >
                              {copiedReferenceIndex === idx ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleCopyReference(ref, idx)}
                            className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-110 hover:-rotate-1 transition-all cursor-pointer flex items-center gap-3 border border-transparent active:scale-95 ${
                              copiedReferenceIndex === idx 
                                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                                : 'bg-slate-900 dark:bg-slate-800 text-white hover:border-indigo-400'
                            }`}
                          >
                            {ref}
                            {copiedReferenceIndex === idx ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                id="image-editing-section"
                title="مهام تعديل الصور"
                description="استخدم الذكاء الاصطناعي لتعديل المخططات، إضافة مسارات، أو توضيح تفاصيل هندسية مباشرة."
                isOpen={openSections.imageEditing}
                onToggle={() => toggleSection('imageEditing')}
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className={`relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-500 overflow-hidden ${editImage ? 'bg-indigo-50/20 dark:bg-indigo-900/10 border-indigo-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 hover:border-indigo-400'}`}>
                      <input type="file" accept="image/*" onChange={handleEditImageFile} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      {editImage ? (
                        <div className="space-y-4">
                           <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                           </div>
                           <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{editImage.name}</p>
                           <button onClick={(e) => { e.stopPropagation(); setEditImage(null); }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">إلغاء الصورة</button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-white dark:bg-slate-900 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-black">ارفع الصورة المراد تعديلها</p>
                            <p className="text-slate-400 text-xs mt-1">تعديل المخططات، إضافة توضيحات، أو رسم مسارات.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="أدخل وصفاً دقيقاً للتعديل المطلوب... (مثلاً: أضف مسار هروب باللون الأخضر يربط المكاتب بالمخرج الرئيسي)"
                        className="w-full p-6 h-36 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-sm leading-relaxed dark:text-white"
                      />
                    </div>

                    <button
                      onClick={runImageEdit}
                      disabled={isEditingImage || !editImage || !editPrompt.trim()}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
                    >
                      {isEditingImage ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>جاري التعديل...</span>
                        </>
                      ) : (
                        <>
                          <span>تنفيذ التعديل الذكي</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </>
                      )}
                    </button>
                    {editError && <p className="text-center text-xs font-bold text-rose-500">{editError}</p>}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group/preview">
                    {editedImageUrl ? (
                      <div className="w-full h-full relative">
                         <img 
                          src={editedImageUrl} 
                          alt="المعاينة المعدلة" 
                          className="w-full h-full object-contain rounded-2xl transition-transform duration-500 cursor-zoom-in" 
                          style={{ transform: `scale(${editScale})` }}
                          onClick={() => setEditScale(editScale === 1 ? 1.5 : 1)}
                         />
                         <div className="absolute bottom-4 left-4 flex gap-2">
                           <a href={editedImageUrl} download="edited_blueprint.png" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all text-slate-700 dark:text-slate-200" title="تحميل">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           </a>
                         </div>
                      </div>
                    ) : isEditingImage ? (
                      <div className="text-center space-y-4 animate-pulse">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-500">
                           <svg className="w-10 h-10 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                        <p className="text-sm font-black text-slate-400">يتم الآن الرسم بواسطة الذكاء الاصطناعي</p>
                      </div>
                    ) : (
                      <div className="text-center opacity-30">
                        <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-sm font-bold tracking-widest uppercase">Result Preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection 
                id="faq-section" 
                title="الأسئلة الشائعة حول الامتثال" 
                description="إجابات سريعة حول أكثر النقاط تساؤلاً في كود البناء السعودي."
                isOpen={openSections.faq} 
                onToggle={() => toggleSection('faq')} 
                accentIcon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
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
                 {editingTaskId === task.id ? (
                   <div className="flex-1 flex gap-2">
                     <input 
                       type="text" 
                       autoFocus
                       value={tempTaskText}
                       onChange={(e) => setTempTaskText(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') saveTaskEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }}
                       className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-xl outline-none text-sm font-bold dark:text-white"
                     />
                     <button onClick={() => saveTaskEdit(task.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                     </button>
                     <button onClick={() => setEditingTaskId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   </div>
                 ) : (
                   <>
                     <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                       {task.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                     </button>
                     <span className={`flex-1 font-bold text-sm ${task.completed ? 'text-slate-300 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{task.text}</span>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => startEditTask(task)} className="p-2 text-slate-300 hover:text-indigo-600" title="تعديل المهمة">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                       <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500" title="حذف المهمة">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     </div>
                   </>
                 )}
               </div>
             ))}
           </div>
        </div>
      </main>

      {/* Advanced Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row gap-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex-1 space-y-8">
              <div>
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center mb-6">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">تخصيص مشاركة التقرير</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">تحكم بدقة في المحتوى والخصوصية قبل مشاركة النتائج مع العملاء أو الفريق.</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 dark:border-slate-800 pb-2">1. الأقسام المشمولة في التقرير:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'summary', label: 'الملخص التنفيذي', desc: 'نظرة عامة سريعة' },
                    { id: 'details', label: 'التفاصيل والنتائج', desc: 'كافة ملاحظات المخطط' },
                    { id: 'recommendations', label: 'توصيات التحسين', desc: 'خطوات المعالجة المقترحة' },
                    { id: 'references', label: 'المراجع النظامية', desc: 'بنود كود SBC المرتبطة' },
                  ].map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        const newSections = { ...shareConfig.sections, [s.id as keyof typeof shareConfig.sections]: !shareConfig.sections[s.id as keyof typeof shareConfig.sections] };
                        setShareConfig({ ...shareConfig, sections: newSections });
                      }}
                      className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-right active:scale-95 ${
                        shareConfig.sections[s.id as keyof typeof shareConfig.sections] 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${shareConfig.sections[s.id as keyof typeof shareConfig.sections] ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {shareConfig.sections[s.id as keyof typeof shareConfig.sections] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-xs font-black">{s.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${shareConfig.sections[s.id as keyof typeof shareConfig.sections] ? 'text-indigo-100' : 'text-slate-400'}`}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-2">2. صلاحية الرابط:</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: '1h', label: 'ساعة' },
                      { id: '24h', label: 'يوم' },
                      { id: '7d', label: 'أسبوع' },
                      { id: 'never', label: 'دائم' },
                    ].map((exp) => (
                      <button 
                        key={exp.id}
                        onClick={() => setShareConfig({ ...shareConfig, expiration: exp.id })}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 ${
                          shareConfig.expiration === exp.id 
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-2">3. مستوى الوصول:</h4>
                  <div className="flex gap-2">
                    {[
                      { id: 'view', label: 'مشاهدة فقط', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                      { id: 'comment', label: 'إضافة ملاحظات', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                    ].map((lvl) => (
                      <button 
                        key={lvl.id}
                        onClick={() => setShareConfig({ ...shareConfig, accessLevel: lvl.id })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border active:scale-95 ${
                          shareConfig.accessLevel === lvl.id 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={lvl.icon} /></svg>
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-colors ${shareConfig.passwordProtected ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">حماية الرابط بكلمة مرور</h4>
                   </div>
                   <button 
                    onClick={() => setShareConfig({ ...shareConfig, passwordProtected: !shareConfig.passwordProtected })}
                    className={`w-12 h-6 rounded-full transition-all relative ${shareConfig.passwordProtected ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shareConfig.passwordProtected ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
                {shareConfig.passwordProtected && (
                   <input 
                    type="password"
                    value={shareConfig.password}
                    onChange={(e) => setShareConfig({ ...shareConfig, password: e.target.value })}
                    placeholder="أدخل كلمة مرور قوية..."
                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 font-bold text-xs animate-in slide-in-from-top-2"
                   />
                )}
              </div>
            </div>

            <div className="md:w-72 flex flex-col justify-end">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 mb-8 flex-grow">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">معاينة رابط المشاركة:</p>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden shadow-inner">
                      <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all leading-relaxed">{generatedLink}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <button 
                      onClick={copyShareLink}
                      className={`w-full py-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        isLinkCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none'
                      }`}
                    >
                      {isLinkCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          تم النسخ بنجاح!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          نسخ الرابط المخصص
                        </>
                      )}
                    </button>
                    <button className="w-full py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black border border-slate-100 dark:border-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      إرسال عبر البريد
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-xs hover:bg-slate-200 transition-colors active:scale-95"
              >
                تجاهل التغييرات
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
              <button onClick={saveFindingEdit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95">حفظ التعديلات</button>
              <button onClick={() => setEditingFindingIndex(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm active:scale-95">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-md:max-w-md p-12 rounded-[3.5rem] text-center shadow-2xl border border-slate-100 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">تصفير جميع البيانات؟</h3>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium mb-10 text-center px-4 leading-relaxed">
              سيتم حذف كافة المخططات المرفوعة وإيقاف عمليات الرفع الجارية ومسح نتائج التحليل الحالية. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={clearAllData} 
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-none active:scale-95"
              >
                تأكيد المسح الشامل
              </button>
              <button 
                onClick={() => setShowConfirmClear(false)} 
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
              >
                إلغاء التراجع
              </button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
               <span className="px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">ESC to cancel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceView;
