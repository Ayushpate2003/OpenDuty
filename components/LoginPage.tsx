import React, { useState } from 'react';
import { ShieldAlert, Lock, User as UserIcon, ArrowRight, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { IncidentService } from '../services/mockData';
import { User } from '../types';

export default function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await IncidentService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('System error. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20">
                <ShieldAlert className="text-red-500" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">OpenDuty</h1>
            <p className="text-slate-400 text-sm mt-2">Sign in to access the Incident Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-md text-center">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="email" 
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="password" 
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>

            {/* Demo Credentials Box */}
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 text-xs text-slate-400 space-y-3">
                <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800 pb-2">
                    <Info size={14} className="text-blue-500" />
                    <span>Demo Access</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-500">Admin User</span>
                        <div className="text-right">
                            <div className="text-slate-300 font-mono">admin@openduty.io</div>
                            <div className="text-[10px] text-slate-600">pass: password</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                        <span className="font-medium text-slate-500">Regular User</span>
                        <div className="text-right">
                            <div className="text-slate-300 font-mono">user@openduty.io</div>
                            <div className="text-[10px] text-slate-600">pass: password</div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-3 border-t border-slate-800 mt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Role Permissions:</p>
                    <ul className="space-y-1">
                        <li className="flex items-start gap-1.5">
                            <CheckCircle2 size={12} className="text-green-500 mt-0.5" />
                            <span>Engineer: Team-scoped incidents, Runbook execution</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <ShieldAlert size={12} className="text-red-500 mt-0.5" />
                            <span>Admin: Full system access, Templates, Integrations</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="text-center text-xs text-slate-600">
                <p>Protected by corporate SSO policy.</p>
            </div>
        </form>
      </div>
    </div>
  );
}