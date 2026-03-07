import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ChevronRight,
  Globe,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const Login: React.FC = () => {
  const [tenant, setTenant] = useState('client1');
  const [apiKey, setApiKey] = useState('client1-api-key');
  const [email, setEmail] = useState('admin@client1.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginFn = useAuthStore((state: any) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:9002';
      const response = await fetch(`${baseUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-tenant-override': tenant,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();

      // Utilize Zustand store directly
      loginFn(data.data?.token || 'dummy_token', tenant, apiKey, email);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the Ahha Voucher Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-dark w-full max-w-md rounded-2xl p-8 relative z-10 transition-all duration-500 hover:shadow-primary-500/20 hover:border-primary-500/40 border border-slate-700/50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 tracking-tight mb-2">
          Ahha Voucher
        </h1>
        <p className="text-slate-400 font-medium">Multi-Tenant Admin Portal</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 isolate backdrop-blur-md">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 font-medium leading-relaxed">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
          label="Workspace ID"
          icon={Globe}
          placeholder="e.g. client1"
          required
          value={tenant}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTenant(e.target.value)
          }
        />

        <Input
          label="API Key"
          type="password"
          icon={KeyRound}
          placeholder="Enter client API Key"
          required
          value={apiKey}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setApiKey(e.target.value)
          }
        />

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="admin@ahha-voucher.local"
          required
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-2"
          icon={ChevronRight}
          iconRight
        >
          Access Engine
        </Button>
      </form>
    </div>
  );
};

export default Login;
