import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  deleteRewardSource,
  getRewardSources,
  RewardItemSource,
} from '../api/reward-item-sources';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
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

const mask = (key?: string | null) => (key ? '******' : '-');
export default function RewardItemSourceList() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<RewardItemSource[]>([]);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      setSources(await getRewardSources());
    } catch (e: any) {
      setError(e.message || 'Failed to load reward sources');
    }
  };
  useEffect(() => {
    load();
  }, []);
  const remove = async (id: string) => {
    if (!window.confirm('Delete this reward source?')) return;
    try {
      await deleteRewardSource(id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to delete reward source');
    }
  };
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-white">
            Reward Item Sources
          </h1>
          <p className="text-slate-400">Configure external reward providers.</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/reward-sources/create')}>
          New Source
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>{source.name}</TableCell>
                  <TableCell>{source.source_type}</TableCell>
                  <TableCell>{source.api_endpoint || '-'}</TableCell>
                  <TableCell>{mask(source.apiKey)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/reward-sources/${source.id}/edit`)
                      }
                    >
                      Edit
                    </Button>
                    <button
                      type="button"
                      aria-label={`Delete ${source.name}`}
                      onClick={() => remove(source.id)}
                      className="ml-2 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
