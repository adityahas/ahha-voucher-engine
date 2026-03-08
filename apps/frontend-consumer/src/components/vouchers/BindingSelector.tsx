import { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BindingTag } from './BindingTag';
import type { VoucherBinding } from '../../types/voucher';

interface BindingSelectorProps {
  onFind: (bindings: VoucherBinding[]) => void;
  isLoading?: boolean;
}

const BINDING_TYPES = [
  { value: 'role', label: 'Role' },
  { value: 'user_group', label: 'User Group' },
  { value: 'product_type', label: 'Product Type' },
  { value: 'product_sku', label: 'Product SKU' },
  { value: 'product_vendor', label: 'Product Vendor' },
];

export function BindingSelector({ onFind, isLoading }: BindingSelectorProps) {
  const [bindings, setBindings] = useState<VoucherBinding[]>([]);
  const [currentType, setCurrentType] = useState(BINDING_TYPES[0].value);
  const [currentValue, setCurrentValue] = useState('');

  const handleAdd = () => {
    if (!currentValue.trim()) return;
    
    // Check for duplicates
    if (bindings.some(b => b.bind_type === currentType && b.bind_value === currentValue)) {
        setCurrentValue('');
        return;
    }

    setBindings([...bindings, { bind_type: currentType, bind_value: currentValue }]);
    setCurrentValue('');
  };

  const handleRemove = (index: number) => {
    setBindings(bindings.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setBindings([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 mb-10 border border-white/10 bg-slate-900/40 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Search className="w-5 h-5 text-cyan-400" />
        Voucher Finder
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6">
        <div className="md:col-span-4">
          <Select
            label="Binding Type"
            options={BINDING_TYPES}
            value={currentType}
            onChange={(e) => setCurrentType(e.target.value)}
          />
        </div>
        <div className="md:col-span-6">
          <Input
            label="Binding Value"
            placeholder="e.g. loyal_member, electronics, SKU123..."
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={handleAdd}
            className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white gap-2 transition-all hover:border-cyan-500/50 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 min-h-[32px]">
        <AnimatePresence>
          {bindings.map((binding, index) => (
            <BindingTag
              key={`${binding.bind_type}-${binding.bind_value}-${index}`}
              binding={binding}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </AnimatePresence>
        {bindings.length === 0 && (
          <p className="text-sm text-slate-500 italic py-1">No filters added yet. Fetching all eligible vouchers.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => onFind(bindings)}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white border-none shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all gap-2"
        >
          {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Search className="w-4 h-4" /></motion.div> : <Search className="w-4 h-4" />}
          Find Eligible Vouchers
        </Button>
        
        {bindings.length > 0 && (
          <Button
            onClick={handleReset}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-2 bg-transparent shadow-none"
          >
            <Trash2 className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </motion.div>
  );
}
