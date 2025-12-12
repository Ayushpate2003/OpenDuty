import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IncidentService } from '../services/mockData';
import { IncidentStatus, TimelineEvent, TimelineEventType, Incident } from '../types';
import { Send, CheckCircle2, AlertOctagon, MessageSquare, Play, FileText, Activity, Clock, Users, Check, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { SeverityBadge } from './Dashboard';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  
  const [incident, setIncident] = useState<Incident | undefined>(undefined);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newNote, setNewNote] = useState('');
  const [runbookSteps, setRunbookSteps] = useState(IncidentService.getRunbooks()[0]?.steps || []);
  const [activeTab, setActiveTab] = useState<'timeline' | 'postmortem'>('timeline');
  const [postmortemContent, setPostmortemContent] = useState('');
  
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        const [inc, evts] = await Promise.all([
            IncidentService.getIncident(id),
            IncidentService.getTimeline(id)
        ]);
        if (mounted) {
            setIncident(inc);
            setTimeline(evts.reverse());
            setLoading(false);
        }
    };
    loadData();
    return () => { mounted = false; };
  }, [id]);

  // Polling for updates (Simulates SSE)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
        const latestTimeline = await IncidentService.getTimeline(id);
        setTimeline(latestTimeline.reverse());
    }, 2000); // 2 second polling to see worker updates
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
     if (activeTab === 'timeline') {
        timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }
  }, [timeline, activeTab]);

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading Incident...</div>;
  if (!incident) return <div className="text-center py-20 text-slate-400">Incident not found</div>;

  const handleUpdateStatus = async (status: IncidentStatus) => {
    if (!id) return;
    setLoading(true);
    const updated = await IncidentService.updateIncidentStatus(id, status);
    if (updated) {
        setIncident({...updated});
        const newTimeline = await IncidentService.getTimeline(id);
        setTimeline(newTimeline.reverse());
    }
    setLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    
    await IncidentService.addTimelineEvent({
      incidentId: id,
      type: TimelineEventType.NOTE,
      content: newNote,
      author: 'You'
    });
    
    const newTimeline = await IncidentService.getTimeline(id);
    setTimeline(newTimeline.reverse());
    setNewNote('');
  };

  const executeRunbookStep = (stepId: string) => {
    if (!id) return;

    // Local Optimistic Update
    setRunbookSteps(steps => steps.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
    
    const step = runbookSteps.find(s => s.id === stepId);
    if (step && !step.completed) {
        // If it is an automated step (http/notify), we queue it for the Worker
        if (step.type !== 'manual') {
            IncidentService.queueJob({
                type: 'RUNBOOK_STEP',
                payload: {
                    incidentId: id,
                    stepId: step.id,
                    runbookName: 'Current Runbook',
                    actionType: step.type,
                    target: step.target || 'Unknown'
                }
            });
            // Add initial "Queued" log
            IncidentService.addTimelineEvent({
                incidentId: id,
                type: TimelineEventType.RUNBOOK_ACTION,
                content: `Queued automated step: ${step.title} (Worker will process)`,
                author: 'System'
            });
        } else {
            // Manual step just logs immediately
            IncidentService.addTimelineEvent({
                incidentId: id,
                type: TimelineEventType.RUNBOOK_ACTION,
                content: `Manual step completed: ${step.title}`,
                author: 'You'
            });
        }
    }
  };

  const generatePostmortem = async () => {
    if (!id) return;
    const events = await IncidentService.getTimeline(id);
    const startTime = new Date(incident.createdAt);
    const endTime = incident.status === IncidentStatus.RESOLVED ? new Date(incident.updatedAt) : new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    const report = `
# Postmortem: ${incident.title}

**Date:** ${startTime.toLocaleDateString()}
**Duration:** ${durationMinutes} minutes
**Severity:** ${incident.severity}
**Status:** ${incident.status}

## Summary
${incident.description}

## Timeline
${events.map(e => `- **${new Date(e.createdAt).toLocaleTimeString()}**: ${e.content} (${e.author})`).join('\n')}

## Root Cause Analysis
[TODO: Enter root cause here]

## Action Items
- [ ] Create regression test
- [ ] Update monitoring thresholds
    `.trim();
    
    setPostmortemContent(report);
    setActiveTab('postmortem');
  };

  const getDuration = () => {
      const start = new Date(incident.createdAt).getTime();
      const end = incident.status === IncidentStatus.RESOLVED ? new Date(incident.updatedAt).getTime() : Date.now();
      const diff = Math.floor((end - start) / 1000 / 60);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
  };

  // Group timeline by date
  const groupedTimeline = timeline.reduce((groups, event) => {
    const date = new Date(event.createdAt);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    
    let key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case TimelineEventType.ALERT: return <AlertOctagon className="text-red-500" size={16} />;
      case TimelineEventType.STATUS_CHANGE: return <CheckCircle2 className="text-blue-500" size={16} />;
      case TimelineEventType.RUNBOOK_ACTION: return <Play className="text-green-500" size={16} />;
      default: return <MessageSquare className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/incidents" className="hover:text-slate-300">Incidents</Link>
        <ChevronRight size={14} />
        <span className="text-slate-300 font-mono">{incident.id}</span>
      </div>

      {/* Header */}
      <div className="bg-surface border border-slate-700 p-6 rounded-lg flex flex-col md:flex-row justify-between items-start gap-6 shrink-0 shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <SeverityBadge severity={incident.severity} />
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                incident.status === IncidentStatus.OPEN ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                incident.status === IncidentStatus.ACKNOWLEDGED ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                'bg-green-500/10 text-green-500 border-green-500/20'
            }`}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{incident.title}</h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">{incident.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 mt-4 text-xs font-medium text-slate-500">
             <div className="flex items-center gap-1.5">
                <Users size={14} />
                <span>Commander: <span className="text-slate-300">{incident.commander}</span></span>
             </div>
             <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>Duration: <span className="text-slate-300">{getDuration()}</span></span>
             </div>
             <div className="flex items-center gap-1.5">
                <Activity size={14} />
                <span>Started: <span className="text-slate-300">{new Date(incident.createdAt).toLocaleString()}</span></span>
             </div>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
            {incident.status === IncidentStatus.OPEN && (
                <button 
                  onClick={() => handleUpdateStatus(IncidentStatus.ACKNOWLEDGED)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-orange-900/20 text-sm"
                >
                    Acknowledge
                </button>
            )}
            {incident.status !== IncidentStatus.RESOLVED ? (
                <button 
                    onClick={() => handleUpdateStatus(IncidentStatus.RESOLVED)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-green-900/20 text-sm"
                >
                    Resolve
                </button>
            ) : (
                <button 
                    onClick={() => handleUpdateStatus(IncidentStatus.OPEN)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                    Reopen
                </button>
            )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden min-h-0">
        {/* Left Column: Timeline / Postmortem */}
        <div className="flex-1 bg-surface border border-slate-700 rounded-lg flex flex-col min-h-0 shadow-sm">
          <div className="flex items-center border-b border-slate-700 px-2 bg-slate-900/30 rounded-t-lg">
             <button 
                onClick={() => setActiveTab('timeline')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
             >
                <div className="flex items-center gap-2">
                    <Activity size={16} /> Timeline
                </div>
             </button>
             <button 
                onClick={() => {
                    if (!postmortemContent) generatePostmortem();
                    setActiveTab('postmortem');
                }}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'postmortem' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
             >
                 <div className="flex items-center gap-2">
                    <FileText size={16} /> Postmortem
                </div>
             </button>
             <div className="ml-auto px-4 flex items-center gap-2 text-xs text-slate-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Updates
             </div>
          </div>
          
          {activeTab === 'timeline' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {Object.keys(groupedTimeline).length === 0 && <div className="text-center text-slate-500 mt-10">No events yet.</div>}
                    
                    {Object.entries(groupedTimeline).map(([date, events]: [string, TimelineEvent[]]) => (
                        <div key={date} className="relative">
                            <div className="sticky top-0 z-20 flex justify-center mb-6">
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-slate-700 shadow-sm">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-6">
                                {events.map((event) => (
                                <div key={event.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                    <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg z-10 group-hover:border-slate-500 transition-colors shadow-sm">
                                        {getEventIcon(event.type)}
                                    </div>
                                    <div className="w-[1px] bg-slate-800 h-full -mb-6 mt-2"></div>
                                    </div>
                                    <div className="pb-2 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-200">{event.author}</span>
                                        <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap group-hover:border-slate-700 transition-colors">
                                        {event.content}
                                    </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div ref={timelineEndRef} />
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-700 shrink-0 rounded-b-lg">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note or update..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button type="submit" className="bg-primary hover:bg-blue-600 text-white p-2.5 rounded-md transition-colors shadow-sm">
                        <Send size={18} />
                    </button>
                    </form>
                </div>
              </>
          ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="p-4 bg-yellow-500/10 border-b border-slate-700 text-yellow-500 text-sm flex items-center gap-2 shrink-0">
                      <AlertOctagon size={16} />
                      <span>This report is auto-generated. You can edit it below.</span>
                      <button onClick={generatePostmortem} className="ml-auto underline hover:text-yellow-400">Regenerate</button>
                  </div>
                  <textarea 
                    className="flex-1 w-full bg-slate-950 p-6 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                    value={postmortemContent}
                    onChange={(e) => setPostmortemContent(e.target.value)}
                    spellCheck={false}
                  />
              </div>
          )}
        </div>

        {/* Right Column: Runbooks */}
        <div className="lg:w-96 bg-surface border border-slate-700 rounded-lg flex flex-col min-h-0 shadow-sm">
          <div className="p-4 border-b border-slate-700 shrink-0 bg-slate-900/30 rounded-t-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-200">Active Runbook</h3>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded cursor-pointer hover:bg-primary/20 border border-primary/20">Change</span>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="font-medium text-white text-sm mb-2">{IncidentService.getRunbooks()[0]?.name}</div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span>{Math.round((runbookSteps.filter(s => s.completed).length / runbookSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-green-500 h-full transition-all duration-500 ease-out" 
                        style={{ width: `${(runbookSteps.filter(s => s.completed).length / runbookSteps.length) * 100}%` }}
                    ></div>
                </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <div className="relative">
                {/* Vertical Line for Stepper */}
                <div className="absolute left-3.5 top-2 bottom-6 w-0.5 bg-slate-800 z-0"></div>
                
                <div className="space-y-6 relative z-10">
                    {runbookSteps.map((step, index) => (
                    <div key={step.id} className="flex gap-4 group">
                        <button 
                            onClick={() => executeRunbookStep(step.id)}
                            disabled={step.completed}
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-200 bg-surface
                                ${step.completed 
                                    ? 'border-green-500 text-green-500 hover:bg-green-500/10 cursor-default' 
                                    : 'border-slate-600 text-slate-600 hover:border-slate-400 hover:text-slate-400 hover:scale-110 active:scale-95 cursor-pointer'}
                            `}
                        >
                            {step.completed ? <Check size={16} /> : <span className="text-xs font-bold">{index + 1}</span>}
                        </button>
                        
                        <div className={`flex-1 transition-opacity duration-200 ${step.completed ? 'opacity-60' : 'opacity-100'}`}>
                            <h4 className={`text-sm font-medium mb-1 ${step.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                {step.title}
                            </h4>
                            <p className="text-xs text-slate-500 mb-2">{step.description}</p>
                            
                            {step.type === 'http' && (
                                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400">
                                    <Activity size={10} /> webhook: {step.target}
                                </div>
                            )}
                            {step.type === 'notify' && (
                                <div className="inline-flex items-center gap-1.5 text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400">
                                    <MessageSquare size={10} /> notify: {step.target}
                                </div>
                            )}
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}