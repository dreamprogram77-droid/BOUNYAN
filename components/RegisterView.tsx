
import React from 'react';
import { AppMode } from '../types';

interface RegisterViewProps {
  onSwitch: (mode: AppMode) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitch }) => {
  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">انضم لأسرة بنيان</h2>
        <p className="text-slate-400 text-center mb-10">ابدأ رحلتك في هندسة المستقبل اليوم</p>
        
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المكتب الهندسي</label>
            <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="مكتب الأفق للاستشارات" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">رقم السجل الهندسي</label>
            <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="1010XXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">المدينة</label>
            <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none">
              <option>الرياض</option>
              <option>جدة</option>
              <option>الدمام</option>
              <option>مكة المكرمة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
            <input type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="admin@office.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
            <input type="password" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" />
          </div>
          
          <div className="md:col-span-2 mt-4">
            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
              إنشاء الحساب
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500">لديك حساب بالفعل؟ <button onClick={() => onSwitch(AppMode.LOGIN)} className="text-indigo-600 font-black hover:underline">سجل دخولك</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
