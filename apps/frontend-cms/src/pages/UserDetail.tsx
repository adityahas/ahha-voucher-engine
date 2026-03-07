import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { getUserById, User } from '../api/users';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  Activity,
  UserCog,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserById(id);
      setUser(data);
    } catch (err: any) {
      setError(
        err.message ||
          'An unexpected error occurred while fetching user details.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4 animate-in fade-in duration-700">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-lg font-medium animate-pulse text-primary-200">
          Loading user metadata...
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in zoom-in-95 duration-500">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col items-center space-y-4 max-w-md text-center backdrop-blur-md shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <AlertCircle className="h-12 w-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h2 className="text-xl font-bold text-red-300">User Not Found</h2>
          <p className="text-sm text-red-200/80 leading-relaxed font-medium">
            {error ||
              'The requested user could not be located in the current workspace.'}
          </p>
          <div className="flex gap-4 w-full pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/users')}
            >
              Go Back
            </Button>
            <Button variant="primary" className="flex-1" onClick={fetchUser}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/users')}
            className="rounded-full w-12 h-12 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
            icon={ArrowLeft}
          >
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              {user.name}
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-1 flex items-center gap-2">
              <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                ID: {user.id}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {user.is_active ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
              Active Account
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              Inactive Account
            </span>
          )}
          {user.is_deleted && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50">
              Archived
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={UserCog}
          onClick={() => navigate(`/users/edit/${user.id}`)}
          className="border-slate-700/50 hover:border-primary-500/50 hover:bg-primary-500/5 text-slate-300 hover:text-primary-400 font-semibold"
        >
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-700/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              Profile details
            </CardTitle>
            <CardDescription>
              Core identity markers and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 shadow-inner">
                <Mail className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Email Address
                </p>
                <p className="text-base font-semibold text-slate-200">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 shadow-inner">
                <Phone className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Phone Number
                </p>
                <p className="text-base font-semibold text-slate-200">
                  {user.phone || 'Not Provided'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 shadow-inner">
                <Activity className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  System Role
                </p>
                <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Activity Log
            </CardTitle>
            <CardDescription>
              System access timestamps and lifecycle tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex justify-between items-center">
              <p className="text-sm font-medium text-slate-400">
                Account Created
              </p>
              <p className="text-sm font-mono text-slate-200 bg-slate-800 px-3 py-1 rounded-md border border-slate-700/50">
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex justify-between items-center">
              <p className="text-sm font-medium text-slate-400">Last Updated</p>
              <p className="text-sm font-mono text-slate-200 bg-slate-800 px-3 py-1 rounded-md border border-slate-700/50">
                {new Date(user.updated_at).toLocaleString()}
              </p>
            </div>
            {user.deleted_at && (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex justify-between items-center">
                <p className="text-sm font-medium text-red-400/80">
                  Deletion Date
                </p>
                <p className="text-sm font-mono text-red-300 bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">
                  {new Date(user.deleted_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;
