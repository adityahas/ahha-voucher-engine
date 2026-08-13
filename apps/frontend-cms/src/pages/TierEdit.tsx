import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TierForm from '../components/TierForm';
import { getTier, updateTier } from '../api/tiers';

export default function TierEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<any>(undefined);

  useEffect(() => {
    if (id) getTier(id).then((t) => setInitial(t));
  }, [id]);

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
