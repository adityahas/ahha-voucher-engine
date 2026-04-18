import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { createProduct, Product } from '../api/products';
import { 
  ArrowLeft, 
  Package, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Hash, 
  DollarSign,
  Database,
  Type,
  Image as ImageIcon
} from 'lucide-react';

export const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'price' || name === 'stock') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createProduct(formData);
      setSuccess(true);
      setTimeout(() => navigate('/products'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create product. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 flex flex-col items-center space-y-4 max-w-md text-center backdrop-blur-md shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <h2 className="text-2xl font-bold text-green-300">Product Registered!</h2>
          <p className="text-green-200/80 font-medium">
            The new product has been successfully added to the catalog. Redirecting to the list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center border border-slate-700/50 hover:border-slate-500/50"
          icon={ArrowLeft}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Register New Product
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Add a new item to your distribution inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-slate-700/50 relative overflow-hidden group shadow-2xl bg-slate-900/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-400" />
                  General Information
                </CardTitle>
                <CardDescription>Primary product details and identification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Type className="h-4 w-4 text-slate-500" />
                     </div>
                     <Input
                       id="name"
                       name="name"
                       placeholder="Hyper-Engine Pro"
                       value={formData.name}
                       onChange={handleChange}
                       required
                       className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10"
                     />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="sku" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">SKU identifier</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Hash className="h-4 w-4 text-slate-500" />
                       </div>
                       <Input
                         id="sku"
                         name="sku"
                         placeholder="HE-PRO-001"
                         value={formData.sku}
                         onChange={handleChange}
                         required
                         className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10 font-mono"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Unit Price ($)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <DollarSign className="h-4 w-4 text-slate-500" />
                       </div>
                       <Input
                         id="price"
                         name="price"
                         type="number"
                         step="0.01"
                         min="0"
                         placeholder="49.99"
                         value={formData.price}
                         onChange={handleChange}
                         required
                         className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10 font-mono"
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Provide a detailed description of the product..."
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl bg-slate-800/50 border border-slate-700/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all duration-300 resize-none font-medium"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-slate-700/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 capitalize">
                   <Database className="w-4 h-4 text-primary-400" />
                   Stock Management
                </CardTitle>
                <CardDescription className="text-xs">Inventory availability control.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label htmlFor="stock" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/40 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 capitalize">
                   <ImageIcon className="w-4 h-4 text-purple-400" />
                   Product Image
                </CardTitle>
                <CardDescription className="text-xs">Visual asset for showcase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="image_url" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url || ''}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-6 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500 font-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </div>
                ) : (
                  'Register Product'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full py-4 rounded-xl border-slate-700/50 hover:bg-slate-800/50 text-slate-400 font-bold"
                onClick={() => navigate('/products')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
