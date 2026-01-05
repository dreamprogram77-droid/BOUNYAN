
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCompliance } from '../services/geminiService';
import { databaseService, AuditRecord } from '../services/databaseService';
import { AnalysisResult, ImageData, AuditType, Project, DetailedFinding } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

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
}

const InteractiveIcon: React.FC<InteractiveIconProps> = ({ icon, activeColor = "bg-indigo-600" }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div 
      onClick={handleClick}
      className={`cursor-pointer p-2 rounded-lg shadow-sm transition-all duration-300 relative group/icon ${
        isAnimating ? 'scale-90 rotate-12' : 'hover:scale-110 hover:-rotate-6'
      } ${activeColor} text-white`}
    >
      {icon}
      {isAnimating && (
        <div className="absolute inset-0 rounded-lg animate-ping bg-white/40"></div>
      )}
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
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  id, title, description, isOpen, onToggle, icon, children, shortcut, accentIcon 
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

interface Task {
  id: string;
  text: string;
  completed: boolean;
  projectId?: string;
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
  
  // Parallax state
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const headerContainerRef = useRef<HTMLDivElement>(null);

  // States for inline editing
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

      u.reader.onerror = () => {
        setUploadingFiles(prev => prev.filter(p => p.id !== u.id));
      };

      u.reader.readAsDataURL(u.file);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onDragLeave = () => {
    setIsDraggingOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFileUpload(e);
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

  const handleClearAll = () => {
    setImages([]);
    setShowClearConfirm(false);
  };

  const overallProgress = uploadingFiles.length > 0 
    ? Math.round(uploadingFiles.reduce((acc, curr) => acc + curr.progress, 0) / uploadingFiles.length)
    : 0;

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeCompliance(images, auditType);
      setResult(res);
      
      const projectId = `proj-${Date.now()}`;
      const project: Project = {
        id: projectId,
        name: projectName,
        location: 'الرياض',
        progress: res.score,
        status: 'active',
        lastUpdated: new Date().toISOString()
      };
      
      databaseService.saveProject(project);
      
      const record: AuditRecord = {
        id: `audit-${Date.now()}`,
        projectId: projectId,
        timestamp: new Date().toISOString(),
        type: auditType,
        result: res
      };
      
      databaseService.saveAuditRecord(record);
      setAuditHistory(databaseService.getAudits());
      
      setActiveSections(['results']);
    } catch (err) {
      setError("حدث خطأ أثناء التحليل. تأكد من جودة الصور والمحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditFinding = (idx: number, text: string) => {
    setEditingFindingIdx(idx);
    setEditingFindingText(text);
  };

  const handleSaveEditFinding = () => {
    if (editingFindingIdx === null || !result) return;
    const updatedFindings = [...(result.findings || [])];
    updatedFindings[editingFindingIdx] = { ...updatedFindings[editingFindingIdx], text: editingFindingText };
    setResult({ ...result, findings: updatedFindings });
    setEditingFindingIdx(null);
  };

  const handleCancelEditFinding = () => {
    setEditingFindingIdx(null);
  };

  const pieData = result ? [
    { name: 'Compliant', value: result.score, color: '#10b981' },
    { name: 'Non-Compliant', value: 100 - result.score, color: '#f43f5e' }
  ] : [];

  // Generate trend data: Use real history if available, else mock data for visualization
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">تأكيد الحذف؟</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">سيتم حذف جميع المخططات المرفوعة حالياً. لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex gap-3">
              <button 
                onClick={handleClearAll}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 dark:shadow-none"
              >
                نعم، احذف الكل
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Parallax Header */}
      <div 
        ref={headerContainerRef}
        className="text-center space-y-2 mb-12 py-16 px-4 rounded-[3.5rem] relative overflow-hidden bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 transition-colors group"
      >
        {/* Parallax Layers */}
        <div 
          className="absolute inset-0 blueprint-grid opacity-[0.07] dark:opacity-[0.03] transition-transform duration-300 ease-out pointer-events-none"
          style={{ transform: `translate(${parallaxOffset.x * 0.4}px, ${parallaxOffset.y * 0.4}px) scale(1.1)` }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] transition-transform duration-500 ease-out pointer-events-none"
          style={{ transform: `translate(${parallaxOffset.x * 1.2}px, ${parallaxOffset.y * 1.2}px)` }}
        ></div>
        <div 
          className="absolute -bottom-24 -right-24 w-64 h-64 border-[1px] border-indigo-200/20 dark:border-indigo-800/10 rounded-full transition-transform duration-700 ease-out pointer-events-none"
          style={{ transform: `translate(${parallaxOffset.x * 0.8}px, ${parallaxOffset.y * 0.8}px) rotate(${parallaxOffset.x}deg)` }}
        ></div>
        
        {/* Technical Circles/Marks */}
        <div 
          className="absolute top-8 right-12 opacity-10 dark:opacity-5 transition-transform duration-500 ease-out"
          style={{ transform: `translate(${parallaxOffset.x * 1.5}px, ${parallaxOffset.y * 1.5}px)` }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="40" strokeWidth="0.5" strokeDasharray="4 4" />
            <path d="M10 50H90M50 10V90" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-sm mb-2 scale-90 md:scale-100">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">SBC Standards Engine v2.5</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">فحص الامتثال الذكي</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium max-w-2xl mx-auto">ارفع مخططاتك الهندسية ودع محرك الذكاء الاصطناعي يستخرج الملاحظات ويقارنها بالأكواد المعتمدة</p>
        </div>
      </div>

      <CollapsibleSection
        id="upload"
        title="إعداد الفحص والرفع"
        isOpen={activeSections.includes('upload')}
        onToggle={() => toggleSection('upload')}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
        accentIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pr-1">اسم المشروع</label>
             <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="مثلاً: فيلا حي النرجس"
                className="w-full px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all font-bold text-sm dark:text-white"
             />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pr-1">نوع الفحص المطلوب</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => setAuditType(AuditType.GENERAL)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${auditType === AuditType.GENERAL ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-100'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auditType === AuditType.GENERAL ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs">امتثال عام (SBC General)</p>
                    <p className={`text-[9px] ${auditType === AuditType.GENERAL ? 'text-indigo-100' : 'text-slate-400'}`}>معماري، إنشائي، كهربائي</p>
                  </div>
                </button>

                <button 
                  onClick={() => setAuditType(AuditType.SAFETY)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${auditType === AuditType.SAFETY ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-100'}`}
                >
                  {auditType === AuditType.SAFETY && (
                    <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auditType === AuditType.SAFETY ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs">الأمن والسلامة (SBC 801)</p>
                    <p className={`text-[9px] ${auditType === AuditType.SAFETY ? 'text-rose-100' : 'text-slate-400'}`}>الحريق، المخارج، الإنذار</p>
                  </div>
                </button>
             </div>
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
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  إلغاء
                </button>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${overallProgress}%` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          )}

          {/* Enhanced Drag and Drop Area */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`transition-all duration-500 rounded-[2rem] p-10 text-center relative group cursor-pointer overflow-hidden ${
              isDraggingOver 
                ? 'bg-indigo-600/5 dark:bg-indigo-500/10 border-indigo-600/50 marching-ants-border scale-[1.03] shadow-2xl shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-500/10' 
                : 'bg-slate-50/50 dark:bg-slate-800/30 border-3 border-dashed border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isDraggingOver && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                 <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] animate-pulse"></div>
                 <div className="relative bg-white dark:bg-slate-900 px-8 py-5 rounded-[2rem] shadow-2xl border-2 border-indigo-500 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center animate-bounce shadow-xl shadow-indigo-500/30">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                    <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">أفلت المخططات الآن</span>
                 </div>
              </div>
            )}
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              accept="image/jpeg,image/png,image/webp"
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
              isDraggingOver 
                ? 'bg-indigo-600 text-white scale-125 rotate-6 shadow-xl shadow-indigo-500/40 opacity-0' 
                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 group-hover:scale-110'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className={`text-lg font-black transition-all duration-500 ${
              isDraggingOver ? 'text-indigo-600 dark:text-indigo-400 opacity-0' : 'text-slate-700 dark:text-slate-200'
            }`}>
              {isDraggingOver ? 'أفلت المخططات الهندسية هنا' : 'اسحب المخططات هنا أو اضغط للاختيار'}
            </p>
            <div className={`flex items-center justify-center gap-2 mt-2 transition-all duration-500 ${isDraggingOver ? 'opacity-0' : ''}`}>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">JPG</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">PNG</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">WebP</span>
            </div>
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

          <button 
            onClick={handleAnalyze}
            disabled={loading || images.length === 0 || uploadingFiles.length > 0}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 ${auditType === AuditType.SAFETY ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} text-white active:scale-[0.98]`}
          >
            {loading ? (
              <>
                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                <span>{analysisStages[analysisStage]}</span>
              </>
            ) : (
              <>
                <span>ابدأ الفحص {auditType === AuditType.SAFETY ? '(سلامة)' : ''}</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </>
            )}
          </button>
        </div>
      </CollapsibleSection>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold text-xs animate-in slide-in-from-right-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Executive Summary Section - Always Visible if Result exists */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border-2 border-indigo-50 dark:border-indigo-900/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-3 h-full bg-indigo-600/10"></div>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
              {/* Score Display */}
              <div className="shrink-0 text-center space-y-2">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                    <circle
                      cx="50%" cy="50%" r="45%"
                      className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50%" cy="50%" r="45%"
                      className={`fill-none transition-all duration-1000 ease-out ${
                        result.status === 'compliant' ? 'stroke-emerald-500' :
                        result.status === 'warning' ? 'stroke-amber-500' : 'stroke-rose-500'
                      }`}
                      strokeWidth="10"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * result.score) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{result.score}%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">SBC Score</span>
                  </div>
                </div>
                <div>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    result.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Summary Text */}
              <div className="flex-1 space-y-4 text-right md:text-right">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                   <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                   <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">ملخص تنفيذي (Executive Summary)</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-bold leading-loose italic">
                  "{result.executiveSummary}"
                </p>
                <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-700">
                    تم التحليل بواسطة {auditType === AuditType.SAFETY ? 'Gemini 3 Pro (Safety Model)' : 'Gemini 3 Pro'}
                  </span>
                  <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-700">
                    {auditType === AuditType.SAFETY ? 'SBC 801 Standards' : 'SBC 2024 Standards'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <CollapsibleSection
          id="results"
          title="نتائج التحليل والتدقيق"
          isOpen={activeSections.includes('results')}
          onToggle={() => toggleSection('results')}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          accentIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        >
          <div className="space-y-12 py-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-indigo-50 dark:border-indigo-900/20 text-center flex flex-col items-center justify-center shadow-lg transition-all hover:scale-[1.01] relative group overflow-hidden">
                <div className="h-48 w-48 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{result.score}%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Compliance</span>
                  </div>
                </div>
                <div className="mt-6 relative z-10">
                  <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${
                    result.status === 'compliant' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/30' :
                    result.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/30' :
                    'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/30'
                  }`}>
                    {result.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-indigo-50 dark:border-indigo-900/20 shadow-sm flex-1 group/item">
                  <h4 className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover/item:rotate-12 group-hover/item:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ملخص التقرير التفصيلي
                  </h4>
                  <p className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    {result.executiveSummary}
                  </p>
                </div>
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-lg relative overflow-hidden group/item">
                  <h4 className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <svg className="w-3 h-3 transition-transform group-hover/item:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    التفاصيل الفنية الموثقة
                  </h4>
                  <p className="text-sm font-medium leading-relaxed opacity-90 relative z-10">{result.details}</p>
                </div>
              </div>
            </div>

            {/* Historical Trend Chart Section */}
            <div className="bg-slate-50/50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                       <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                       الاتجاه التاريخي للامتثال
                    </h4>
                    <p className="text-slate-400 text-xs font-bold mt-1 pr-11">تتبع تحسن جودة المخططات عبر دورات الفحص المتعددة</p>
                  </div>
                  <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SBC Score %</span>
                  </div>
               </div>
               
               <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderRadius: '16px', 
                          border: 'none', 
                          color: '#fff',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#818cf8', fontWeight: 900 }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 group/title">
                <InteractiveIcon icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                الملاحظات التفصيلية (Findings)
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {result.findings?.map((finding, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-5 rounded-2xl flex items-start gap-5 hover:shadow-md transition-all group relative">
                    <div className={`p-3 rounded-xl shrink-0 transition-all group-hover:scale-110 mt-1 ${
                      finding.status === 'compliant' ? 'bg-emerald-50 text-emerald-600' :
                      finding.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {finding.status === 'compliant' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.1em] bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                            {finding.category || 'عام'}
                          </span>
                        </div>
                        {editingFindingIdx !== idx && (
                          <button 
                            onClick={() => handleStartEditFinding(idx, finding.text)}
                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="تعديل الملاحظة"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                      </div>
                      
                      {editingFindingIdx === idx ? (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <textarea 
                            value={editingFindingText}
                            onChange={(e) => setEditingFindingText(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900/50 outline-none focus:border-indigo-500 transition-all font-bold text-sm text-slate-700 dark:text-slate-200 min-h-[80px] resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={handleSaveEditFinding}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all shadow-sm"
                            >
                              حفظ التعديل
                            </button>
                            <button 
                              onClick={handleCancelEditFinding}
                              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black hover:bg-slate-200 transition-all"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 dark:text-slate-200 text-sm font-bold leading-relaxed">{finding.text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-indigo-50/30 dark:bg-indigo-900/5 p-6 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-800/50 group/section">
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-5 flex items-center gap-2">
                  <InteractiveIcon icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
                  التوصيات الهندسية المقترحة
                </h4>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed group/item">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 transition-transform group-hover/item:scale-150"></div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group/section">
                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <InteractiveIcon activeColor="bg-slate-900 dark:bg-slate-700" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
                  المراجع النظامية (SBC)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.references.map((ref, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-[9px] font-black text-slate-500 dark:text-slate-400 shadow-sm uppercase tracking-wider hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-default">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Tasks Section */}
      <CollapsibleSection
        id="tasks"
        title="Tasks | المهام والمتابعة"
        description="تتبع تقدم العمل والمهام المتعلقة بالتدقيق الهندسي"
        isOpen={activeSections.includes('tasks')}
        onToggle={() => toggleSection('tasks')}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        accentIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="إضافة مهمة هندسية جديدة..."
              className="flex-1 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all font-medium text-sm dark:text-white"
            />
            <button 
              onClick={addTask}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              إضافة
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-transparent'}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <span className={`text-base font-bold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={() => removeTask(task.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-6 text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs">
                لا توجد مهام حالياً.
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="faq"
        title="الأسئلة الشائعة"
        description="إجابات سريعة حول عملية الفحص"
        isOpen={activeSections.includes('faq')}
        onToggle={() => toggleSection('faq')}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        accentIcon={<InteractiveIcon activeColor="bg-transparent text-indigo-500" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'ما هي درجة الامتثال؟', a: 'مؤشر مئوي يوضح مدى مطابقة المخططات لمتطلبات كود البناء السعودي (SBC).' },
            { q: 'كم تستغرق عملية التحليل؟', a: 'تستغرق العملية عادة ما بين 10 إلى 30 ثانية اعتماداً على عدد المخططات.' },
            { q: 'هل يمكنني التحميل بصيغة PDF؟', a: 'نعم، يمكنك طباعة النتائج أو حفظها بصيغة PDF موثقة لمكتبك.' },
            { q: 'هل يدعم الأنظمة البلدية؟', a: 'نعم، بُنيان مصمم للالتزام بكافة اللوائح البلدية المحلية في المملكة.' }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-50 transition-all group/faq">
              <h4 className="text-base font-black text-slate-900 dark:text-white mb-2 group-hover/faq:text-indigo-600 transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 group-hover/faq:scale-150 transition-all"></span>
                <svg className="w-3.5 h-3.5 opacity-0 group-hover/faq:opacity-100 transition-all transform -translate-x-2 group-hover/faq:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {item.q}
              </h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pr-4">{item.a}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default ComplianceView;
