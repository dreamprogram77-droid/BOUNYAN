
export enum AppMode {
  HOME = 'home',
  PRICING = 'pricing',
  LOGIN = 'login',
  REGISTER = 'register',
  COMPLIANCE = 'compliance',
  VOICE_ASSISTANT = 'voice',
  SEARCH = 'search',
  IMAGE_EDITOR = 'image-editor'
}

export interface AnalysisResult {
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  executiveSummary: string;
  details: string;
  recommendations: string[];
  references: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  groundingSources?: Array<{
    web?: { uri: string; title: string };
    maps?: { uri: string; title: string };
  }>;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}
