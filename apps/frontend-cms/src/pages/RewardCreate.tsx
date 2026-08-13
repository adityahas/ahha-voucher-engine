import { useNavigate } from 'react-router-dom';
import RewardForm from '../components/RewardForm';
import { createReward } from '../api/rewards';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function RewardCreate() {
  const navigate = useNavigate();
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
            Create Reward
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Add a new reward item with point pricing and tier gating.
          </p>
        </div>
      </div>
      <RewardForm
        onSubmit={async (input) => {
          await createReward(input);
          navigate('/rewards');
        }}
      />
    </div>
  );
}
