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
import { getProductById, Product } from '../api/products';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Package,
  Clock,
  ShieldCheck,
  Hash,
  Database,
  DollarSign,
  TrendingUp,
  Box
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
        <p className="text-sm font-semibold tracking-widest animate-pulse text-slate-300 uppercase">
          Fetching distribution data...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="glass-dark border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-500/5">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-200">Product Not Found</h2>
            <p className="text-slate-400 mt-2 font-medium">
              {error || 'The product you are looking for does not exist or has been removed from inventory.'}
            </p>
          </div>
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/products')}>
            Back to Distribution
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
            onClick={() => navigate('/products')}
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-slate-900/50 border-slate-700/50"
          />
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-bold tracking-widest text-primary-400 uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                Product Specification
              </span>
              <span className="text-xs font-mono text-slate-500">
                Registered {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/products/${id}/edit`)}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Update Catalog
          </Button>
          <Button
            variant="primary"
            className="shadow-[0_0_20px_rgba(59,130,246,0.3)] font-bold px-8"
            onClick={() => console.log('Dispatch stock triggered')}
          >
            Dispatch Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="border-b border-slate-800/50 pb-6 relative">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Package size={120} />
               </div>
              <CardTitle className="text-2xl">General Specification</CardTitle>
              <CardDescription>Comprehensive identification and pricing parameters.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Hash size={12} className="text-primary-500" />
                          Stock Keeping Unit (SKU)
                       </label>
                       <div className="text-xl font-mono font-bold text-primary-400 bg-primary-500/5 p-4 rounded-2xl border border-primary-500/10">
                          {product.sku}
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <DollarSign size={12} className="text-green-500" />
                          Market Valuation
                       </label>
                       <div className="text-2xl font-mono font-bold text-slate-100 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-1">
                          <span className="text-slate-500 font-sans">$</span>
                          {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Database size={12} className="text-purple-500" />
                          Inventory Balance
                       </label>
                       <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex items-end gap-3 h-[76px]">
                          <span className="text-3xl font-mono font-bold text-slate-100">{product.stock}</span>
                          <span className="text-xs text-slate-500 font-medium pb-1.5 uppercase tracking-wider">Units available</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp size={12} className="text-orange-500" />
                          Performance Metric
                       </label>
                       <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-300">Sales Velocity</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-500">STABLE</span>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Box size={12} className="text-slate-400" />
                    Product Narrative
                  </label>
                  <p className="text-slate-300 leading-relaxed bg-slate-800/20 p-6 rounded-2xl border border-slate-800/50 italic">
                    "{product.description || 'This product does not have a narrative description defined in the catalog.'}"
                  </p>
               </div>
            </CardContent>
          </Card>

          {/* Audit & Lifecycle Card */}
          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl">Lifecycle Manifest</CardTitle>
              <CardDescription>Temporal tracking and registration records.</CardDescription>
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
                     <p className="text-sm font-bold text-slate-200">Catalog Entry Registered</p>
                     <p className="text-xs text-slate-500 mt-1 uppercase font-medium tracking-tighter">
                        {new Date(product.created_at).toLocaleString()}
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
                     <p className="text-sm font-bold text-slate-200">Last Database Synchronisation</p>
                     <p className="text-xs text-primary-400/80 mt-1 uppercase font-medium tracking-tighter">
                        {new Date(product.updated_at).toLocaleString()}
                     </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Visibility & Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
                  <div className="flex items-center space-x-3">
                     <ShieldCheck size={20} className={product.stock > 0 ? "text-green-500" : "text-amber-500"} />
                     <span className="text-sm font-medium text-slate-300">Catalog Status</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.stock > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                     {product.stock > 0 ? "AVAILABLE" : "OUT OF STOCK"}
                  </span>
               </div>
               
               {product.image_url && (
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Hero Asset</label>
                     <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800 group relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        <img src={product.image_url} alt="Product Showcase" className="w-full h-full object-cover" />
                     </div>
                  </div>
               )}
               
               <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-white/5 space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                     <Box className="text-primary-400" />
                  </div>
                  <h4 className="font-bold text-slate-100">Distribution Node</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     This unit is registered within the Global Distribution Network. Inventory levels are dynamic across all connected consumer endpoints.
                  </p>
               </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-2">
               <CardTitle className="text-lg">Distribution Logistics</CardTitle>
               <CardDescription className="text-xs">Real-time inventory mapping.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Main Warehouse</span>
                        <span className="text-xs font-bold text-slate-300">{product.stock} units</span>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/10 border border-slate-800/50 opacity-50">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Regional Hub</span>
                        <span className="text-xs font-bold text-slate-300">Allocating...</span>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-slate-700" />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
