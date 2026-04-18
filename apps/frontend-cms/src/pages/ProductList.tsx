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
import { getProducts, Product } from '../api/products';
import {
  AlertCircle,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { CategoryChip } from '../components/ui/CategoryChip';

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(
        err.message || 'An unexpected error occurred while fetching products.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Product Management
          </h1>
          <p className="text-slate-400 font-medium">
            Manage your inventory and catalog for consumer distribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={isLoading}
            icon={RefreshCw}
            className={isLoading ? 'animate-pulse' : ''}
          >
            Refresh Catalog
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/products/create')}
            className="shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-primary-500/40 transition-all duration-300"
          >
            Add Product
          </Button>
        </div>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <Package className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>
                Overview of all registered products in the engine.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold tracking-wide animate-pulse text-slate-300 uppercase">
                Restocking inventory...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 max-w-md w-full text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-200 mb-2">
                  Engine Sync Failed
                </h3>
                <p className="text-sm text-red-400/80 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchProducts}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Retry Sync
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/30 border border-slate-700/50 mb-6 group-hover:scale-110 transition-transform duration-500">
                <ShoppingBag className="h-10 w-10 text-slate-600 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-slate-400 text-lg font-medium">
                No products registered.
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Start by adding your first product to the catalog.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/50">
              <Table>
                <TableHeader className="bg-slate-800/30">
                  <TableRow>
                    <TableHead className="font-bold text-slate-300">
                      Product Info
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      SKU
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Unit Price
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Stock Availability
                    </TableHead>
                    <TableHead className="font-bold text-slate-300">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-300">
                      Created At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="group cursor-pointer hover:bg-slate-800/20 transition-all duration-200"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <TableCell className="group-hover:pl-6 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700 overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-200">
                              {product.name}
                            </span>
                            {product.categories &&
                            product.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {product.categories.map((cat) => (
                                  <CategoryChip
                                    key={cat.id}
                                    name={cat.name}
                                    className="px-1.5 py-0.5 text-[10px] bg-slate-800/80 border-slate-700/50 text-slate-400 group-hover:bg-primary-500/10 group-hover:text-primary-300 transition-colors"
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                                {product.description || 'No description'}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-primary-400 font-bold">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-bold text-slate-200">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(product.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-200 font-mono font-bold">
                            {product.stock}
                          </span>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
                            units
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.stock > 10 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            In Stock
                          </span>
                        ) : product.stock > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            Out of Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-slate-500 font-mono text-xs">
                        {new Date(product.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
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

export default ProductList;
