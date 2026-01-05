
import { AnalysisResult, AuditType, Project } from '../types';

export interface AuditRecord {
  id: string;
  projectId: string;
  timestamp: string;
  type: AuditType;
  result: AnalysisResult;
}

const STORAGE_KEYS = {
  PROJECTS: 'bunyan_db_projects',
  AUDITS: 'bunyan_db_audits',
  TASKS: 'bunyan_db_tasks'
};

export const databaseService = {
  // Projects Operations
  getProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  saveProject: (project: Project) => {
    const projects = databaseService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  deleteProject: (id: string) => {
    const projects = databaseService.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  // Audits Operations
  saveAuditRecord: (record: AuditRecord) => {
    const audits = databaseService.getAudits();
    audits.unshift(record);
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits.slice(0, 50))); // Keep last 50
  },

  getAudits: (): AuditRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return data ? JSON.parse(data) : [];
  },

  getProjectAudits: (projectId: string): AuditRecord[] => {
    return databaseService.getAudits().filter(a => a.projectId === projectId);
  },

  // Tasks Operations
  getTasks: (projectId?: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks = data ? JSON.parse(data) : [];
    return projectId ? tasks.filter((t: any) => t.projectId === projectId) : tasks;
  },

  saveTasks: (tasks: any[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }
};
