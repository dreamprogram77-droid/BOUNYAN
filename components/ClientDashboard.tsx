
import React, { useState } from 'react';
import ComplianceView from './ComplianceView';
import SearchView from './SearchView';
import ImageEditor from './ImageEditor';
import VoiceAssistant from './VoiceAssistant';
import { Order } from '../types';

type DashboardTab = 'projects' | 'compliance' | 'search' | 'editor' | 'voice' | 'orders' | 'invoices' | 'companies' | 'profile';

interface ProjectData {
  name: string;
  ref: string;
  progress: number;
  status: string;
  risk: string;
}

const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('projects');
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<ProjectData[]>([
    { name: 'برج الملقا السكني', ref: 'BUN-2024-001', progress: 85, status: 'في التنفيذ', risk: 'منخفض' },
    { name: 'مجمع واحة الياسمين', ref: 'BUN-2024-002', progress: 30, status: 'مرحلة التصميم', risk: 'متوسط' },
  ]);

  const [ordersList] = useState<Order[]>([
    { id: 'ORD-7721', type: 'compliance_check', date: '2024-05-20', status: 'completed', projectName: 'برج الملقا السكني' },
    { id: 'ORD-8832', type: 'image_edit', date: '2024-05-22', status: 'processing', projectName: 'مجمع واحة الياسمين' },
    { id: 'ORD-9910', type: 'consultation', date: '2024-05-23', status: 'pending', projectName: 'فيلا حي النرجس' },
    { id: 'ORD-4412', type: 'compliance_check', date: '2024-05-18', status: 'completed', projectName: 'مستشفى السلام الطبي' },
  ]);

  const [newProject, setNewProject] = useState({
    name: '',
    status: 'في التنفيذ',
    progress: 0
  });

  const mainMenuItems = [
    { id: 'projects', label: 'المشاريع', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'indigo' },
    { id: 'orders', label: 'الطلبات والعمليات', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z', color: 'slate' },
    { id: 'invoices', label: 'الفواتير والمالية', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: 'slate' },
  ];

  const aiToolsItems = [
    { id: 'compliance', label: 'فحص الامتثال', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'emerald' },
    { id: 'search', label: 'البحث التنظيمي', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'blue' },
    { id: 'editor', label: 'محرر المخططات', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'amber' },
    { id: 'voice', label: 'المساعد الصوتي', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', color: 'rose' },
  ];

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const project: ProjectData = {
      ...newProject,
      ref: `BUN-2024-${String(projectsList.length + 1).padStart(3, '0')}`,
      risk: 'منخفض'
    };

    setProjectsList([project, ...projectsList]);
    setNewProject({ name: '', status: 'في التنفيذ', progress: 0 });
    setIsAddProjectModalOpen(false);
  };

  const StatCard = ({ label, value, trend, color }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {trend && <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></div>
      </div>
    </div>
  );

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pending': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getTypeText = (type: string) => {
    switch(type) {
      case 'compliance_check': return 'فحص امتثال';
      case 'image_edit': return 'تعديل مخطط';
      case 'consultation': return 'استشارة تقنية';
      default: return type;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="المشاريع النشطة" value={projectsList.length} trend="+2 هذا الشهر" color="indigo" />
              <StatCard label="نسبة الامتثال" value="94%" trend="+1.2%" color="emerald" />
              <StatCard label="ساعات العمل" value="142" color="amber" />
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">سجل المشاريع الهندسية</h3>
              <button 
                onClick={() => setIsAddProjectModalOpen(true)}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95"
              >
                + مشروع جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectsList.map((p, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.ref}</div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                    </div>
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black">{p.status}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] font-black text-slate-400">
                       <span>التقدم</span>
                       <span className="text-slate-900 dark:text-white">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="إجمالي العمليات" value={ordersList.length} color="indigo" />
              <StatCard label="عمليات ناجحة" value={ordersList.filter(o => o.status === 'completed').length} color="emerald" />
              <StatCard label="قيد المعالجة" value={ordersList.filter(o => o.status === 'processing').length} color="amber" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">سجل العمليات والطلبات الذكية</h3>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                   </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5">رقم العملية</th>
                      <th className="px-8 py-5">المشروع المرتبط</th>
                      <th className="px-8 py-5">نوع العملية</th>
                      <th className="px-8 py-5">التاريخ</th>
                      <th className="px-8 py-5">الحالة</th>
                      <th className="px-8 py-5">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {ordersList.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">{order.id}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{order.projectName}</td>
                        <td className="px-8 py-5 text-sm font-bold text-indigo-600 dark:text-indigo-400">{getTypeText(order.type)}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-400">{order.date}</td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusStyle(order.status)}`}>
                            {order.status === 'completed' ? 'مكتمل' : order.status === 'processing' ? 'قيد التنفيذ' : 'بالانتظار'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-left">
                          <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 text-center">
                 <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">عرض جميع العمليات المؤرشفة</button>
              </div>
            </div>
          </div>
        );
      case 'compliance': return <ComplianceView />;
      case 'search': return <SearchView />;
      case 'editor': return <ImageEditor />;
      case 'voice': return <VoiceAssistant />;
      case 'invoices':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden animate-in fade-in duration-500">
             <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">الفواتير والمدفوعات</h3>
             </div>
             <div className="p-20 text-center opacity-20">
                <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <p className="font-black">لا توجد فواتير مستحقة حالياً</p>
             </div>
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-2xl animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 text-right">ملف التعريف الهندسي</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 text-3xl font-black">أ</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">أحمد المحمدي</h4>
                  <p className="text-sm text-slate-400 font-bold">مكتب ركائز الهندسي</p>
                </div>
              </div>
              <button className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm">تعديل البيانات</button>
            </div>
          </div>
        );
      default:
        return <div className="p-20 text-center text-slate-300 font-black italic">قريباً...</div>;
    }
  };

  const NavItem: React.FC<{ item: any }> = ({ item }) => (
    <button
      onClick={() => setActiveTab(item.id as DashboardTab)}
      className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 font-black text-sm relative group ${
        activeTab === item.id 
        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-slate-200/40 dark:shadow-none' 
        : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
        activeTab === item.id ? `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600` : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
      }`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
        </svg>
      </div>
      {item.label}
      {activeTab === item.id && (
        <div className="mr-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
      )}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row bg-white dark:bg-slate-950 min-h-[900px] rounded-[3.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none transition-colors">
      
      {/* Add Project Modal */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-10 relative">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">إضافة مشروع جديد</h3>
               <button onClick={() => setIsAddProjectModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-6 relative">
               <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 mr-1">اسم المشروع</label>
                  <input 
                    type="text" 
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    placeholder="مثال: برج التطوير الإداري"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all font-medium dark:text-white"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 mr-1">الحالة</label>
                    <select 
                      value={newProject.status}
                      onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none appearance-none font-medium dark:text-white"
                    >
                      <option>في التنفيذ</option>
                      <option>مرحلة التصميم</option>
                      <option>مكتمل</option>
                      <option>متوقف مؤقتاً</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 mr-1">نسبة الإنجاز (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={newProject.progress}
                      onChange={(e) => setNewProject({...newProject, progress: parseInt(e.target.value) || 0})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-medium dark:text-white"
                    />
                  </div>
               </div>

               <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">تثبيت المشروع</button>
                  <button type="button" onClick={() => setIsAddProjectModalOpen(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black">إلغاء</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-80 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col bg-slate-50/20 dark:bg-slate-900/40 shrink-0">
        <div className="mb-10 px-2">
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-2">Management Center</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">بُنيان <span className="text-slate-400 font-normal">Hub</span></h2>
        </div>
        
        <div className="space-y-8 flex-grow">
          <div>
            <h3 className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">الإدارة العامة</h3>
            <nav className="space-y-1">
              {mainMenuItems.map(item => <NavItem key={item.id} item={item} />)}
            </nav>
          </div>

          <div>
            <h3 className="px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">أدوات الذكاء الاصطناعي</h3>
            <nav className="space-y-1">
              {aiToolsItems.map(item => <NavItem key={item.id} item={item} />)}
            </nav>
          </div>
        </div>

        <div className="mt-10">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full flex items-center gap-4 p-4 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white hover:opacity-90 transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xs shrink-0">أ</div>
            <div className="text-right flex-1 min-w-0">
               <p className="text-xs font-black truncate">أحمد المحمدي</p>
               <p className="text-[10px] opacity-50 font-bold uppercase truncate">المستوى الاحترافي</p>
            </div>
            <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-8 lg:p-14 overflow-y-auto bg-white dark:bg-slate-950">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-50 dark:border-slate-800 pb-8">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-600 rounded-full"></div>
              <div>
                <nav className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  <span>لوحة التحكم</span>
                  <span>/</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {[...mainMenuItems, ...aiToolsItems].find(i => i.id === activeTab)?.label || 'الرئيسية'}
                  </span>
                </nav>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  {[...mainMenuItems, ...aiToolsItems].find(i => i.id === activeTab)?.label}
                </h1>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">P{i}</div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">+{projectsList.length}</div>
              </div>
           </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
