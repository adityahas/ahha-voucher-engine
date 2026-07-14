import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Search, LayoutGrid, RefreshCw } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../api/products';
import type { Product } from '../types/product';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const ProductShowcaseView: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-80px)] p-6 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[150px] animate-pulse delay-700" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Package className="text-cyan-500" />
              Product{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                Showcase
              </span>
            </h1>
            <p className="text-slate-400">
              Exclusive catalog of items for our valued consumers.
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchProducts}
              className="p-3 rounded-xl glass-panel hover:bg-white/5 text-slate-400 transition-colors"
              title="Refresh Catalog"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            </button>
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2.5 rounded-xl glass-panel bg-slate-900/40 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              layout
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="glass-panel h-[350px] rounded-2xl animate-pulse bg-slate-800/20"
                />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="p-6 rounded-full bg-red-500/10 text-red-400 mb-6 font-mono text-lg border border-red-500/20">
                {error}
              </div>
              <button
                onClick={fetchProducts}
                className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold"
              >
                Try Again
              </button>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-slate-500"
            >
              <LayoutGrid size={64} className="mb-6 opacity-20" />
              <p className="text-xl">Our shelves are empty at the moment.</p>
              <p className="text-sm italic">
                Check back later for new arrivals.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={(p) => navigate(`/checkout/${p.id}`)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
