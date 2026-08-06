import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

export const ErrorElement: React.FC = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const errorMessage =
    error?.statusText || error?.message || 'An unexpected error occurred.';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full p-8 rounded-3xl glass-dark border border-red-500/20 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Unexpected Error
          </h2>
          <p className="text-sm text-slate-400">
            Something went wrong while loading this view.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left font-mono text-xs text-red-300/90 overflow-x-auto max-h-40 custom-scrollbar">
          {errorMessage}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} className="mr-2" />
            Reload Page
          </Button>
          <Button
            className="bg-primary-600 hover:bg-primary-500 text-white"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
