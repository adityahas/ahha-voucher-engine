import React, { useEffect, useState } from 'react';
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
import { getVouchers, Voucher } from '../api/vouchers';
import { Loader2, AlertCircle, RefreshCw, Ticket, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const VoucherList: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch (err: any) {
      setError(
        err.message || 'An unexpected error occurred while fetching vouchers.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Voucher Management
          </h1>
          <p className="text-slate-400 font-medium">
            Configure and monitor your promotional campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchVouchers}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? 'animate-pulse' : ''}
          >
            Refresh List
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/vouchers/create')}
            className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-primary-500/40 transition-all duration-300"
          >
            Create Voucher
          </Button>
        </div>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Ticket className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <CardTitle>Active Vouchers</CardTitle>
              <CardDescription>
                Live campaigns and issuance history.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-300 uppercase">
                Synchronizing with engine...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-md w-full text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-200 mb-2">Engine Connection Failed</h3>
                <p className="text-sm text-red-400/80 leading-relaxed font-medium">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchVouchers} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                Retry Connection
              </Button>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-24 group">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/30 border border-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Ticket className="h-10 w-10 text-slate-600 group-hover:text-primary-400 transition-colors" />
               </div>
              <p className="text-slate-400 text-lg font-medium">No vouchers found.</p>
              <p className="text-slate-500 text-sm mt-1">Start by creating your first promotional campaign.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              <Table>
                <TableHeader className="bg-slate-800/30">
                  <TableRow>
                    <TableHead className="font-bold text-slate-300">Code</TableHead>
                    <TableHead className="font-bold text-slate-300">Description</TableHead>
                    <TableHead className="font-bold text-slate-300">Categories</TableHead>
                    <TableHead className="font-bold text-slate-300">Quota</TableHead>
                    <TableHead className="font-bold text-slate-300">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-300">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow
                      key={voucher.code}
                      className="group cursor-pointer hover:bg-slate-800/20 transition-all duration-200"
                      onClick={() => navigate(`/vouchers/${voucher.code}`)}
                    >
                      <TableCell className="font-mono text-primary-400 font-bold group-hover:pl-6 transition-all">
                        <div className="flex flex-col gap-1">
                          <span>{voucher.code}</span>
                          <span className="text-[9px] w-fit px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 uppercase tracking-wider border border-slate-700/50">
                            {voucher.voucher_type?.replace('_', ' ') || 'CLAIMABLE'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-slate-300 font-medium">
                        {voucher.description || 'No description provided'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {voucher.categories?.map((cat) => (
                            <span key={cat.slug} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20">
                              {cat.name}
                            </span>
                          )) || <span className="text-slate-600 text-[10px] italic">None</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                           <span className="text-slate-200 font-mono font-bold">{voucher.quota}</span>
                           <span className="text-xs text-slate-500 font-medium uppercase tracking-tighter">Items remaining</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {voucher.quota > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Sold Out
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 font-mono text-xs">
                        {new Date(voucher.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
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
};

export default VoucherList;
