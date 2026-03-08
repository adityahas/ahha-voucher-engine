import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getVoucherByCode, Voucher } from '../api/vouchers';
import { getUsers, User } from '../api/users';
import { VoucherBindingList } from '../components/VoucherBindingList';
import { VoucherValidityList } from '../components/VoucherValidityList';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Ticket,
  Clock,
  ShieldCheck,
  Tag,
  Hash,
  Database,
  Users
} from 'lucide-react';

export const VoucherDetail: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      if (!code) return;
      setIsLoading(true);
      setError(null);
      try {
        const [voucherData, usersData] = await Promise.all([
          getVoucherByCode(code),
          getUsers().catch(() => [])
        ]);
        setVoucher(voucherData);
        setAllUsers(usersData);
      } catch (err: any) {
        setError(err.message || 'Failed to load voucher details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoucher();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        <p className="text-sm font-semibold tracking-widest animate-pulse text-slate-300 uppercase">
          Fetching engine data...
        </p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="glass-dark border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-500/5">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-200">Voucher Not Found</h2>
            <p className="text-slate-400 mt-2 font-medium">
              {error || 'The voucher code you are looking for does not exist or has been removed.'}
            </p>
          </div>
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/vouchers')}>
            Back to Vouchers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/vouchers')}
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-slate-900/50"
          />
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-bold tracking-widest text-primary-400 uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                Voucher Profile
              </span>
              <span className="text-xs font-mono text-slate-500">
                Created {new Date(voucher.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              {voucher.code}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/vouchers/${code}/edit`)}
            className="border-slate-700 hover:bg-slate-800"
          >
            Edit Parameters
          </Button>
          <Button
            variant="primary"
            className="shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            onClick={() => console.log('Duplicate clicked')}
          >
            Duplicate Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="border-b border-slate-800/50 pb-6 relative">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Ticket size={120} />
               </div>
              <CardTitle className="text-2xl">General Information</CardTitle>
              <CardDescription>Primary configuration and campaign details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Tag size={12} className="text-primary-500" />
                          Voucher Code
                       </label>
                       <div className="text-xl font-mono font-bold text-primary-400 bg-primary-500/5 p-3 rounded-xl border border-primary-500/10 flex items-center justify-between">
                          <span>{voucher.code}</span>
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                            {voucher.voucher_type?.replace('_', ' ') || 'CLAIMABLE'}
                          </span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Tag size={12} className="text-purple-500" />
                          Linked Categories
                       </label>
                       <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                          {voucher.categories?.map(cat => (
                            <span key={cat.slug} className="text-xs font-bold px-3 py-1 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
                              {cat.name}
                            </span>
                          )) || <span className="text-slate-600 text-xs italic">No categories linked</span>}
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Database size={12} className="text-purple-500" />
                        Current Quota
                     </label>
                     <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-end gap-2">
                        <span className="text-2xl font-mono font-bold text-slate-100">{voucher.quota}</span>
                        <span className="text-xs text-slate-500 font-medium pb-1 uppercase">Allocated Items</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} className="text-slate-400" />
                    Campaign Description
                  </label>
                  <p className="text-slate-300 leading-relaxed bg-slate-800/20 p-6 rounded-2xl border border-slate-800/50 italic">
                    "{voucher.description || 'No description provided for this campaign.'}"
                  </p>
               </div>
            </CardContent>
          </Card>

          {/* Timeline / Traceability Card */}
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Audit Log & Timeline</CardTitle>
              <CardDescription>System events and lifecycle tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-start space-x-6">
                  <div className="relative mt-1">
                     <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Calendar size={18} className="text-slate-400" />
                     </div>
                     <div className="absolute top-10 left-5 w-px h-12 bg-slate-800"></div>
                  </div>
                  <div className="pt-1">
                     <p className="text-sm font-bold text-slate-200">Initial Creation</p>
                     <p className="text-xs text-slate-500 mt-1 uppercase font-medium tracking-tighter">
                        {new Date(voucher.created_at).toLocaleString()}
                     </p>
                  </div>
               </div>
               <div className="flex items-start space-x-6">
                  <div className="relative mt-1">
                     <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <Clock size={18} className="text-primary-400" />
                     </div>
                  </div>
                  <div className="pt-1">
                     <p className="text-sm font-bold text-slate-200">Last Synced Update</p>
                     <p className="text-xs text-primary-400/80 mt-1 uppercase font-medium tracking-tighter">
                        {new Date(voucher.updated_at).toLocaleString()}
                     </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Security & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
                  <div className="flex items-center space-x-3">
                     <ShieldCheck size={20} className={voucher.quota > 0 ? "text-green-500" : "text-amber-500"} />
                     <span className="text-sm font-medium text-slate-300">Campaign Status</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${voucher.quota > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                     {voucher.quota > 0 ? "ACTIVE" : "DEPLETED"}
                  </span>
               </div>
               
               {voucher.image && (
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview Asset</label>
                     <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800">
                        <img src={voucher.image} alt="Voucher Branding" className="w-full h-full object-cover" />
                     </div>
                  </div>
               )}
               
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-white/5 space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                     <Ticket className="text-primary-400" />
                  </div>
                  <h4 className="font-bold text-slate-100">Tenant Scoping</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     This voucher is isolated to your current workspace. All issuance and claims are tracked under the multi-tenant architecture.
                  </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={18} className="text-orange-400" />
                  Target Audience
               </CardTitle>
               <CardDescription className="text-xs">Users explicitly targeted by this campaign.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-3 mt-2">
                  {voucher.target_users && voucher.target_users.length > 0 ? (
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {voucher.target_users.map(target => {
                           const userDetail = allUsers.find(u => u.id === target.core_user_id);
                           return (
                              <div key={target.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-3 group hover:border-orange-500/30 transition-colors">
                                 <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                                    {userDetail?.name?.substring(0,1).toUpperCase() || '?'}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-200">{userDetail?.name || 'Unknown User'}</span>
                                    <span className="text-[10px] text-slate-500 font-mono tracking-tighter truncate w-32">
                                       {userDetail?.email || target.id.substring(0,8)}
                                    </span>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-600 italic">No specific users targeted. This campaign is public (global).</p>
                     </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Binding Constraints Section */}
      <VoucherBindingList voucherId={voucher.code} />
      <VoucherValidityList voucherId={voucher.code} />
    </div>
  );
};

export default VoucherDetail;
