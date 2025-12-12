import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IncidentService } from '../services/mockData';
import { Runbook } from '../types';
import { BookOpen, Plus, MoreVertical, Loader2, Lock } from 'lucide-react';

export default function Runbooks() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const user = IncidentService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchRunbooks = async () => {
      try {
        const data = await IncidentService.getRunbooks();
        setRunbooks(data);
      } finally {
        setLoading(false);
      }
    };
    fetchRunbooks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Runbook Library</h2>
          <p className="text-slate-400 text-sm mt-1">Automated procedures for incident response</p>
        </div>
        {isAdmin && (
            <Link 
            to="/runbooks/new"
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
            <Plus size={18} />
            New Runbook
            </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {runbooks.map((runbook) => (
          <div key={runbook.id} className="block group">
            {/* Conditional Linking: Only Admins can click to Edit */}
            {isAdmin ? (
                <Link to={`/runbooks/${runbook.id}`} className="block h-full">
                     <RunbookCard runbook={runbook} isAdmin={true} />
                </Link>
            ) : (
                <div className="h-full cursor-default">
                    <RunbookCard runbook={runbook} isAdmin={false} />
                </div>
            )}
          </div>
        ))}
        
        {/* Create New Card (Admin Only) */}
        {isAdmin && (
            <Link to="/runbooks/new" className="block">
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 transition-all h-full min-h-[250px] cursor-pointer">
                    <div className="p-4 rounded-full bg-slate-800 mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} className="opacity-70" />
                    </div>
                    <span className="font-medium">Create New Runbook</span>
                </div>
            </Link>
        )}
      </div>
    </div>
  );
}

const RunbookCard = ({ runbook, isAdmin }: { runbook: Runbook, isAdmin: boolean }) => (
    <div className={`bg-surface border border-slate-700 rounded-lg p-6 hover:border-slate-500 transition-colors h-full flex flex-col relative ${!isAdmin && 'hover:border-slate-700'}`}>
        <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20">
            <BookOpen size={24} />
        </div>
        {isAdmin ? (
            <div className="p-1 text-slate-500 hover:text-white rounded-full hover:bg-slate-700 transition-colors">
                <MoreVertical size={18} />
            </div>
        ) : (
            <div className="p-1 text-slate-600" title="Read Only">
                <Lock size={16} />
            </div>
        )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
            {runbook.name}
        </h3>
        <p className="text-slate-400 text-sm mb-4 flex-1">
        {runbook.steps.length} steps configured. Includes automated webhooks and notifications.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700 pt-4 mt-auto">
        <span className="bg-slate-800 px-2 py-1 rounded">Last run: 2 days ago</span>
        <span className="bg-slate-800 px-2 py-1 rounded text-green-500">Success: 100%</span>
        </div>
    </div>
);