
import React, { useState, useEffect } from 'react';
import ComplianceView from './ComplianceView';
import SearchView from './SearchView';
import ImageEditor from './ImageEditor';
import VoiceAssistant from './VoiceAssistant';
import SiteExplorerView from './SiteExplorerView';
import { databaseService, AuditRecord } from '../services/databaseService';
import { Order, Project } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';

type DashboardTab = 'projects' | 'compliance' | 'search' | 'editor' | 'voice' | 'orders' | 'invoices' | 'site-explorer' | 'profile';

interface ClientDashboardProps {
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  activeTab: externalActiveTab,
  onTabChange 
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<DashboardTab>('projects');
  
  // مزامنة الحالة الداخلية مع الخارجية القادمة من App.tsx
  const activeTab = externalActiveTab || internalActiveTab;
  
  const setActiveTab = (tab: DashboardTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);

  useEffect(() => {
    const projects = databaseService.getProjects();
    const audits = databaseService.getAudits();
    setProjectsList(projects);
    setAuditHistory(audits);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">سجل النشاط الهندسي</h4>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={auditHistory.slice(0, 7).reverse()}>
                          <XAxis dataKey="timestamp" hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              borderRadius: '12px', 
                              border: 'none', 
                              color: '#fff',
                              fontSize: '12px'
                            }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString('ar-SA')}
                          />
                          <Bar dataKey="result.score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                 <div className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-2">Total Project Count</div>
                 <div className="text-6xl font-black mb-4 tracking-tighter">{projectsList.length}</div>
                 <p className="text-sm opacity-70 font-bold leading-relaxed">أداء مكتبك الهندسي متفوق بنسبة 12% عن متوسط المكاتب في الرياض هذا الشهر.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectsList.length > 0 ? projectsList.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedProject(p)}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group shadow-sm text-right flex flex-col items-stretch"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJ-ID: {p.id.slice(-4)}</div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider bg-slate-50`}>
                       الموقع: {p.location}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] font-black text-slate-400">
                       <span>درجة الامتثال الأخيرة</span>
                       <span className="text-slate-900 dark:text-white">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                   <p className="text-slate-400 font-black">لا توجد مشاريع مسجلة حالياً. ابدأ بـ "فحص الامتثال" لحفظ أول مشروع.</p>
                </div>
              )}
            </div>

            {selectedProject && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-8 left-8 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="p-10 md:p-14">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                      <div>
                        <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3">تفاصيل المشروع من قاعدة البيانات</div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{selectedProject.name}</h2>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-400">REF: {selectedProject.id}</span>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest bg-indigo-50 text-indigo-600`}>
                             نشط
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-12">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm h-full">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                             تحليل البيانات التاريخية للمشروع
                          </h3>
                          <div className="h-72">
                             <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={databaseService.getProjectAudits(selectedProject.id).reverse()}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="timestamp" hide />
                                  <YAxis domain={[0, 100]} hide />
                                  <Tooltip 
                                    labelFormatter={(val) => new Date(val).toLocaleString('ar-SA')}
                                  />
                                  <Area type="monotone" dataKey="result.score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                               </AreaChart>
                             </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-end gap-4">
                      <button 
                        onClick={() => {
                          databaseService.deleteProject(selectedProject.id);
                          setSelectedProject(null);
                          setProjectsList(databaseService.getProjects());
                        }}
                        className="px-10 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-black hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                      >
                        حذف المشروع نهائياً
                      </button>
                      <button 
                        onClick={() => setSelectedProject(null)}
                        className="px-10 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'compliance': return <ComplianceView />;
      case 'search': return <SearchView />;
      case 'editor': return <ImageEditor />;
      case 'voice': return <VoiceAssistant />;
      case 'site-explorer': return <SiteExplorerView />;
      case 'orders':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">سجل العمليات الذكية (قاعدة البيانات)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5">توقيت العملية</th>
                      <th className="px-8 py-5">نوع الفحص</th>
                      <th className="px-8 py-5">النتيجة</th>
                      <th className="px-8 py-5">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {auditHistory.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                          {new Date(audit.timestamp).toLocaleString('ar-SA')}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {audit.type === 'safety' ? 'سلامة وحماية' : 'امتثال عام'}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {audit.result.score}%
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100`}>
                            محفوظ
                          </span>
                        </td>
                      </tr>
                    ))}
                    {auditHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold">لا توجد سجلات فحص سابقة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        );
      case 'profile':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-[3rem] shadow-sm max-w-2xl mx-auto text-center">
             <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-3xl text-white font-black mb-6">أ</div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">أحمد المحمدي</h3>
             <p className="text-slate-500 mb-8 font-bold">مكتب آفاق الهندسة للاستشارات | الرياض</p>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المستوى</p>
                   <p className="font-black text-indigo-600">احترافي (Pro)</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المشاريع</p>
                   <p className="font-black text-slate-900 dark:text-white">{projectsList.length} مشروعاً</p>
                </div>
             </div>
          </div>
        );
      default:
        return <div className="p-20 text-center font-black">قيد التحديث...</div>;
    }
  };

  const NavItem: React.FC<{ item: any }> = ({ item }) => (
    <button
      onClick={() => setActiveTab(item.id as DashboardTab)}
      className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-500 font-black text-sm relative group ${
        activeTab === item.id 
        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-slate-200/40 dark:shadow-none scale-[1.02]' 
        : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
        activeTab === item.id ? `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rotate-3` : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
      }`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} /></svg>
      </div>
      <span className={`transition-transform duration-500 ${activeTab === item.id ? 'translate-x-[-4px]' : ''}`}>
        {item.label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row bg-white dark:bg-slate-950 min-h-[900px] rounded-[3.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl transition-colors">
      <aside className="w-full lg:w-80 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col bg-slate-50/20 dark:bg-slate-900/40 shrink-0">
        <div className="mb-10 px-2">
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-2">Engineering Persistence DB</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">بُنيان <span className="text-slate-400 font-normal">Hub</span></h2>
        </div>
        
        <div className="space-y-8 flex-grow">
          <div>
            <h3 className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">عام</h3>
            <nav className="space-y-1">
              {[
                { id: 'projects', label: 'المشاريع الهندسية', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                { id: 'orders', label: 'سجل العمليات', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z' },
              ].map(item => <NavItem key={item.id} item={item} />)}
            </nav>
          </div>

          <div>
            <h3 className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">أدوات الذكاء الاصطناعي</h3>
            <nav className="space-y-1">
              {[
                { id: 'compliance', label: 'فحص الامتثال', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { id: 'site-explorer', label: 'مستكشف الموقع', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                { id: 'search', label: 'البحث التنظيمي', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                { id: 'editor', label: 'محرر المخططات', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                { id: 'voice', label: 'المساعد الصوتي', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
              ].map(item => <NavItem key={item.id} item={item} />)}
            </nav>
          </div>
        </div>

        <div className="mt-10">
          <button onClick={() => setActiveTab('profile')} className="w-full flex items-center gap-4 p-4 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white hover:opacity-90 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xs shrink-0">أ</div>
            <div className="text-right flex-1 min-w-0">
               <p className="text-xs font-black truncate">أحمد المحمدي</p>
               <p className="text-[10px] opacity-50 font-bold">المستوى الاحترافي</p>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-grow p-8 lg:p-14 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-500">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-50 dark:border-slate-800 pb-8">
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                <span>لوحة التحكم</span>
                <span>/</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {activeTab}
                </span>
              </nav>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white transition-all duration-500">
                إدارة الأعمال الهندسية
              </h1>
           </div>
        </header>

        <div key={activeTab} className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
