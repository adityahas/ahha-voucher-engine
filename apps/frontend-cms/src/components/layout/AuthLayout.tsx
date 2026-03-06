import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950">
      {/* Decorative background elements */}
      <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-primary-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-blob animation-delay-2000 pointer-events-none"></div>

      <Outlet />
    </div>
  );
};
