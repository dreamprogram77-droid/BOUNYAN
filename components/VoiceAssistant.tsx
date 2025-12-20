
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

type PersonalityType = 'formal' | 'friendly' | 'concise';

interface PersonalityConfig {
  id: PersonalityType;
  label: string;
  instruction: string;
  voiceName: string;
  description: string;
}

const PERSONALITIES: PersonalityConfig[] = [
  {
    id: 'formal',
    label: 'رسمي',
    description: 'خبير هندسي لغوي دقيق',
    instruction: "أنت خبير هندسي رسمي جداً. تتحدث بلغة عربية فصحى رفيعة المستوى. تركز على المصطلحات القانونية والهندسية الدقيقة وكود البناء السعودي. إجاباتك مفصلة وشاملة.",
    voiceName: 'Kore'
  },
  {
    id: 'friendly',
    label: 'ودي',
    description: 'مساعد متعاون وودود',
    instruction: "أنت مساعد هندسي ودود ومتعاون اسمك 'بنيان'. تتحدث بلغة عربية سلسلة وواضحة. تحاول تبسيط المفاهيم المعقدة وتقديم الدعم بروح إيجابية وكأنك زميل عمل.",
    voiceName: 'Zephyr'
  },
  {
    id: 'concise',
    label: 'مختصر',
    description: 'عملي وسريع النتائج',
    instruction: "أنت مساعد مهندس عملي جداً. إجاباتك مباشرة ومختصرة للغاية. تركز فقط على الحقائق والأرقام والبنود المحددة في كود البناء دون مقدمات أو إطالة.",
    voiceName: 'Puck'
  }
];

const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessingTTS, setIsProcessingTTS] = useState<string | null>(null);
  const [currentPersonality, setCurrentPersonality] = useState<PersonalityConfig>(PERSONALITIES[1]); // Default to Friendly
  
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
