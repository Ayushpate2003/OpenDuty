import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IncidentService } from '../services/mockData';
import { IncidentSeverity, IncidentStatus, Incident } from '../types';
import { Filter, Search, Plus, X, AlertTriangle, ChevronRight, User, Loader2 } from 'lucide-react';
import { SeverityBadge } from './Dashboard';

const CreateIncidentModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: IncidentSeverity.SEV3,
    commander: 'You (On-Call)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onCreate(formData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20">
                <AlertTriangle size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">Declare Incident</h3>
                <p className="text-xs text-slate-400">Trigger runbooks and notify stakeholders</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Incident Title</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
              placeholder="e.g., API Latency Spike in Production"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Severity</label>
                <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                value={formData.severity}
                onChange={e => setFormData({...formData, severity: e.target.value as IncidentSeverity})}
                >
                {Object.values(IncidentSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Commander</label>
                <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                    type="text"
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-slate-500 cursor-not-allowed font-mono text-sm"
                    value={formData.commander}
                    />
                </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description & Impact</label>
            <textarea 
              required
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner resize-none"
              placeholder="Describe the symptoms, affected services, and customer impact..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors font-medium text-sm">Cancel</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              Declare Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await IncidentService.getIncidents();
        setIncidents(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Auto-open modal if ?create=true
    if (searchParams.get('create') === 'true') {
        setIsModalOpen(true);
        // Clear param so refresh doesn't reopen
        setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreate = async (data: any) => {
    await IncidentService.createIncident(data);
    const updated = await IncidentService.getIncidents();
    setIncidents(updated);
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'OPEN' && incident.status === IncidentStatus.RESOLVED) return false;
    if (filter === 'RESOLVED' && incident.status !== IncidentStatus.RESOLVED) return false;
    
    if (search) {
      const q = search.toLowerCase();
      return (
        incident.id.toLowerCase().includes(q) ||
        incident.title.toLowerCase().includes(q) ||
        incident.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.OPEN: return 'text-red-400 bg-red-400/10 border-red-400/20';
      case IncidentStatus.ACKNOWLEDGED: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case IncidentStatus.RESOLVED: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Incidents</h2>
          <p className="text-slate-400 text-sm mt-1">Manage, track, and resolve system incidents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} />
          Create Incident
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-surface border border-slate-700 p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search incidents by ID, title, tags..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary cursor-pointer hover:bg-slate-800 transition-colors"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open & Ack</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-md text-sm hover:bg-slate-800 hover:text-white text-slate-300 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="bg-surface border border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                <th className="px-6 py-4 whitespace-nowrap">ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Severity</th>
                <th className="px-6 py-4 w-1/3">Title</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Commander</th>
                <th className="px-6 py-4 whitespace-nowrap">Created</th>
                <th className="px-6 py-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
                {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{incident.id}</td>
                    <td className="px-6 py-4">
                        <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-6 py-4">
                        <span className="font-medium text-slate-200 block truncate max-w-[300px]" title={incident.title}>{incident.title}</span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(incident.status)}`}>
                        {incident.status}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                {incident.commander.charAt(0)}
                            </div>
                            <span className="text-slate-400">{incident.commander}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(incident.createdAt).toLocaleDateString()} <span className="text-slate-600">{new Date(incident.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Link 
                            to={`/incidents/${incident.id}`} 
                            className="inline-flex items-center gap-1 text-primary hover:text-blue-400 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            View Details <ChevronRight size={14} />
                        </Link>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-800 rounded-full">
                            <Search size={24} className="text-slate-600" />
                        </div>
                        <p>No incidents found matching your criteria.</p>
                        <button onClick={() => {setFilter('ALL'); setSearch('')}} className="text-primary hover:underline text-xs">Clear filters</button>
                    </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      <CreateIncidentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
}