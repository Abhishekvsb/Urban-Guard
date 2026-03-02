import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Settings, 
  LogOut, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Lock, 
  User as UserIcon,
  Database,
  BarChart3,
  Search,
  Power,
  Droplets,
  Trash2,
  Lightbulb,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Info,
  Globe,
  Server,
  Cpu,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { User, UserRole, InfrastructureItem, AuditLog, Stats } from "./types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  OPERATOR: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  VIEWER: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  EMERGENCY: "text-red-400 bg-red-400/10 border-red-400/20",
};

const INFRA_ICONS: Record<string, any> = {
  Power: Power,
  Water: Droplets,
  Traffic: Activity,
  Waste: Trash2,
  Lighting: Lightbulb,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "infrastructure" | "logs">("dashboard");
  const [infra, setInfra] = useState<InfrastructureItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("urban_guard_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const headers = { "x-user-id": user.id.toString() };
      
      if (activeTab === "dashboard") {
        const [infraRes, statsRes] = await Promise.all([
          fetch("/api/infrastructure", { headers }),
          fetch("/api/stats", { headers })
        ]);
        setInfra(await infraRes.json());
        setStats(await statsRes.json());
      } else if (activeTab === "infrastructure") {
        const res = await fetch("/api/infrastructure", { headers });
        setInfra(await res.json());
      } else if (activeTab === "logs" && user.role === "ADMIN") {
        const res = await fetch("/api/logs", { headers });
        setLogs(await res.json());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("urban_guard_user", JSON.stringify(data));
      } else {
        setError("Invalid credentials. Try admin/admin123 or operator/op123");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("urban_guard_user");
    setUsername("");
    setPassword("");
  };

  const toggleInfra = async (id: number, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === "Active" ? "Maintenance" : "Active";
    try {
      const res = await fetch(`/api/infrastructure/${id}/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id.toString()
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Permission denied");
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">UrbanGuard</h1>
            <p className="text-slate-400 text-sm mt-1">City Infrastructure Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? "Authenticating..." : (
                <>
                  <Lock className="w-4 h-4" />
                  Secure Login
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
            <p className="text-[10px] text-emerald-500/50 font-medium tracking-wider">Created By VSBEC IT STUDENTS</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#0A0A0A] border-r border-white/5 transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-white">UrbanGuard</span>}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem 
            icon={BarChart3} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem 
            icon={Activity} 
            label="Infrastructure" 
            active={activeTab === "infrastructure"} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab("infrastructure")}
          />
          {user.role === "ADMIN" && (
            <SidebarItem 
              icon={Clock} 
              label="Audit Logs" 
              active={activeTab === "logs"} 
              collapsed={!isSidebarOpen}
              onClick={() => setActiveTab("logs")}
            />
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          {isSidebarOpen && (
            <div className="mb-4 px-3">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Created By</p>
              <p className="text-[10px] text-emerald-500/60 font-medium">VSBEC IT STUDENTS</p>
            </div>
          )}
          <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", ROLE_COLORS[user.role].split(' ')[0])}>{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-bottom border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Online</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsSettingsOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Settings className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Portal Configuration</h3>
                        <p className="text-xs text-slate-500">Manage system-wide portal settings and security</p>
                      </div>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Security & Access</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-slate-300">Auto-Logout</span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">15m</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-slate-300">IP Whitelisting</span>
                          </div>
                          <div className="w-8 h-4 bg-emerald-500/20 rounded-full relative">
                            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-emerald-500 rounded-full" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-slate-300">2FA Enforcement</span>
                          </div>
                          <div className="w-8 h-4 bg-slate-800 rounded-full relative">
                            <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-600 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">System Information</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <Server className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Portal Version</p>
                            <p className="text-sm text-white font-mono">v2.4.0-stable</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <Cpu className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Node Environment</p>
                            <p className="text-sm text-white font-mono">Production</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <RefreshCw className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Last System Sync</p>
                            <p className="text-sm text-white font-mono">{new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">UrbanGuard Security Protocol v4.1</p>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all">
                      Download Audit Report
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="Total Assets" 
                    value={stats?.total.count || 0} 
                    icon={Database} 
                    color="blue" 
                  />
                  <StatCard 
                    label="Operational" 
                    value={stats?.active.count || 0} 
                    icon={CheckCircle} 
                    color="emerald" 
                  />
                  <StatCard 
                    label="Maintenance" 
                    value={stats?.maintenance.count || 0} 
                    icon={AlertTriangle} 
                    color="amber" 
                  />
                  <StatCard 
                    label="Audit Logs" 
                    value={stats?.logsCount.count || 0} 
                    icon={Clock} 
                    color="purple" 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Health Chart */}
                  <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        Infrastructure Health Scores
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Real-time Data</span>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={infra}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="health_score" radius={[4, 4, 0, 0]}>
                            {infra.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.health_score > 90 ? '#10b981' : entry.health_score > 70 ? '#f59e0b' : '#ef4444'} 
                                fillOpacity={0.8}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribution */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-blue-500" />
                      Status Distribution
                    </h3>
                    <div className="h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: stats?.active.count || 0 },
                              { name: 'Maintenance', value: stats?.maintenance.count || 0 },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-400">Active</span>
                        </div>
                        <span className="font-bold text-white">{stats?.active.count}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-slate-400">Maintenance</span>
                        </div>
                        <span className="font-bold text-white">{stats?.maintenance.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "infrastructure" && (
              <motion.div 
                key="infrastructure"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white">City Assets</h3>
                    <p className="text-slate-500 text-sm">Manage and monitor urban infrastructure components</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search assets..." 
                      className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64"
                    />
                  </div>
                </div>

                {/* Infrastructure Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Inventory</p>
                      <p className="text-lg font-bold text-white">{infra.length} Assets</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg. Health Index</p>
                      <p className="text-lg font-bold text-white">
                        {infra.length > 0 ? Math.round(infra.reduce((acc, curr) => acc + curr.health_score, 0) / infra.length) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">System Reliability</p>
                      <p className="text-lg font-bold text-white">
                        {infra.length > 0 ? Math.round((infra.filter(i => i.status === 'Active').length / infra.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {infra.map((item) => {
                    const Icon = INFRA_ICONS[item.type] || Activity;
                    return (
                      <motion.div 
                        key={item.id}
                        layoutId={`infra-${item.id}`}
                        className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                            item.status === 'Active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            item.status === 'Active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          )}>
                            {item.status}
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-1">{item.name}</h4>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health Index</span>
                            <span className={cn(
                              "text-xs font-bold",
                              item.health_score > 90 ? "text-emerald-500" : "text-amber-500"
                            )}>{item.health_score}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.health_score}%` }}
                              className={cn(
                                "h-full rounded-full",
                                item.health_score > 90 ? "bg-emerald-500" : "bg-amber-500"
                              )}
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                          <button 
                            onClick={() => toggleInfra(item.id, item.status)}
                            disabled={!["ADMIN", "OPERATOR", "EMERGENCY"].includes(user.role)}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                              item.status === 'Active' 
                                ? "bg-white/5 text-slate-300 hover:bg-white/10" 
                                : "bg-emerald-500 text-black hover:bg-emerald-600",
                              !["ADMIN", "OPERATOR", "EMERGENCY"].includes(user.role) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {item.status === 'Active' ? "Initiate Maintenance" : "Restore Service"}
                          </button>
                          <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "logs" && user.role === "ADMIN" && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Security Audit Logs</h3>
                    <p className="text-slate-500 text-sm">Immutable record of all system access and modifications</p>
                  </div>
                  <button 
                    onClick={fetchData}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resource</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  {log.username[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-white">{log.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                log.action === 'LOGIN' ? "text-emerald-500 bg-emerald-500/10" : "text-blue-500 bg-blue-500/10"
                              )}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500">{log.resource}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-300">{log.details}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, collapsed, onClick }: { 
  icon: any, 
  label: string, 
  active: boolean, 
  collapsed: boolean,
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
        active 
          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
        collapsed && "justify-center"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 transition-transform", active && "scale-110")} />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: { 
  label: string, 
  value: number | string, 
  icon: any, 
  color: 'blue' | 'emerald' | 'amber' | 'purple' 
}) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Live</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
