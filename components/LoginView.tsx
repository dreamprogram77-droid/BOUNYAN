
import React, { useState } from 'react';
import { AppMode } from '../types';

interface LoginViewProps {
  onSwitch: (mode: AppMode) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoEmail = 'demo@bunyan.sa';
  const demoPassword = 'password123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setError(null);
    setIsLoading(true);

    // محاكاة عملية تسجيل الدخول
    setTimeout(() => {
      setIsLoading(false);
      onSwitch(AppMode.HOME);
    }, 1200);
  };

  const handleLoginAsDemo = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSwitch(AppMode.HOME);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-full pointer-events-none"></div>
        
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">مرحباً بك مجدداً</h2>
        <p className="text-slate-400 dark:text-slate-500 text-center mb-10 font-medium">سجل دخولك لمتابعة أعمالك الهندسية</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
            <div className="bg-rose-100 dark:bg-rose-900/40 p-1 rounded-lg text-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-rose-700 dark:text-rose-300 text-sm font-bold">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 mr-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white" 
              placeholder="name@office.com" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 mr-1">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white" 
              placeholder="••••••••" 
              required
            />
          </div>
          <div className="text-left">
            <button type="button" className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline">نسيت كلمة المرور؟</button>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full group bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 shadow-xl shadow-slate-200 dark:shadow-none hover:shadow-indigo-100 transition-all flex justify-center items-center gap-3 overflow-hidden active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <span>دخول للمنصة</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Demo Account Information */}
        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 group">
          <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            نسخة تجريبية للمستثمرين
          </div>
          <div className="space-y-2 mb-4">
             <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">البريد:</span>
                <span className="text-slate-700 dark:text-slate-200">{demoEmail}</span>
             </div>
             <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">المرور:</span>
                <span className="text-slate-700 dark:text-slate-200">{demoPassword}</span>
             </div>
          </div>
          <button 
            onClick={handleLoginAsDemo}
            className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50"
          >
            دخول مباشر كحساب تجريبي
          </button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">ليس لديك حساب؟ <button onClick={() => onSwitch(AppMode.REGISTER)} className="text-indigo-600 dark:text-indigo-400 font-black hover:underline underline-offset-4">إنشاء حساب جديد</button></p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
