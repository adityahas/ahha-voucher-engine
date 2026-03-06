import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Ticket, Users, Activity, ExternalLink } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
  <Card className="hover:scale-[1.02] transform transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-500/10 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Icon className="h-6 w-6 text-primary-400 relative z-10" />
        </div>
        <span
          className={`text-sm font-bold px-2 py-1 rounded-full ${
            trend > 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>
      </div>
      <h3 className="text-3xl font-bold text-white tracking-tight mb-1">
        {value}
      </h3>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-purple-300 mb-2">
            Command Center
          </h1>
          <p className="text-slate-400">
            Manage vouchers, categories, and monitor analytics.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Vouchers"
          value="1,248"
          subtitle="Across 12 campaigns"
          icon={Ticket}
          trend={12.5}
        />
        <StatCard
          title="Total Claims"
          value="45.2k"
          subtitle="Lifetime claims processed"
          icon={Activity}
          trend={8.2}
        />
        <StatCard
          title="Active Users"
          value="892"
          subtitle="Unique claimants this week"
          icon={Users}
          trend={-2.4}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          subtitle="API Gateway Status"
          icon={Activity}
          trend={0.1}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest voucher claims across all campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
              <p className="text-slate-500 flex flex-col items-center">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                Chart Visualization Region
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut to system modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 rounded-xl glass-dark hover:bg-slate-800/80 transition-all group border border-slate-700/50 hover:border-primary-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-200">New Campaign</p>
                  <p className="text-xs text-slate-400">
                    Draft a voucher batch
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl glass-dark hover:bg-slate-800/80 transition-all group border border-slate-700/50 hover:border-primary-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-200">
                    User Management
                  </p>
                  <p className="text-xs text-slate-400">Configure ACL roles</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
