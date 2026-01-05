
import React, { useState, useRef, useEffect } from 'react';
import { editBlueprintImage } from '../services/geminiService';
import { ImageData } from '../types';

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        // Adding the missing 'name' property to comply with the ImageData interface.
        setImage({ 
          base64: (reader.result as string).split(',')[1], 
          mimeType: file.type,
          name: file.name 
        });
        setEditedUrl(null);
        resetZoom();
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
        resetZoom();
      } else {
        setError('لم نتمكن من تعديل الصورة. يرجى تجربة وصف آخر أو مخطط أوضح.');
      }
    } catch (err) {
      setError('حدث خطأ تقني أثناء معالجة المخطط. يرجى التحقق من اتصالك بالإنترنت.');
    } finally {
      setEditing(false);
    }
  };

  // Zoom/Pan Handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (!image && !editedUrl) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 1), 5);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">التعديل الذكي للمخططات</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-rose-700 dark:text-rose-300 text-sm font-bold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative ${image ? 'bg-indigo-50/20 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-700'}`}>
             <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={editing} />
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 ${image ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 shadow-sm'}`}>
                {image ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                )}
             </div>
             <p className={`font-bold ${image ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
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
              className="w-full p-5 h-40 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 outline-none transition-all resize-none font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest pointer-events-none">AI Prompting</div>
          </div>
          
          <button
            onClick={handleEdit}
            disabled={editing || !image || !prompt.trim()}
            className="group relative w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none flex items-center justify-center gap-3 overflow-hidden"
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

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col min-h-[600px] relative overflow-hidden transition-colors">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
           المعاينة الفورية
           {editing && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full animate-pulse">جاري التحليل...</span>}
        </h2>
        
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 rounded-[1.5rem] overflow-hidden relative transition-all duration-500 select-none ${editing ? 'bg-slate-100 dark:bg-slate-800 ring-4 ring-indigo-50 dark:ring-indigo-900/20' : 'bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800'} ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        >
          {editing && (
            <div className="absolute inset-0 z-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
               <div className="w-16 h-16 relative mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
               </div>
               <p className="text-slate-800 dark:text-white font-black text-lg mb-1">يتم الآن الرسم بواسطة الذكاء الاصطناعي</p>
               <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">هذه العملية قد تستغرق بضع ثوانٍ</p>
            </div>
          )}

          {(editedUrl || (image && `data:${image.mimeType};base64,${image.base64}`)) ? (
            <div 
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              className="w-full h-full"
            >
              <img 
                src={editedUrl || `data:${image!.mimeType};base64,${image!.base64}`} 
                className={`w-full h-full object-contain pointer-events-none transition-all duration-700 ${editing ? 'blur-sm opacity-50' : 'opacity-100'}`} 
                alt="المعاينة"
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 p-12 text-center">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-center mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="font-bold text-lg mb-1">لا توجد معاينة حالياً</p>
              <p className="text-sm">سيظهر المخطط المعدل هنا بعد الضغط على "تنفيذ التعديل الذكي"</p>
            </div>
          )}

          {/* Zoom Controls Overlay */}
          {(image || editedUrl) && !editing && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <button onClick={zoomIn} className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all" title="تكبير">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </button>
              <button onClick={zoomOut} className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all" title="تصغير">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
              </button>
              <button onClick={resetZoom} className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all" title="إعادة تعيين">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg text-center shadow-lg">
                {Math.round(scale * 100)}%
              </div>
            </div>
          )}
          
          {editedUrl && !editing && (
             <div className="absolute bottom-6 left-6 right-6 flex justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
               <div className="flex gap-3">
                 <a 
                   href={editedUrl} 
                   download="bunyan_edited_blueprint.png"
                   className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   تحميل المخطط المعدل
                 </a>
                 <button 
                   onClick={() => { setEditedUrl(null); resetZoom(); }}
                   className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl text-sm font-black border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-xl"
                 >
                   إعادة التعيين
                 </button>
               </div>
               <div className="hidden md:flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-slate-900/50 backdrop-blur px-4 rounded-xl">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
                 استخدم الفأرة للتحريك والتكبير
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
