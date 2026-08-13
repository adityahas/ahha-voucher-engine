import { useNavigate } from 'react-router-dom';
import TierForm from '../components/TierForm';
import { createTier } from '../api/tiers';

export default function TierCreate() {
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Tier</h1>
      <TierForm
        onSubmit={async (input) => {
          await createTier(input);
          navigate('/tiers');
        }}
      />
    </div>
  );
}
