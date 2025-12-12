import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { 
  AlertTriangle, 
  BookOpen, 
  Settings, 
  Bell, 
  Menu,
  ShieldAlert,
  LayoutDashboard,
  Search,
  X,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncidentList from './components/IncidentList';
import IncidentDetail from './components/IncidentDetail';
import Runbooks from './components/Runbooks';
import RunbookEditor from './components/RunbookEditor';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { IncidentService } from './services/mockData';
import { User } from './types';

// --- WORKER SIMULATION HOOK ---
const useWorkerSimulation = (isAuthenticated: boolean) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const processedCount = await IncidentService.processJobQueue();
      if (processedCount > 0) {
        console.log(`Worker processed ${processedCount} jobs`);
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

// --- RBAC PROTECTION WRAPPER ---
const ProtectedRoute = ({ user, allowedRoles, children }: { user: User | null, allowedRoles: string[], children?: React.ReactNode }) => {
    if (!user) return <Navigate to="/" replace />;
    
    if (!allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <Link to="/" className="mt-6 text-primary hover:underline">Return to Dashboard</Link>
            </div>
        );
    }
    
    return children ? <>{children}</> : <Outlet />;
};

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary/20 text-primary border-r-2 border-primary' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Layout = ({ user, children, onLogout }: { user: User; children?: React.ReactNode; onLogout: () => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-background text-slate-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2 justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">OpenDuty</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4">Platform</div>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/incidents" icon={AlertTriangle} label="Incidents" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/runbooks" icon={BookOpen} label="Runbooks" onClick={() => setIsMobileMenuOpen(false)} />
          
          {isAdmin && (
            <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-8">Admin</div>
                <NavItem to="/settings" icon={Settings} label="Settings" onClick={() => setIsMobileMenuOpen(false)} />
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${isAdmin ? 'bg-red-600' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
              {isAdmin ? <ShieldCheck size={14} /> : 'ME'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                 {user.role} {user.teamId && `• ${user.teamId === 'team-platform' ? 'Platform' : 'Other'}`}
              </div>
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-white" title="Logout">
                <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder={isAdmin ? "Search all incidents, runbooks, or users..." : "Search team incidents..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button className="p-2 text-slate-400 hover:text-white relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-slate-950"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>
            <span className="text-sm font-mono text-emerald-500 hidden md:flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              SYSTEM OPERATIONAL
            </span>
          </div>
        </header>

        <div className="p-4 md:p-6 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // Start the background worker simulation when logged in
  useWorkerSimulation(!!user);

  const handleLogout = () => {
    IncidentService.logout();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Public Routes (Accessible to both roles) */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/runbooks" element={<Runbooks />} />
          
          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute user={user} allowedRoles={['ADMIN']} />}>
            <Route path="/runbooks/new" element={<RunbookEditor />} />
            <Route path="/runbooks/:id" element={<RunbookEditor />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}