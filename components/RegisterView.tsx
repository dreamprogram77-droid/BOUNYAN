
import React, { useState } from 'react';
import { AppMode } from '../types';

interface RegisterViewProps {
  onSwitch: (mode: AppMode) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    officeName: '',
    licenseNumber: '',
    city: 'الرياض',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // تحقق بسيط
    if (!formData.officeName || !formData.email || !formData.password) {
      setError('يرجى إكمال جميع الحقول الإلزامية');
      return;
    }

    setError(null);
    setIsLoading(true);

    // محاكاة عملية إنشاء حساب
    setTimeout(() => {
      setIsLoading(false);
      // التوجيه للصفحة الرئيسية بعد "النجاح"
      onSwitch(AppMode.HOME);
    }, 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full pointer-events-none"></div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">انضم لأسرة بنيان</h2>
        <p className="text-slate-400 text-center mb-10 font-medium">ابدأ رحلتك في هندسة المستقبل اليوم</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in shake duration-300 md:col-span-2">
            <div className="bg-rose-100 p-1 rounded-lg text-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-rose-700 text-sm font-bold">{error}</p>
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="block text-sm font-black text-slate-700 mb-2 mr-1">اسم المكتب الهندسي</label>
            <input 
              name="officeName"
              type="text" 
              value={formData.officeName}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium" 
              placeholder="مكتب الأفق للاستشارات" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 mr-1">رقم السجل الهندسي</label>
            <input 
              name="licenseNumber"
              type="text" 
              value={formData.licenseNumber}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium" 
              placeholder="1010XXXXXX" 
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 mr-1">المدينة</label>
            <div className="relative">
              <select 
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all appearance-none font-medium text-slate-700"
              >
                <option>الرياض</option>
                <option>جدة</option>
                <option>الدمام</option>
                <option>مكة المكرمة</option>
                <option>المدينة المنورة</option>
                <option>نيوم</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 mr-1">البريد الإلكتروني</label>
            <input 
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium" 
              placeholder="admin@office.com" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 mr-1">كلمة المرور</label>
            <input 
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <div className="md:col-span-2 mt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full group bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 shadow-xl shadow-slate-200 hover:shadow-indigo-100 transition-all flex justify-center items-center gap-3 overflow-hidden active:scale-95 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <span>إنشاء الحساب</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 font-medium">لديك حساب بالفعل؟ <button onClick={() => onSwitch(AppMode.LOGIN)} className="text-indigo-600 font-black hover:underline underline-offset-4">سجل دخولك</button></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
