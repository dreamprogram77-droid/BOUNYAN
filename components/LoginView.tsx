
import React from 'react';
import { AppMode } from '../types';

interface LoginViewProps {
  onSwitch: (mode: AppMode) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitch }) => {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">مرحباً بك مجدداً</h2>
        <p className="text-slate-400 text-center mb-10">سجل دخولك لمتابعة أعمالك الهندسية</p>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
            <input type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="name@office.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
            <input type="password" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
          </div>
          <div className="text-left">
            <a href="#" className="text-sm text-indigo-600 font-bold hover:underline">نسيت كلمة المرور؟</a>
          </div>
          <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
            دخول للمنصة
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500">ليس لديك حساب؟ <button onClick={() => onSwitch(AppMode.REGISTER)} className="text-indigo-600 font-black hover:underline">إنشاء حساب جديد</button></p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
