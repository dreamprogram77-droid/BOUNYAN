
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, encodeBase64, decodeAudioData, playRawAudio } from '../services/audioUtils';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isSpeaking?: boolean;
}

const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessingTTS, setIsProcessingTTS] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                if (isActive) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // معالجة النصوص الواردة
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'assistant' && !message.serverContent?.turnComplete) {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { id: Date.now().toString(), sender: 'assistant', text }];
              });
            }

            if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text }]);
            }

            // معالجة الصوت الوارد وتشغيله تلقائياً
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData && outputAudioContextRef.current) {
                const { source, duration } = await playRawAudio(
                  part.inlineData.data,
                  outputAudioContextRef.current,
                  nextStartTimeRef.current
                );
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime) + duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => {
            console.error(e);
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: "أنت مساعد مهندس ذكي متخصص في كود البناء السعودي. اسمك 'بنيان'. تتحدث بوضوح واحترافية وود. قدم إجابات دقيقة ومختصرة إلا إذا طُلب منك التفصيل."
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert("يرجى التأكد من تفعيل الميكروفون وصلاحيات الوصول.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionRef.current) return;
    
    const userMsg: VoiceMessage = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    
    sessionRef.current.sendRealtimeInput({ text: inputText });
    setInputText('');
  };

  const handleSpeakMessage = async (msg: VoiceMessage) => {
    if (isProcessingTTS) return;
    setIsProcessingTTS(msg.id);
    try {
      const audioBase64 = await generateSpeech(msg.text);
      if (audioBase64 && outputAudioContextRef.current) {
        await playRawAudio(audioBase64, outputAudioContextRef.current, 0);
      }
    } catch (err) {
      console.error("TTS failed", err);
    } finally {
      setIsProcessingTTS(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col h-[700px]">
        <div className="bg-indigo-600 p-6 text-center text-white shrink-0 relative">
          <div className={`w-16 h-16 mx-auto rounded-full bg-indigo-500/50 flex items-center justify-center mb-3 ${isActive ? 'animate-pulse' : ''}`}>
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold">بُنيان المساعد الذكي</h2>
          <p className="text-indigo-100 text-xs mt-1">متحدث خبير في الأكواد الهندسية</p>
          
          <button
            onClick={isActive ? stopSession : startSession}
            className={`absolute left-6 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isActive ? 'إيقاف' : 'تحدث الآن'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.length > 0 ? messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative group ${
                m.sender === 'user' ? 'bg-white text-slate-700 rounded-tr-none border border-slate-200' : 'bg-indigo-50 text-indigo-900 rounded-tl-none border border-indigo-100'
              }`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                
                <button 
                  onClick={() => handleSpeakMessage(m)}
                  disabled={!!isProcessingTTS}
                  className={`absolute -bottom-2 ${m.sender === 'user' ? '-right-2' : '-left-2'} bg-white p-1.5 rounded-full shadow-md border border-slate-100 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30`}
                  title="استمع للرسالة"
                >
                  {isProcessingTTS === m.id ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
               <p className="text-center italic">ابدأ التحدث أو اكتب استفسارك الهندسي هنا</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isActive ? "اكتب رسالتك للمساعد المباشر..." : "ابدأ الجلسة لتتمكن من المراسلة"}
              disabled={!isActive}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              type="submit"
              disabled={!isActive || !inputText.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              {isActive ? 'اتصال مباشر' : 'غير متصل'}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>تقنية تحويل النص لكلام مُفعلة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
