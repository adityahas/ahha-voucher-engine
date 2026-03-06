import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Users, Award, Star, LogOut, Search, Bell } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) => (
  <div className="glass-dark rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary-500/20 group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-800/80 rounded-lg group-hover:bg-primary-500/20 transition-colors">
        <Icon className="h-6 w-6 text-primary-400 group-hover:text-primary-300" />
      </div>
      <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span>
    </div>
    <h3 className="text-slate-400 tracking-wide text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold text-white mt-1 group-hover:text-glow transition-all">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-purple-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Top Navbar */}
        <header className="glass rounded-2xl p-4 flex justify-between items-center bg-slate-900/40 border-slate-700/50">
          <div className="flex items-center space-x-3">
             <div className="bg-gradient-to-br from-primary-400 to-purple-500 p-2 rounded-lg shadow-lg">
                <Ticket className="h-6 w-6 text-white" />
             </div>
             <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
               Ahha CMS
             </h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500 text-white w-64 transition-all focus:w-72"
              />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-500"></span>
            </button>
            <div className="h-8 w-px bg-slate-700"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-primary-400 transition-colors"
            >
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back, Admin 👋</h2>
          <p className="text-slate-400 mt-2">Here's what is happening with the loyalty engine today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Vouchers" value="2,543" icon={Ticket} trend="+12.5%" />
          <StatCard title="Targeted Users" value="14,201" icon={Users} trend="+5.2%" />
          <StatCard title="Completed Quests" value="8,432" icon={Award} trend="+18.1%" />
          <StatCard title="Rewards Claimed" value="1,156" icon={Star} trend="+2.4%" />
        </div>

        {/* Recent Activity Table Placeholder */}
        <div className="glass-dark rounded-2xl p-6 border-slate-700/50 mt-8">
          <h3 className="text-lg font-bold text-white mb-6">Recent Voucher Claims</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-colors border border-slate-700/30">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center border border-primary-500/30">
                    <span className="text-sm font-bold text-primary-300">U{i}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">User Claimed GO-PAY 50K</p>
                    <p className="text-xs text-slate-400">Voucher Code: VCH-Q3X9-{i}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  Just now
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
