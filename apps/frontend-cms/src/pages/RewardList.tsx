import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRewards, deleteReward, Reward } from '../api/rewards';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { AlertCircle, Coins, Gift, Loader2, Plus, Trash2 } from 'lucide-react';

export default function RewardList() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRewards(await getRewards());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reward?')) return;
    try {
      await deleteReward(id);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete reward');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Reward Items
          </h1>
          <p className="text-slate-400 font-medium">
            Configure redeemable rewards with point pricing and tier gating.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/rewards/create')}
          className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-primary-500/40 transition-all duration-300"
        >
          + New Reward
        </Button>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Gift className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <CardTitle>Reward Catalog</CardTitle>
              <CardDescription>
                Items your members can claim with loyalty points.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-300 uppercase">
                Loading rewards...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-md w-full text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-200 mb-2">
                  Failed to Load Rewards
                </h3>
                <p className="text-sm text-red-400/80 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <Button variant="outline" onClick={load}>
                Retry
              </Button>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-24 group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/30 border border-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Gift className="h-10 w-10 text-slate-600 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-slate-400 text-lg font-medium">
                No rewards found.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Start by creating your first reward item.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              <Table>
                <TableHeader className="bg-slate-800/30">
                  <TableRow>
                    <TableHead className="font-bold text-slate-300">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Type
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Stock
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Point Price
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Min Tier
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r) => (
                    <TableRow
                      key={r.id}
                      className="group cursor-pointer hover:bg-slate-800/20 transition-all duration-200"
                      onClick={() => navigate(`/rewards/${r.id}/edit`)}
                    >
                      <TableCell className="font-bold text-primary-400 group-hover:pl-6 transition-all">
                        {r.name}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {r.type}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {r.stock === -1 ? '∞' : r.stock}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-300">
                        <span className="inline-flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5" />
                          {r.point_price}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {r.min_tier?.name ?? (
                          <span className="text-slate-600">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
