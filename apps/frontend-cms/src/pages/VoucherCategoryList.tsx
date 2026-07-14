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
import {
  getVoucherCategories,
  deleteVoucherCategory,
  VoucherCategory,
} from '../api/voucher-categories';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const VoucherCategoryList: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<VoucherCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVoucherCategories();
      setCategories(data);
    } catch (err: any) {
      setError(
        err.message ||
          'An unexpected error occurred while fetching categories.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (
    e: React.MouseEvent,
    slug: string,
    name: string,
  ) => {
    e.stopPropagation();
    if (
      window.confirm(`Are you sure you want to delete the category "${name}"?`)
    ) {
      try {
        await deleteVoucherCategory(slug);
        await fetchCategories();
      } catch (err: any) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    navigate(`/voucher-categories/${slug}/edit`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Voucher Categories
          </h1>
          <p className="text-slate-400 font-medium">
            Manage classifications for your vouchers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchCategories}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? 'animate-pulse' : ''}
          >
            Refresh List
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/voucher-categories/create')}
            className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-primary-500/40 transition-all duration-300"
          >
            Create Category
          </Button>
        </div>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <LayoutGrid className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <CardTitle>Category Directory</CardTitle>
              <CardDescription>
                All existing voucher classifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-300 uppercase">
                Loading categories...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-md w-full text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-200 mb-2">
                  Failed to load categories
                </h3>
                <p className="text-sm text-red-400/80 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchCategories}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Retry Connection
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-24 group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/30 border border-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                <LayoutGrid className="h-10 w-10 text-slate-600 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-slate-400 text-lg font-medium">
                No categories found.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Start by creating your first category.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              <Table>
                <TableHeader className="bg-slate-800/30">
                  <TableRow>
                    <TableHead className="font-bold text-slate-300 w-16 text-center">
                      Image
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Slug
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Description
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow
                      key={category.slug}
                      className="group cursor-pointer hover:bg-slate-800/20 transition-all duration-200"
                      onClick={() =>
                        navigate(`/voucher-categories/${category.slug}`)
                      }
                    >
                      <TableCell className="p-4">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/100x100?text=Error';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <LayoutGrid className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-200 group-hover:text-primary-400 transition-colors">
                        {category.name}
                      </TableCell>
                      <TableCell className="font-mono text-slate-400 text-xs">
                        {category.slug}
                      </TableCell>
                      <TableCell className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-slate-400 text-sm">
                        {category.description || 'No description provided'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEdit(e, category.slug)}
                            className="p-2 bg-slate-800/50 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-500/20"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDelete(e, category.slug, category.name)
                            }
                            className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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

export default VoucherCategoryList;
