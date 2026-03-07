import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { createVoucherCategory } from '../api/voucher-categories';
import { ArrowLeft, LayoutGrid, Loader2, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export const VoucherCategoryCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createVoucherCategory(formData);
      setSuccess(true);
      setTimeout(() => navigate('/voucher-categories'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create category. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 flex flex-col items-center space-y-4 max-w-md text-center backdrop-blur-md shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <h2 className="text-2xl font-bold text-green-300">Category Created!</h2>
          <p className="text-green-200/80 font-medium">
            The new voucher category has been successfully saved. Redirecting to the list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/voucher-categories')}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
          icon={ArrowLeft}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Create Category
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium"> Group vouchers into logical classifications.</p>
        </div>
      </div>

      <Card className="border-slate-700/50 relative overflow-hidden group shadow-2xl bg-slate-900/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 pointer-events-none" />
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary-400" />
            Category Details
          </CardTitle>
          <CardDescription>Enter the metadata for the new category.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-300 ml-1">Display Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Free Shipping"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-semibold text-slate-300 ml-1">Unique Slug (Identifier)</label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="e.g. free-shipping"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-semibold text-slate-300 ml-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Details about this category..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-lg bg-slate-800/50 border border-slate-700/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all duration-300 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-semibold text-slate-300 ml-1">Image URL</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <ImageIcon className="h-4 w-4 text-slate-500" />
                   </div>
                   <Input
                     id="image"
                     name="image"
                     type="url"
                     placeholder="https://example.com/image.png"
                     value={formData.image}
                     onChange={handleChange}
                     className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10"
                   />
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-6 rounded-xl border-slate-700/50 hover:bg-slate-800/50"
                onClick={() => navigate('/voucher-categories')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-6 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Create Category'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherCategoryCreate;
