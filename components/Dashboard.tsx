import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IncidentService } from '../services/mockData';
import { Link } from 'react-router-dom';
import { IncidentSeverity, IncidentStatus, Incident } from '../types';
import { AlertCircle, CheckCircle2, Clock, Activity, Plus, Play, AlertOctagon, AlertTriangle, Info, Loader2 } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-surface border border-slate-700 p-6 rounded-lg shadow-sm hover:border-slate-600 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-400 font-medium text-xs uppercase tracking-wider">{title}</h3>
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`text-${color}-500`} size={20} />
      </div>
    </div>
    <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold text-white">{value}</div>
        {trend && <div className="text-xs text-green-500 font-medium">{trend}</div>}
    </div>
  </div>
);

export const SeverityBadge = ({ severity }: { severity: IncidentSeverity }) => {
  const configs = {
    [IncidentSeverity.SEV1]: { color: 'red', icon: AlertOctagon },
    [IncidentSeverity.SEV2]: { color: 'orange', icon: AlertTriangle },
    [IncidentSeverity.SEV3]: { color: 'yellow', icon: AlertTriangle },
    [IncidentSeverity.SEV4]: { color: 'blue', icon: Info },
  };

  const config = configs[severity];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border border-${config.color}-500/20 bg-${config.color}-500/10 text-${config.color}-500`}>
      <Icon size={12} />
      {severity}
    </span>
  );
};

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const openIncidents = incidents.filter(i => i.status !== IncidentStatus.RESOLVED).length;
  const sev1Count = incidents.filter(i => i.severity === IncidentSeverity.SEV1 && i.status !== IncidentStatus.RESOLVED).length;
  
  const chartData = [
    { name: 'Mon', incidents: 4 },
    { name: 'Tue', incidents: 3 },
    { name: 'Wed', incidents: 7 },
    { name: 'Thu', incidents: 2 },
    { name: 'Fri', incidents: 5 },
    { name: 'Sat', incidents: 1 },
    { name: 'Sun', incidents: 2 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white tracking-tight">Operational Status</h2>
           <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              All systems nominal • Monitoring Active
           </div>
        </div>
        
        <div className="flex gap-3">
            <Link to="/incidents?create=true" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-red-900/20">
                <AlertTriangle size={18} />
                Declare Incident
            </Link>
            <Link to="/runbooks" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium border border-slate-700 transition-colors">
                <Play size={18} />
                Run Runbook
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Incidents" value={openIncidents} icon={AlertCircle} color="red" />
        <StatCard title="Critical (SEV1)" value={sev1Count} icon={Activity} color="red" />
        <StatCard title="MTTR (Avg)" value="45m" icon={Clock} color="blue" trend="-12% vs last week" />
        <StatCard title="Healthy Services" value="98.5%" icon={CheckCircle2} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-white">Incident Volume</h3>
             <select className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-slate-300">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
             </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  cursor={{ fill: '#334155', opacity: 0.3 }}
                />
                <Bar dataKey="incidents" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.incidents > 5 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-slate-700 rounded-lg p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Active Incidents</h3>
            <Link to="/incidents" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-3 flex-1 overflow-auto max-h-[350px] pr-2 custom-scrollbar">
            {incidents.filter(i => i.status !== IncidentStatus.RESOLVED).map(incident => (
              <Link to={`/incidents/${incident.id}`} key={incident.id} className="block group">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-600 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">{incident.id}</span>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <h4 className="font-medium text-slate-200 text-sm mb-1 leading-snug group-hover:text-primary transition-colors">{incident.title}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">
                            {incident.commander.charAt(0)}
                        </div>
                        {incident.commander}
                    </span>
                    <span>•</span>
                    <span>{new Date(incident.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </Link>
            ))}
            {openIncidents === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center">
                <div className="bg-slate-800/50 p-4 rounded-full mb-3">
                    <CheckCircle2 size={32} className="text-green-500/50" />
                </div>
                <p className="text-sm">No active incidents.</p>
                <p className="text-xs text-slate-600 mt-1">Great job keeping the systems healthy!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}