import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import {
  LogOut,
  Ticket,
  User,
  Search,
  List,
  Package,
  History,
  Award,
  Gift,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface ConsumerLayoutProps {
  children: React.ReactNode;
}

export function ConsumerLayout({ children }: ConsumerLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <nav className="glass-panel sticky top-0 z-50 flex h-16 items-center justify-between px-6 border-b border-white/5 bg-slate-950/50 rounded-none shadow-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:block">
              Ahha Rewards
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Search className="w-4 h-4" />
              Explore Rewards
            </NavLink>
            <NavLink
              to="/my-vouchers"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <List className="w-4 h-4" />
              My Vouchers
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Package className="w-4 h-4" />
              Product Catalog
            </NavLink>
            <NavLink
              to="/points-history"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <History className="w-4 h-4" />
              Point History
            </NavLink>
            <NavLink
              to="/loyalty"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Award className="w-4 h-4" />
              Loyalty
            </NavLink>
            <NavLink
              to="/rewards"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Gift className="w-4 h-4" />
              Rewards
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
            <User className="w-4 h-4" />
            <span>{user?.email || 'User'}</span>
          </div>
          <button
            onClick={clearAuth}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 w-full">{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/5 bg-slate-950/80 pb-safe">
        <div className="flex items-center justify-around p-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </NavLink>
          <NavLink
            to="/my-vouchers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-fuchsia-400 bg-fuchsia-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <List className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Vouchers</span>
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-medium">Catalog</span>
          </NavLink>
          <NavLink
            to="/points-history"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">Points</span>
          </NavLink>
          <NavLink
            to="/loyalty"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-medium">Loyalty</span>
          </NavLink>
          <NavLink
            to="/rewards"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive
                  ? 'text-fuchsia-400 bg-fuchsia-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Gift className="w-5 h-5" />
            <span className="text-[10px] font-medium">Rewards</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
