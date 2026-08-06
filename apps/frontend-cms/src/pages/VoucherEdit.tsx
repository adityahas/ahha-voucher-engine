import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getVoucherByCode, updateVoucher, VoucherType } from '../api/vouchers';
import {
  DiscountType,
  DISCOUNT_TYPE_MAP,
  formatDiscountType,
} from '../lib/discount-type';
import {
  getVoucherCategories,
  VoucherCategory,
} from '../api/voucher-categories';
import { getUsers, User } from '../api/users';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Hash,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Tag,
  Ticket,
  Users,
  X,
} from 'lucide-react';

export const VoucherEdit: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    voucher_type: 'CLAIMABLE' as VoucherType,
    description: '',
    quota: 0,
    image: '',
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 0,
    categories: [] as string[],
    allow_combine_categories: [] as string[],
    target_users: [] as string[],
  });
  const [availableCategories, setAvailableCategories] = useState<
    VoucherCategory[]
  >([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!code) return;
      try {
        const [voucherData, categoriesData, usersData] = await Promise.all([
          getVoucherByCode(code),
          getVoucherCategories(),
          getUsers(),
        ]);

        setAvailableCategories(categoriesData);
        setAvailableUsers(usersData);
        setFormData({
          voucher_type: voucherData.voucher_type || 'CLAIMABLE',
          description: voucherData.description || '',
          quota: voucherData.quota,
          image: voucherData.image || '',
          categories: voucherData.categories?.map((c) => c.slug) || [],
          allow_combine_categories:
            voucherData.allow_combine_categories?.map((c) => c.slug) || [],
          discount_type: voucherData.discount_type || 'PERCENTAGE',
          discount_value: Number(voucherData.discount_value) || 0,
          target_users:
            voucherData.target_users?.map((u) => u.core_user_id) || [],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load voucher data.');
      } finally {
        setIsFetchingInitial(false);
      }
    };
    loadInitialData();
  }, [code]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quota' || name === 'discount_value'
          ? value === ''
            ? ''
            : isNaN(Number(value))
              ? prev[name as keyof typeof prev]
              : value
          : value,
    }));
  };

  const toggleSelection = (
    id: string,
    field: 'categories' | 'allow_combine_categories' | 'target_users',
  ) => {
    setFormData((prev) => {
      const current = prev[field];
      const next = current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        quota: Number(formData.quota) || 0,
        discount_value: Number(formData.discount_value) || 0,
        categories: formData.categories.map((slug) => ({ slug })),
        allow_combine_categories: formData.allow_combine_categories.map(
          (slug) => ({ slug }),
        ),
      };
      await updateVoucher(code, payload as any);
      setSuccess(true);
      setTimeout(() => navigate(`/vouchers/${code}`), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update voucher.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="mt-4 text-slate-400 font-medium">
          Synchronizing campaign data...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 flex flex-col items-center space-y-4 max-w-md text-center backdrop-blur-md shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <h2 className="text-2xl font-bold text-green-300">
            Update Successful!
          </h2>
          <p className="text-green-200/80 font-medium">
            Campaign parameters have been updated across the engine.
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/vouchers/${code}`)}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
          icon={ArrowLeft}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Edit Campaign
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium font-mono text-primary-400/80 tracking-tighter uppercase">
            {code}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-slate-700/50 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary-400" />
                  Dynamic Parameters
                </CardTitle>
                <CardDescription>Adjustable issuance settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="voucher_type"
                      className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Voucher Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-slate-500" />
                      </div>
                      <select
                        id="voucher_type"
                        name="voucher_type"
                        value={formData.voucher_type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            voucher_type: e.target.value as VoucherType,
                          }))
                        }
                        className="w-full h-10 rounded-md bg-slate-800/50 border border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10 pr-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                      >
                        <option value="CLAIMABLE">
                          CLAIMABLE (Multi-claim)
                        </option>
                        <option value="UNIQUE_CODE">
                          UNIQUE CODE (Single-claim)
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="quota"
                      className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                    >
                      Allocated Quota
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Database className="h-4 w-4 text-slate-500" />
                      </div>
                      <Input
                        id="quota"
                        name="quota"
                        type="number"
                        min="0"
                        value={formData.quota}
                        onChange={handleChange}
                        required
                        className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Hash className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                      Reward Calculation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="discount_type"
                        className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1"
                      >
                        Reward Type
                      </label>
                      <select
                        id="discount_type"
                        name="discount_type"
                        value={formData.discount_type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discount_type: e.target.value as DiscountType,
                          }))
                        }
                        className="w-full h-12 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-indigo-500/50 transition-all duration-300 px-4 text-sm text-slate-100 appearance-none focus:outline-none"
                      >
                        {Object.values(DiscountType).map((type) => (
                          <option key={type} value={type}>
                            {DISCOUNT_TYPE_MAP[type].label.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="discount_value"
                        className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1"
                      >
                        {formData.discount_type === DiscountType.PERCENTAGE
                          ? 'Discount Percentage (%)'
                          : 'Discount Amount (Rp)'}
                      </label>
                      <Input
                        id="discount_value"
                        name="discount_value"
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.discount_value}
                        onChange={handleChange}
                        required
                        className="bg-slate-900/50 border-slate-700/50 focus:border-indigo-500/50 h-12 rounded-xl font-mono text-indigo-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Narrative
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Campaign description..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl bg-slate-800/50 border border-slate-700/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all duration-300 resize-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="image"
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >
                    Asset URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="image"
                      name="image"
                      type="url"
                      placeholder="https://assets.loyalty.local/banner.png"
                      value={formData.image}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-6 rounded-2xl border-slate-700/50 hover:bg-slate-800/50 text-slate-400"
                onClick={() => navigate(`/vouchers/${code}`)}
                disabled={isLoading}
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-6 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500 font-bold"
                disabled={isLoading}
                icon={Save}
              >
                {isLoading ? 'Synchronizing...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="border-slate-700/50 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-400" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleSelection(cat.slug, 'categories')}
                      className={`group relative flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                        formData.categories.includes(cat.slug)
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                          : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-500'
                      }`}
                    >
                      {cat.name}
                      {formData.categories.includes(cat.slug) ? (
                        <X
                          size={12}
                          className="ml-2 text-primary-400 opacity-50"
                        />
                      ) : (
                        <Plus
                          size={12}
                          className="ml-2 text-slate-600 opacity-50"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  Combinability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() =>
                        toggleSelection(cat.slug, 'allow_combine_categories')
                      }
                      className={`group relative flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                        formData.allow_combine_categories.includes(cat.slug)
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-700/50 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 capitalize">
                  <Users className="w-4 h-4 text-orange-400" />
                  Target Audience
                </CardTitle>
                <CardDescription className="text-xs">
                  Select specific users for this campaign (optional).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleSelection(user.id, 'target_users')}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-300 ${
                        formData.target_users.includes(user.id)
                          ? 'bg-orange-500/10 border-orange-500/50 text-orange-200'
                          : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{user.name}</span>
                        <span className="text-[10px] opacity-60 font-mono">
                          {user.email || user.id.substring(0, 8)}
                        </span>
                      </div>
                      {formData.target_users.includes(user.id) ? (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <X size={12} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center opacity-40 group-hover:opacity-100">
                          <Plus size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      No users found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
