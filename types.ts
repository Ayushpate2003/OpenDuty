export enum IncidentSeverity {
  SEV1 = 'SEV1', // Critical
  SEV2 = 'SEV2', // High
  SEV3 = 'SEV3', // Moderate
  SEV4 = 'SEV4', // Low
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export enum TimelineEventType {
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  RUNBOOK_ACTION = 'RUNBOOK_ACTION',
  ALERT = 'ALERT',
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  type: TimelineEventType;
  content: string;
  author: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  commander: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string; // RBAC Scoping
}

export interface RunbookStep {
  id: string;
  title: string;
  description: string;
  type: 'manual' | 'notify' | 'http';
  target?: string; // e.g., webhook URL or channel ID
  completed: boolean;
  autoExecute?: boolean; // If true, worker picks this up
}

export interface Runbook {
  id: string;
  name: string;
  steps: RunbookStep[];
}

export interface NotificationChannel {
  id: string;
  type: 'matrix' | 'mattermost' | 'email' | 'ntfy';
  name: string;
  config: Record<string, string>;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER';
  teamId?: string; // For team-scoped access
}

// For Worker Simulation
export interface Job {
  id: string;
  type: 'RUNBOOK_STEP';
  payload: {
    incidentId: string;
    stepId: string;
    runbookName: string;
    actionType: 'notify' | 'http';
    target: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}