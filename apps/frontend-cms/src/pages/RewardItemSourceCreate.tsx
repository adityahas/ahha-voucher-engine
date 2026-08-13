import { useNavigate } from 'react-router-dom';
import { createRewardSource } from '../api/reward-item-sources';
import RewardItemSourceForm from '../components/RewardItemSourceForm';
export default function RewardItemSourceCreate() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-white">
        Create Reward Source
      </h1>
      <RewardItemSourceForm
        onSubmit={async (input) => {
          await createRewardSource(input);
          navigate('/reward-sources');
        }}
      />
    </div>
  );
}
