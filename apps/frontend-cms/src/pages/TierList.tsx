import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTiers, deleteTier, Tier } from '../api/tiers';
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
import { AlertCircle, Layers, Loader2, Plus, Trash2 } from 'lucide-react';

export default function TierList() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setTiers(await getTiers());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tier?')) return;
    await deleteTier(id);
    load();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Loyalty Tiers
          </h1>
          <p className="text-slate-400 font-medium">
            Configure your membership tier hierarchy and point multipliers.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/tiers/create')}
          className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-primary-500/40 transition-all duration-300"
        >
          + New Tier
        </Button>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Layers className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <CardTitle>Tier Hierarchy</CardTitle>
              <CardDescription>
                Membership levels and their earning/discount rules.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-300 uppercase">
                Loading tiers...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-md w-full text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-200 mb-2">
                  Failed to Load Tiers
                </h3>
                <p className="text-sm text-red-400/80 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <Button variant="outline" onClick={load}>
                Retry
              </Button>
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-24 group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/30 border border-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Layers className="h-10 w-10 text-slate-600 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-slate-400 text-lg font-medium">
                No tiers found.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Start by creating your first loyalty tier.
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
                      Level
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Min Points
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Multiplier
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Extra Disc %
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Level-Up Voucher
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Active
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((t) => (
                    <TableRow
                      key={t.id}
                      className="group cursor-pointer hover:bg-slate-800/20 transition-all duration-200"
                      onClick={() => navigate(`/tiers/${t.id}/edit`)}
                    >
                      <TableCell className="font-bold text-primary-400 group-hover:pl-6 transition-all">
                        {t.name}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {t.level}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {t.min_points.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {t.point_multiplier}x
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {t.extra_discount_percent}%
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {t.level_up_voucher_code || '—'}
                      </TableCell>
                      <TableCell>
                        {t.is_active ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t.id);
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
