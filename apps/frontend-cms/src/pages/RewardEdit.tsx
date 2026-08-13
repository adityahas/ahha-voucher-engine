import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RewardForm from '../components/RewardForm';
import { getReward, updateReward } from '../api/rewards';
import { Button } from '../components/ui/Button';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export default function RewardEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<any>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id)
      getReward(id)
        .then((r) => setInitial(r))
        .catch((err: any) => setError(err.message || 'Failed to load reward'));
  }, [id]);

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="max-w-md p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-200 mb-2">
            Failed to Load Reward
          </h3>
          <p className="text-sm text-red-400/80 leading-relaxed font-medium">
            {error}
          </p>
        </div>
      </div>
    );

  if (!initial)
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="mt-4 text-slate-400 font-medium">Loading reward...</p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/rewards')}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
          icon={ArrowLeft}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Edit Reward
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium font-mono text-primary-400/80 tracking-tighter uppercase">
            {initial.name}
          </p>
        </div>
      </div>
      <RewardForm
        initial={initial}
        onSubmit={async (input) => {
          if (id) await updateReward(id, input);
          navigate('/rewards');
        }}
      />
    </div>
  );
}
