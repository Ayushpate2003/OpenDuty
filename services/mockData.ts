import { Incident, IncidentSeverity, IncidentStatus, TimelineEvent, Runbook, User, Job } from '../types';

let currentUser: User | null = null;

// Helper for API calls
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
     try {
        const err = await res.json();
        throw new Error(err.error || 'API Error');
     } catch (e) {
        throw new Error(`API Error: ${res.statusText}`);
     }
  }
  return res.json();
}

export const IncidentService = {
  // Auth
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      currentUser = user;
      return user;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  logout: () => {
    currentUser = null;
  },

  getCurrentUser: () => currentUser,

  // Incidents
  getIncidents: async () => {
    if (!currentUser) return [];
    const query = currentUser.role === 'ADMIN' ? `?role=ADMIN` : `?teamId=${currentUser.teamId}`;
    return apiFetch(`/incidents${query}`);
  },
  
  getIncident: async (id: string) => {
    try {
      return await apiFetch(`/incidents/${id}`);
    } catch (e) {
      return undefined;
    }
  },
  
  createIncident: async (data: { title: string; description: string; severity: IncidentSeverity; commander: string }) => {
    if (!currentUser) throw new Error("Unauthorized");
    return apiFetch('/incidents', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        teamId: currentUser.teamId
      }),
    });
  },
  
  updateIncidentStatus: async (id: string, status: IncidentStatus) => {
    return apiFetch(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Timeline
  getTimeline: async (incidentId: string) => {
    return apiFetch(`/incidents/${incidentId}/timeline`);
  },
  
  addTimelineEvent: async (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => {
    return apiFetch(`/incidents/${event.incidentId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  // Synchronous internal helper - removed as we are now async DB backed
  // We keep the signature for compatibility but it calls the API.
  addTimelineEventSync: (event: any) => {
     console.warn('Sync event addition deprecated');
     return event;
  },

  // Runbooks
  getRunbooks: async () => {
    return apiFetch('/runbooks');
  },
  
  getRunbook: async (id: string) => {
    return apiFetch(`/runbooks/${id}`);
  },

  saveRunbook: async (runbook: Runbook) => {
    return apiFetch('/runbooks', {
      method: 'POST',
      body: JSON.stringify(runbook),
    });
  },

  // Worker / Jobs
  queueJob: async (jobData: Omit<Job, 'id' | 'status' | 'createdAt'>) => {
    return apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Deprecated client-side worker simulation
  processJobQueue: async () => {
    // In the real app, the server-side worker handles this.
    // We return 0 to stop the client-side loop from doing anything.
    return 0;
  }
};