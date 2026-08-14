import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Ticket,
  LayoutGrid,
  Package,
  Gift,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Users',
    items: [{ to: '/users', label: 'User Management', icon: Users }],
  },
  {
    heading: 'Vouchers',
    items: [
      { to: '/vouchers', label: 'Voucher Management', icon: Ticket },
      {
        to: '/voucher-categories',
        label: 'Voucher Categories',
        icon: LayoutGrid,
      },
    ],
  },
  {
    heading: 'Catalog',
    items: [{ to: '/products', label: 'Product Management', icon: Package }],
  },
  {
    heading: 'Loyalty',
    items: [
      { to: '/tiers', label: 'Tier Management', icon: Layers },
      { to: '/rewards', label: 'Reward Management', icon: Gift },
      { to: '/reward-sources', label: 'Reward Sources', icon: Gift },
    ],
  },
  {
    heading: 'System',
    items: [{ to: '/settings/currency', label: 'Settings', icon: Settings }],
  },
];

export const MainLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.tenant);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-primary-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 glass-dark border-r border-slate-700/50 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-700/50">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              Ahha Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
              Workspace: {tenant}
            </p>
          </div>

          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.heading}>
                <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {section.heading}
                </p>
                <div className="space-y-1">
                  {section.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary-500/20">
                {user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-500">Admin Staff</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium border border-transparent hover:border-red-500/20"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
