
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { databaseService, AuditRecord } from '../services/databaseService';
import { AnalysisResult, ImageData, AuditType, Project, DetailedFinding, Task } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar } from 'recharts';

interface ShortcutBadgeProps {
  keys: string;
}

const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({ keys }) => (
  <span className="hidden md:inline-flex items-center px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[8px] font-mono font-bold text-slate-400 ml-2 group-hover:border-indigo-300 transition-colors">
    {keys}
  </span>
);

interface InteractiveIconProps {
  icon: React.ReactNode;
  activeColor?: string;
  className?: string;
  tooltip?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const InteractiveIcon: React.FC<InteractiveIconProps> = ({ icon, activeColor = "bg-indigo-600", className = "", tooltip, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    if (onClick) onClick(e);
    
    // If it's a copy action, show a temporary success state
    if (tooltip?.includes("نسخ")) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }

    // Visual pulse/ripple duration
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={showCopied ? "تم النسخ!" : tooltip}
      className={`cursor-pointer p-2 rounded-xl shadow-sm transition-all duration-500 relative group/icon flex items-center justify-center ${
        isAnimating ? 'scale-90 rotate-12' : 'hover:scale-125 hover:-rotate-6 active:scale-95'
      } ${showCopied ? 'bg-emerald-500' : activeColor} text-white ${className} ${isHovered ? 'shadow-lg shadow-indigo-500/40 ring-2 ring-white/30' : ''}`}
    >
      <div className={`relative z-10 transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
        {showCopied ? (
          <svg className="w-4 h-4 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        ) : icon}
      </div>
      {isAnimating && (
        <div className="absolute inset-0 rounded-xl animate-ping bg-white/60"></div>
      )}
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 rounded-xl bg-white/20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
    </div>
  );
};

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  shortcut?: string;
  accentIcon?: React.ReactNode;
  interactiveHeaderIcon?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  id, title, description, isOpen, onToggle, icon, children, shortcut, accentIcon, interactiveHeaderIcon 
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const contentId = `content-${id}`;

  const handleToggle = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 500);
    onToggle();
  };

  return (
    <section id={id} className={`bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-700 transform ${
      isOpen 
        ? 'border-indigo-100 dark:border-indigo-900/40 shadow-xl shadow-indigo-100/20 dark:shadow-none scale-[1.005]' 
        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-50 dark:hover:border-indigo-900/10'
    } scroll-mt-24 overflow-hidden`}>
      <button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={`w-full flex items-center justify-between p-5 md:p-6 text-right transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/20 group ${
          isOpen ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all duration-500 relative ${
            isClicked ? 'scale-75 rotate-12' : ''
          } ${
            isOpen 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none rotate-6 scale-105' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 group-hover:rotate-3'
          }`}>
            <div className={`transition-transform duration-500 ${isOpen ? 'animate-pulse' : 'group-hover:animate-bounce'}`}>
              {icon}
            </div>
            {isClicked && (
              <div className="absolute inset-0 rounded-xl animate-ping bg-indigo-400/30"></div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3">
              {interactiveHeaderIcon}
              <h3 className={`font-black text-xl md:text-2xl transition-all duration-500 ${
                isOpen ? 'text-slate-900 dark:text-white translate-x-[-2px]' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {title}
              </h3>
              {accentIcon && (
                <div className="relative flex items-center justify-center">
                  <div className={`transition-all duration-500 transform ${
                    isHovered ? 'scale-125 rotate-12 text-indigo-500' : 'scale-100 rotate-0 text-slate-300 dark:text-slate-600'
                  } ${isClicked ? 'animate-bounce' : ''}`}>
                    {accentIcon}
                  </div>
                </div>
              )}
              {shortcut && <ShortcutBadge keys={shortcut} />}
            </div>
            {description && (
              <p className={`text-[11px] mt-0.5 transition-all duration-500 ${isOpen ? 'text-indigo-600/70 dark:text-indigo-400/70' : 'text-slate-400 opacity-0'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-full transition-all duration-700 ${
          isOpen ? 'bg-indigo-600 text-white rotate-180 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:text-indigo-500 group-hover:scale-110'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="p-6 md:p-8 pt-1 text-slate-600 dark:text-slate-300 leading-relaxed text-base border-t border-slate-50 dark:border-slate-800">
          <div className={`transition-all duration-1000 delay-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

interface FileProgress {
  id: string;
  name: string;
  progress: number;
  reader: FileReader;
}

const ComplianceView: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<FileProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeSections, setActiveSections] = useState<string[]>(['upload']);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [auditType, setAuditType] = useState<AuditType>(AuditType.GENERAL);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [projectName, setProjectName] = useState('مشروع افتراضي جديد');
  
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const headerContainerRef = useRef<HTMLDivElement>(null);

  const [editingFindingIdx, setEditingFindingIdx] = useState<number | null>(null);
  const [editingFindingText, setEditingFindingText] = useState('');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (headerContainerRef.current) {
        const rect = headerContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setParallaxOffset({ x: x * 30, y: y * 30 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const savedTasks = databaseService.getTasks();
    if (savedTasks.length === 0) {
      const defaultTasks: Task[] = [
        { id: '1', text: 'Review structural drawings | مراجعة المخططات الإنشائية', completed: false },
        { id: '2', text: 'Verify fire safety compliance | التحقق من اشتراطات السلامة والحريق', completed: false },
        { id: '3', text: 'Analyze architectural setback requirements | تحليل اشتراطات الارتداد المعماري', completed: false },
      ];
      setTasks(defaultTasks);
      databaseService.saveTasks(defaultTasks);
    } else {
      setTasks(savedTasks);
    }
    setAuditHistory(databaseService.getAudits());
  }, []);

  useEffect(() => {
    databaseService.saveTasks(tasks);
  }, [tasks]);

  const analysisStages = [
    "جاري قراءة المخططات...",
    "التحقق من بنود SBC...",
    "فحص معايير السلامة...",
    "تحليل كفاءة الطاقة...",
    "تحليل التوصيات الهندسية...",
    "إعداد التقرير النهائي..."
  ];

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setAnalysisStage(prev => (prev + 1) % analysisStages.length);
      }, 2500);
    } else {
      setAnalysisStage(0);
    }
    return () => clearInterval(timer);
  }, [loading, analysisStages.length]);

  const toggleSection = (id: string) => {
    setActiveSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const cancelAllUploads = () => {
    uploadingFiles.forEach(f => f.reader.abort());
    setUploadingFiles([]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFileUpload(e);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    const files = 'target' in e 
      ? Array.from((e.target as HTMLInputElement).files || [])
      : Array.from((e as React.DragEvent).dataTransfer.files || []);

    if (files.length === 0) return;

    const newUploads = files.map(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const reader = new FileReader();
      return { id, name: file.name, progress: 0, reader, file };
    });

    setUploadingFiles(prev => [...prev, ...newUploads.map(u => ({ id: u.id, name: u.name, progress: 0, reader: u.reader }))]);

    newUploads.forEach(u => {
      u.reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev => prev.map(p => p.id === u.id ? { ...p, progress: percent } : p));
        }
      };
      u.reader.onload = () => {
        setImages(prev => [...prev, {
          base64: (u.reader.result as string).split(',')[1],
          mimeType: u.file.type,
          name: u.file.name
        }]);
        setUploadingFiles(prev => prev.filter(p => p.id !== u.id));
      };
      u.reader.readAsDataURL(u.file);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeCompliance(images, auditType);
      setResult(res);
      const projectId = `proj-${Date.now()}`;
      databaseService.saveProject({
        id: projectId,
        name: projectName,
        location: 'الرياض',
        progress: res.score,
        status: 'active',
        lastUpdated: new Date().toISOString()
      });
      databaseService.saveAuditRecord({
        id: `audit-${Date.now()}`,
        projectId: projectId,
        timestamp: new Date().toISOString(),
        type: auditType,
        result: res
      });
      setAuditHistory(databaseService.getAudits());
      setActiveSections(['results', 'analytics', 'tasks']);
    } catch (err) {
      setError("حدث خطأ أثناء التحليل. تأكد من جودة الصور والمحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditFinding = () => {
    if (editingFindingIdx === null || !result) return;
    const updatedFindings = [...(result.findings || [])];
    updatedFindings[editingFindingIdx] = { ...updatedFindings[editingFindingIdx], text: editingFindingText };
    setResult({ ...result, findings: updatedFindings });
    setEditingFindingIdx(null);
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const overallProgress = uploadingFiles.length > 0 
    ? Math.round(uploadingFiles.reduce((acc, curr) => acc + curr.progress, 0) / uploadingFiles.length)
    : 0;

  const trendData = auditHistory.length > 1 
    ? auditHistory.slice(0, 7).reverse().map(a => ({
        name: new Date(a.timestamp).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
        score: a.result.score
      }))
    : [
        { name: 'الطلب 1', score: 65 },
        { name: 'الطلب 2', score: 72 },
        { name: 'الطلب 3', score: 80 },
        { name: 'الفحص الحالي', score: result?.score || 0 }
      ];

  const distributionData = result ? [
    { name: 'مطابق', value: (result.findings || []).filter(f => f.status === 'compliant').length || 5, color: '#10b981' },
    { name: 'تحذير', value: (result.findings || []).filter(f => f.status === 'warning').length || 3, color: '#f59e0b' },
    { name: 'غير مطابق', value: (result.findings || []).filter(f => f.status === 'non-compliant').length || 2, color: '#f43f5e' }
  ] : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
      {showClearConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm text-center">
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">تأكيد الحذف؟</h4>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setImages([]); setShowClearConfirm(false); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black">حذف</button>
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div ref={headerContainerRef} className="text-center space-y-2 mb-12 py-16 px-4 rounded-[3.5rem] relative overflow-hidden bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 transition-colors group">
        <div className="absolute inset-0 blueprint-grid opacity-[0.07] dark:opacity-[0.03]" style={{ transform: `translate(${parallaxOffset.x * 0.4}px, ${parallaxOffset.y * 0.4}px) scale(1.1)` }}></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 rounded-full shadow-sm mb-2"><div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SBC Standards Engine v2.5</span></div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">فحص الامتثال الذكي</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium max-w-2xl mx-auto">ارفع مخططاتك الهندسية ودع محرك الذكاء الاصطناعي يستخرج الملاحظات ويقارنها بالأكواد المعتمدة</p>
        </div>
      </div>

      <CollapsibleSection
        id="upload"
        title="إعداد الفحص والرفع"
        isOpen={activeSections.includes('upload')}
        onToggle={() => toggleSection('upload')}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pr-1">اسم المشروع</label>
             <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="مثلاً: فيلا حي النرجس" className="w-full px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:ring-4 focus:ring-indigo-100/50 font-bold text-sm dark:text-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => setAuditType(AuditType.GENERAL)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${auditType === AuditType.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg></div>
              <p className="font-black text-xs">امتثال عام (SBC General)</p>
            </button>
            <button onClick={() => setAuditType(AuditType.SAFETY)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${auditType === AuditType.SAFETY ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <p className="font-black text-xs">الأمن والسلامة (SBC 801)</p>
            </button>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-900/40 p-5 rounded-2xl animate-in slide-in-from-top-4 duration-500 shadow-lg relative overflow-hidden group">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-3 border-indigo-50 dark:border-indigo-900/30 flex items-center justify-center">
                       <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{uploadingFiles.length}</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">جاري الرفع...</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{overallProgress}%</span>
                  </div>
                </div>
                
                <button 
                  onClick={cancelAllUploads}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 group/cancel"
                >
                  <svg className="w-3.5 h-3.5 group-hover/cancel:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  إلغاء الكل
                </button>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${overallProgress}%` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          )}

          <div 
            onDragOver={onDragOver} 
            onDragLeave={() => setIsDraggingOver(false)} 
            onDrop={onDrop} 
            className={`transition-all duration-500 rounded-[2.5rem] p-12 text-center relative overflow-hidden flex flex-col items-center justify-center border-4 border-dashed group/upload ${
              isDraggingOver 
                ? 'marching-ants-border bg-indigo-600/10 shadow-[0_0_50px_rgba(79,70,229,0.2)] scale-[1.03] border-transparent' 
                : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-indigo-300'
            }`}
          >
            <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            
            <div className={`transition-all duration-500 transform ${isDraggingOver ? 'scale-125 mb-6' : 'mb-4'}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                isDraggingOver 
                  ? 'bg-indigo-600 text-white rotate-12 shadow-2xl animate-bounce' 
                  : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover/upload:rotate-6'
              }`}>
                {isDraggingOver ? (
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" /></svg>
                ) : (
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                )}
              </div>
            </div>

            <div className={`space-y-2 transition-all duration-500 ${isDraggingOver ? 'translate-y-[-5px]' : ''}`}>
               <p className={`text-xl font-black transition-colors ${isDraggingOver ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                 {isDraggingOver ? 'أفلت المخططات الآن!' : 'اسحب المخططات الهندسية هنا'}
               </p>
               <p className="text-sm font-medium text-slate-400 dark:text-slate-500">أو اضغط لاختيار الملفات من جهازك</p>
            </div>

            {isDraggingOver && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                 <div className="w-full h-full blueprint-grid animate-pulse"></div>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المخططات المرفوعة ({images.length})</h5>
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  حذف الكل
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group transition-all hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm bg-slate-50 dark:bg-slate-950 relative group/thumb">
                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={img.name} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" />
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{img.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{img.mimeType.split('/')[1]}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Ready</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all shrink-0 active:scale-90"
                      title="حذف الملف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading || images.length === 0 || uploadingFiles.length > 0} className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${auditType === AuditType.SAFETY ? 'bg-rose-600' : 'bg-slate-900 dark:bg-indigo-600'} text-white active:scale-[0.98] disabled:opacity-50`}>
            {loading ? <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div> : <span>ابدأ الفحص {auditType === AuditType.SAFETY ? '(سلامة)' : ''}</span>}
          </button>
        </div>
      </CollapsibleSection>

      {result && (
        <>
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-2 border-indigo-50 dark:border-indigo-900/20 shadow-2xl relative overflow-hidden group">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                <div className="shrink-0 text-center space-y-2">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45%" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="8" />
                      <circle cx="50%" cy="50%" r="45%" className={`fill-none transition-all duration-1000 ease-out ${result.status === 'compliant' ? 'stroke-emerald-500' : result.status === 'warning' ? 'stroke-amber-500' : 'stroke-rose-500'}`} strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * result.score) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center"><span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{result.score}%</span></div>
                  </div>
                </div>
                <div className="flex-1 space-y-4 text-right">
                  <div className="flex items-center gap-3">
                    <InteractiveIcon icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /></svg>} tooltip="ملخص النتيجة" />
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">ملخص تنفيذي (Executive Summary)</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-bold italic leading-loose">"{result.executiveSummary}"</p>
                </div>
              </div>
            </div>
          </div>

          <CollapsibleSection
            id="analytics"
            title="تحليلات الامتثال الذكية"
            description="نظرة عميقة على تطور أداء المشروع وتوزيع الملاحظات"
            isOpen={activeSections.includes('analytics')}
            onToggle={() => toggleSection('analytics')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            interactiveHeaderIcon={<InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} activeColor="bg-indigo-600" tooltip="عرض التحليلات البيانية" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Score Over Time Chart */}
              <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-800/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} tooltip="تحليل الاتجاه" />
                    تطور درجة الامتثال
                  </h4>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm">Trend Analysis</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '1.5rem', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          backgroundColor: '#0f172a',
                          color: '#fff',
                          fontSize: '12px',
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
              </div>

              {/* Finding Distribution Pie Chart */}
              <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h4 className="text-sm font-black mb-8 flex items-center gap-3 relative z-10 self-start">
                  <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>} activeColor="bg-slate-700" tooltip="توزيع الملاحظات" />
                  توزيع الملاحظات
                </h4>
                <div className="h-[220px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={500}
                        animationDuration={1500}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ 
                          borderRadius: '1rem', 
                          border: 'none', 
                          backgroundColor: '#1e293b',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-4 relative z-10">
                  {distributionData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="results"
            title="نتائج التحليل والتدقيق"
            isOpen={activeSections.includes('results')}
            onToggle={() => toggleSection('results')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            interactiveHeaderIcon={<InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} activeColor="bg-blue-600" tooltip="عرض تفاصيل الفحص" />}
          >
            <div className="space-y-12">
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col justify-center border-l-8 border-indigo-500">
                  <h4 className="font-black text-xl mb-4 flex items-center gap-3">
                    <InteractiveIcon 
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>} 
                      activeColor="bg-slate-700" 
                      tooltip="التفاصيل الهندسية" 
                    />
                    التفاصيل الفنية (Details)
                  </h4>
                  <p className="text-sm font-medium leading-relaxed opacity-90">{result.details}</p>
                </div>

              <div className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>} tooltip="قائمة الملاحظات" />
                  الملاحظات التفصيلية (Findings)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {result.findings?.map((finding, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-5 rounded-2xl flex items-start gap-5 group">
                      <div className={`p-3 rounded-xl shrink-0 mt-1 ${finding.status === 'compliant' ? 'bg-emerald-50 text-emerald-600' : finding.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={finding.status === 'compliant' ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} /></svg></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1"><span className="text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">{finding.category || 'عام'}</span><button onClick={() => { setEditingFindingIdx(idx); setEditingFindingText(finding.text); }} className="p-1.5 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button></div>
                        {editingFindingIdx === idx ? <div className="space-y-3"><textarea value={editingFindingText} onChange={(e) => setEditingFindingText(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-indigo-200 outline-none min-h-[80px]" autoFocus /><div className="flex gap-2 justify-end"><button onClick={handleSaveEditFinding} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black">حفظ</button><button onClick={() => setEditingFindingIdx(null)} className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-black">إلغاء</button></div></div> : <p className="text-slate-800 dark:text-slate-200 text-sm font-bold leading-relaxed">{finding.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50/30 dark:bg-indigo-900/5 p-6 rounded-[2rem] border border-indigo-100/50">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-5 flex items-center gap-3">
                    <InteractiveIcon 
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} 
                      activeColor="bg-indigo-500" 
                      tooltip="توصيات الخبير" 
                    />
                    التوصيات الهندسية (Recommendations)
                  </h4>
                  <ul className="space-y-3">{result.recommendations.map((rec, i) => (<li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></div>{rec}</li>))}</ul>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                    <InteractiveIcon 
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} 
                      activeColor="bg-slate-700" 
                      tooltip="الأكواد المرجعية" 
                    />
                    المراجع النظامية (SBC References)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {result.references.map((ref, i) => (
                      <div key={i} className="flex items-center gap-2 group/ref">
                        <span className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-500 shadow-sm flex items-center gap-3 transition-all hover:border-indigo-200">
                          {ref}
                          <InteractiveIcon 
                            icon={
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            } 
                            activeColor="bg-slate-100 dark:bg-slate-800" 
                            className="!p-1.5 text-slate-400 hover:text-indigo-600 scale-90"
                            onClick={() => {
                              navigator.clipboard.writeText(ref);
                            }}
                            tooltip="نسخ رمز الكود"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="tasks"
            title="المهام والمتابعة (Tasks)"
            description="إدارة المهام الهندسية المرتبطة بالمشروع"
            isOpen={activeSections.includes('tasks')}
            onToggle={() => toggleSection('tasks')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            interactiveHeaderIcon={
              <InteractiveIcon 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} 
                activeColor="bg-emerald-600" 
                tooltip="إدارة المهام" 
              />
            }
          >
            <div className="space-y-6">
              <div className="flex gap-3">
                <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} placeholder="إضافة مهمة هندسية..." className="flex-1 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 font-medium text-sm dark:text-white" />
                <button onClick={addTask} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95">إضافة</button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-transparent'}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></button>
                      <span className={`text-base font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.text}</span>
                    </div>
                    <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-center py-6 text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs">لا توجد مهام حالياً.</div>}
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      <CollapsibleSection
        id="faq"
        title="الأسئلة الشائعة"
        description="إجابات سريعة حول عملية الفحص"
        isOpen={activeSections.includes('faq')}
        onToggle={() => toggleSection('faq')}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        interactiveHeaderIcon={
          <InteractiveIcon 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            activeColor="bg-indigo-600" 
            tooltip="مركز الأسئلة" 
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'ما هي درجة الامتثال؟', a: 'مؤشر مئوي يوضح مدى مطابقة المخططات لمتطلبات كود البناء السعودي (SBC).' },
            { q: 'كم تستغرق عملية التحليل؟', a: 'تستغرق العملية عادة ما بين 10 إلى 30 ثانية اعتماداً على عدد المخطط.' },
            { q: 'هل يمكنني التحميل بصيغة PDF؟', a: 'ن