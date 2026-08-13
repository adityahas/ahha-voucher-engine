import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRewardSource,
  RewardItemSource,
  updateRewardSource,
} from '../api/reward-item-sources';
import RewardItemSourceForm from '../components/RewardItemSourceForm';
export default function RewardItemSourceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<RewardItemSource>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (id)
      getRewardSource(id)
        .then(setInitial)
        .catch((e) => setError(e.message || 'Failed to load reward source'));
  }, [id]);
  if (error) return <p className="text-red-400">{error}</p>;
  if (!initial)
    return <p className="text-slate-400">Loading reward source...</p>;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-white">Edit Reward Source</h1>
      <RewardItemSourceForm
        initial={initial}
        onSubmit={async (input) => {
          if (id) await updateRewardSource(id, input);
          navigate('/reward-sources');
        }}
      />
    </div>
  );
}
