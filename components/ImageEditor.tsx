
import React, { useState } from 'react';
import { editBlueprintImage } from '../services/geminiService';
import { ImageData } from '../types';

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImage({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
        setEditedUrl(null);
      };
      reader.onerror = () => setError('فشل في قراءة الملف. يرجى المحاولة مرة أخرى.');
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setEditing(true);
    setError(null);
    try {
      const result = await editBlueprintImage(image, prompt);
      if (result) {
        setEditedUrl(result);
      } else {
        setError('لم نتمكن من تعديل الصورة. يرجى تجربة وصف آخر أو مخطط أوضح.');
      }
    } catch (err) {
      setError('حدث خطأ تقني أثناء معالجة المخطط. يرجى التحقق من اتصالك بالإنترنت.');
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">التعديل الذكي للمخططات</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-rose-700 text-sm font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative ${image ? 'bg-indigo-50/20 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white'}`}>
             <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={editing} />
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 ${image ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                {image ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                )}
             </div>
             <p className={`font-bold ${image ? 'text-indigo-600' : 'text-slate-500'}`}>
               {image ? 'تم اختيار المخطط بنجاح' : 'ارفع المخطط المراد تعديله'}
             </p>
             <p className="text-xs text-slate-400 mt-1">يدعم ملفات JPG, PNG, WebP</p>
          </div>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={editing}
              placeholder="صف التعديل المطلوب بدقة... (مثلاً: أضف مسار إخلاء باللون الأخضر يربط المكاتب بالمخرج الرئيسي)"
              className="w-full p-5 h-40 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none font-medium text-slate-700 placeholder:text-slate-300"
            />
            <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest pointer-events-none">AI Prompting</div>
          </div>
          
          <button
            onClick={handleEdit}
            disabled={editing || !image || !prompt.trim()}
            className="group relative w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl hover:shadow-indigo-100 flex items-center justify-center gap-3 overflow-hidden"
          >
            {editing ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                <span>جاري معالجة البيانات...</span>
              </div>
            ) : (
              <>
                <span>تنفيذ التعديل الذكي</span>
                <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col min-h-[500px] relative overflow-hidden">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
           المعاينة الفورية
           {editing && <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full animate-pulse">جاري التحليل...</span>}
        </h2>
        
        <div className={`flex-1 rounded-[1.5rem] overflow-hidden relative transition-all duration-500 ${editing ? 'bg-slate-100 ring-4 ring-indigo-50' : 'bg-slate-50 border border-slate-100'}`}>
          {editing && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
               <div className="w-16 h-16 relative mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
               </div>
               <p className="text-slate-800 font-black text-lg mb-1">يتم الآن الرسم بواسطة الذكاء الاصطناعي</p>
               <p className="text-slate-500 text-sm font-medium">هذه العملية قد تستغرق بضع ثوانٍ</p>
            </div>
          )}

          {editedUrl || (image && `data:${image.mimeType};base64,${image.base64}`) ? (
            <img 
              src={editedUrl || `data:${image!.mimeType};base64,${image!.base64}`} 
              className={`w-full h-full object-contain transition-all duration-700 ${editing ? 'scale-105 blur-sm opacity-50' : 'scale-100 opacity-100'}`} 
              alt="المعاينة"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="font-bold text-lg mb-1">لا توجد معاينة حالياً</p>
              <p className="text-sm">سيظهر المخطط المعدل هنا بعد الضغط على "تنفيذ التعديل الذكي"</p>
            </div>
          )}
          
          {editedUrl && !editing && (
             <div className="absolute bottom-6 left-6 flex gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
               <a 
                 href={editedUrl} 
                 download="bunyan_edited_blueprint.png"
                 className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 تحميل المخطط المعدل
               </a>
               <button 
                 onClick={() => { setEditedUrl(null); }}
                 className="bg-white/90 backdrop-blur-md text-slate-700 px-6 py-3 rounded-xl text-sm font-black border border-slate-200 hover:bg-white transition-all shadow-xl"
               >
                 إعادة التعيين
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
