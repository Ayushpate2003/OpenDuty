import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Webhook, Radio, Check, ShieldAlert, Save, X, Loader2 } from 'lucide-react';
import { IncidentService } from '../services/mockData';

interface IntegrationConfig {
  id?: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  config: Record<string, string>;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATION_TYPES: Record<string, Omit<IntegrationConfig, 'enabled' | 'config' | 'id'>> = {
  matrix: {
    type: 'matrix',
    name: 'Matrix',
    description: 'Send alerts to Matrix rooms.',
    icon: MessageSquare,
    fields: [
        { key: 'homeServer', label: 'Home Server URL', placeholder: 'https://matrix.org' },
        { key: 'accessToken', label: 'Access Token', placeholder: 'syt_...' },
        { key: 'roomId', label: 'Default Room ID', placeholder: '!abc:matrix.org' }
    ]
  },
  mattermost: {
    type: 'mattermost',
    name: 'Mattermost',
    description: 'Incoming Webhooks integration.',
    icon: MessageSquare,
    fields: [
        { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://mattermost.your-company.com/hooks/...' }
    ]
  },
  email: {
    type: 'email',
    name: 'SMTP Email',
    description: 'Send email notifications.',
    icon: Mail,
    fields: [
        { key: 'host', label: 'SMTP Host', placeholder: 'mailhog' },
        { key: 'port', label: 'SMTP Port', placeholder: '1025' },
        { key: 'from', label: 'From Address', placeholder: 'alerts@openduty.io' },
        { key: 'defaultRecipient', label: 'Default Recipient', placeholder: 'team@company.com' }
    ]
  },
  webhook: {
    type: 'webhook',
    name: 'Generic Webhook',
    description: 'POST JSON payload on events.',
    icon: Webhook,
    fields: [
        { key: 'url', label: 'Target URL', placeholder: 'https://api.internal/incidents' }
    ]
  }
};

export default function SettingsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const user = IncidentService.getCurrentUser();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
        const res = await fetch('/api/integrations');
        if (res.ok) {
            const data = await res.json();
            setChannels(data);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (type: string, existing?: any) => {
    setEditingId(existing?.id || type); // Use type as temporary ID for new
    setEditForm(existing || { 
        type, 
        name: INTEGRATION_TYPES[type].name, 
        enabled: true, 
        config: {} 
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const res = await fetch('/api/integrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        });
        if (res.ok) {
            await fetchIntegrations();
            setEditingId(null);
        }
    } finally {
        setSaving(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh]">
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Integrations</h2>
        <p className="text-slate-400">Manage connections to external messaging and alert systems.</p>
      </div>

      <div className="space-y-4">
        {Object.values(INTEGRATION_TYPES).map((def) => {
            const existing = channels.find(c => c.type === def.type);
            const isEditing = editingId === (existing?.id || def.type);
            const Icon = def.icon;

            return (
                <div key={def.type} className={`bg-surface border ${isEditing ? 'border-primary' : 'border-slate-700'} rounded-lg p-6 transition-all`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex gap-4">
                            <div className={`p-3 rounded-lg h-fit ${existing?.enabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    {def.name}
                                    {existing?.enabled && <span className="text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1 max-w-sm">{def.description}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleEdit(def.type, existing)}
                            className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${
                                existing?.enabled
                                ? 'border-green-500/30 text-green-500 bg-green-500/10' 
                                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            {existing ? 'Configure' : 'Connect'}
                        </button>
                    </div>

                    {isEditing && (
                        <div className="mt-6 pt-6 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 gap-4 mb-4">
                                {def.fields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{field.label}</label>
                                        <input 
                                            type={field.type || 'text'}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-primary focus:outline-none"
                                            placeholder={field.placeholder}
                                            value={editForm.config?.[field.key] || ''}
                                            onChange={e => setEditForm({
                                                ...editForm,
                                                config: { ...editForm.config, [field.key]: e.target.value }
                                            })}
                                        />
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox"
                                        id={`enable-${def.type}`}
                                        checked={editForm.enabled}
                                        onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`enable-${def.type}`} className="text-sm text-slate-300">Enable this integration</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setEditingId(null)}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="animate-spin" size={14} />}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}