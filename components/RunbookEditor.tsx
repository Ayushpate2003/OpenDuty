import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IncidentService } from '../services/mockData';
import { RunbookStep, Runbook } from '../types';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Activity, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RunbookEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const user = IncidentService.getCurrentUser();

  const [name, setName] = useState(isNew ? 'New Runbook' : '');
  const [steps, setSteps] = useState<RunbookStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Protect the route locally if accessed directly
  if (user?.role !== 'ADMIN') {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <ShieldAlert className="text-red-500 mb-4" size={48} />
              <h2 className="text-xl font-bold text-white">Unauthorized</h2>
              <p className="text-slate-400">You do not have permission to edit runbook templates.</p>
              <button onClick={() => navigate('/runbooks')} className="mt-4 text-primary hover:underline">Back to Library</button>
          </div>
      );
  }

  useEffect(() => {
    if (!isNew && id) {
      const loadRunbook = async () => {
        const existing = await IncidentService.getRunbook(id);
        if (existing) {
          setName(existing.name);
          setSteps(existing.steps);
        }
      };
      loadRunbook();
    }
  }, [id, isNew]);

  const addStep = () => {
    const newStep: RunbookStep = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Step',
      description: '',
      type: 'manual',
      completed: false
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<RunbookStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    const runbookId = isNew ? `rb-${Date.now()}` : id!;
    
    const runbook: Runbook = {
      id: runbookId,
      name,
      steps
    };

    try {
        await IncidentService.saveRunbook(runbook);
        navigate('/runbooks');
    } catch (err: any) {
        setError(err.message || 'Failed to save');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/runbooks')} 
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold bg-transparent text-white border-none focus:ring-0 placeholder-slate-500 w-full p-0"
            placeholder="Runbook Name"
          />
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-all disabled:opacity-50"
        >
          {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          Save Runbook
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded mb-4">
            {error}
        </div>
      )}

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="bg-surface border border-slate-700 rounded-lg p-6 relative group transition-all hover:border-slate-500">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 opacity-0 group-hover:opacity-100 cursor-move">
              <GripVertical size={20} />
            </div>

            <div className="flex gap-4 pl-4">
              <div className="flex-shrink-0 mt-1">
                 <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-400">
                    {index + 1}
                 </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start gap-4">
                   <input 
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, { title: e.target.value })}
                      className="flex-1 bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-primary focus:outline-none"
                      placeholder="Step Title"
                   />
                   <select 
                      value={step.type}
                      onChange={(e) => updateStep(step.id, { type: e.target.value as any })}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none"
                   >
                      <option value="manual">Manual Task</option>
                      <option value="notify">Notify Channel</option>
                      <option value="http">Webhook (HTTP)</option>
                   </select>
                </div>

                <textarea 
                   value={step.description}
                   onChange={(e) => updateStep(step.id, { description: e.target.value })}
                   className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none resize-none"
                   rows={2}
                   placeholder="Instructions for this step..."
                />

                {(step.type === 'notify' || step.type === 'http') && (
                    <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-800">
                        {step.type === 'notify' ? <MessageSquare size={16} className="text-blue-400" /> : <Activity size={16} className="text-purple-400" />}
                        <input 
                            type="text"
                            value={step.target || ''}
                            onChange={(e) => updateStep(step.id, { target: e.target.value })}
                            className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:ring-0 placeholder-slate-600"
                            placeholder={step.type === 'notify' ? 'Channel (e.g., #ops-team)' : 'URL (e.g., https://api.internal/restart)'}
                        />
                    </div>
                )}
              </div>

              <button 
                onClick={() => removeStep(step.id)}
                className="text-slate-500 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        <button 
          onClick={addStep}
          className="w-full py-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} />
          Add Runbook Step
        </button>
      </div>
    </div>
  );
}