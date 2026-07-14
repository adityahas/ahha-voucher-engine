import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getVoucherCategoryBySlug,
  VoucherCategory,
} from '../api/voucher-categories';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Edit2,
  Calendar,
} from 'lucide-react';

export const VoucherCategoryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<VoucherCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVoucherCategoryBySlug(slug);
      setCategory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4 animate-in fade-in duration-700">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm font-semibold tracking-wide animate-pulse">
          Loading category metadata...
        </p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in-95 duration-500">
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col items-center max-w-md text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-300 mb-2">
            Failed to load category
          </h3>
          <p className="text-red-200/80 mb-6">
            {error || 'Category not found'}
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/voucher-categories')}
            >
              Back to List
            </Button>
            <Button variant="primary" onClick={fetchCategory}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
              {category.name}
            </h1>
            <p className="text-slate-400 font-medium font-mono text-sm mt-1">
              {category.slug}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          icon={Edit2}
          onClick={() => navigate(`/voucher-categories/${category.slug}/edit`)}
          className="bg-slate-800/50 hover:bg-slate-700/50"
        >
          Edit Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
            <div className="h-48 w-full bg-slate-800 border-b border-slate-800/50 relative">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/400x300?text=Image+Error';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <LayoutGrid className="w-16 h-16 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
            </div>
            <CardHeader className="pt-4">
              <CardTitle className="text-base text-slate-200">
                Category Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </label>
                <p className="text-slate-300 text-sm flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {category.created_at
                    ? new Date(category.created_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Modified
                </label>
                <p className="text-slate-300 text-sm flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {category.updated_at
                    ? new Date(category.updated_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary-400" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 min-h-[160px]">
                {category.description ? (
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {category.description}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">
                    No description provided for this category.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoucherCategoryDetail;
