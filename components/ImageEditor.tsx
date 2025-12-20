
import React, { useState } from 'react';
import { editBlueprintImage } from '../services/geminiService';
import { ImageData } from '../types';

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editing, setEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
        setEditedUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setEditing(true);
    try {
      const result = await editBlueprintImage(image, prompt);
      if (result) setEditedUrl(result);
    } catch (err) {
      alert('فشل في تعديل المخطط');
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">تحرير المخططات بالذكاء الاصطناعي</h2>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 relative">
             <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
             <p className="text-slate-500">ارفع المخطط الذي تود تعديله</p>
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="صف التعديل المطلوب (مثلاً: حدد مخارج الطوارئ باللون الأحمر، أو أضف فلتر توضيحي للعناصر الإنشائية)"
            className="w-full p-4 h-32 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all resize-none"
          />
          
          <button
            onClick={handleEdit}
            disabled={editing || !image}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {editing ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : 'تنفيذ التعديل الذكي'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
        <h2 className="text-xl font-bold mb-4">المعاينة</h2>
        <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative group">
          {editedUrl || (image && `data:${image.mimeType};base64,${image.base64}`) ? (
            <img 
              src={editedUrl || `data:${image!.mimeType};base64,${image!.base64}`} 
              className="w-full h-full object-contain" 
              alt="المعاينة"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
              سيظهر المخطط المعدل هنا
            </div>
          )}
          {editedUrl && (
             <a 
               href={editedUrl} 
               download="edited_blueprint.png"
               className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
             >
               تحميل المخطط
             </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
