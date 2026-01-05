
export enum AppMode {
  HOME = 'home',
  PRICING = 'pricing',
  LOGIN = 'login',
  REGISTER = 'register',
  COMPLIANCE = 'compliance',
  VOICE_ASSISTANT = 'voice',
  SEARCH = 'search',
  IMAGE_EDITOR = 'image-editor',
  CLIENT_DASHBOARD = 'dashboard',
  SITE_EXPLORER = 'site-explorer'
}

export enum AuditType {
  GENERAL = 'general',
  SAFETY = 'safety'
}

export interface DetailedFinding {
  text: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  category?: string;
  imageIndex?: number;
}

export interface AnalysisResult {
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  executiveSummary: string;
  details: string;
  recommendations: string[];
  references: string[];
  findings?: DetailedFinding[];
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
  name: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  lastUpdated: string;
}

export interface Order {
  id: string;
  type: 'compliance_check' | 'image_edit' | 'consultation';
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  projectName: string;
}
