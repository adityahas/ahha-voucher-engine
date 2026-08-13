import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TierForm from '../components/TierForm';
import { getTier, updateTier } from '../api/tiers';
import { AlertCircle } from 'lucide-react';

export default function TierEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<any>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id)
      getTier(id)
        .then((t) => setInitial(t))
        .catch((err: any) => setError(err.message || 'Failed to load tier'));
  }, [id]);

  if (error)
    return (
      <div className="p-8">
        <div className="max-w-md p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-200 mb-2">
            Failed to Load Tier
          </h3>
          <p className="text-sm text-red-400/80 leading-relaxed font-medium">
            {error}
          </p>
        </div>
      </div>
    );

  if (!initial) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Tier</h1>
      <TierForm
        initial={initial}
        onSubmit={async (input) => {
          if (id) await updateTier(id, input);
          navigate('/tiers');
        }}
      />
    </div>
  );
}
