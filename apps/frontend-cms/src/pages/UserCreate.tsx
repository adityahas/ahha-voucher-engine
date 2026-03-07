import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { createUser } from '../api/users';
import { ArrowLeft, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createUser(formData);
      setSuccess(true);
      setTimeout(() => navigate('/users'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create user. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 flex flex-col items-center space-y-4 max-w-md text-center backdrop-blur-md shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <h2 className="text-2xl font-bold text-green-300">User Created!</h2>
          <p className="text-green-200/80 font-medium">
            The new user account has been successfully provisioned. Redirecting to the list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/users')}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
          icon={ArrowLeft}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Create User
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium"> Provision a new administrative account.</p>
        </div>
      </div>

      <Card className="border-slate-700/50 relative overflow-hidden group shadow-2xl bg-slate-900/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 pointer-events-none" />
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" />
            Account Information
          </CardTitle>
          <CardDescription>Enter the necessary details for the new user profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="alex.rivera@client.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-300 ml-1">Secure Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <div className="relative flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-slate-700/50 bg-slate-800/50 text-primary-600 focus:ring-primary-500/30 focus:ring-offset-0 transition-all duration-300 cursor-pointer accent-primary-500"
                  />
                </div>
                <label htmlFor="is_active" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Mark account as active immediately
                </label>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-6 rounded-xl border-slate-700/50 hover:bg-slate-800/50"
                onClick={() => navigate('/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-6 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Provision Account'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCreate;
