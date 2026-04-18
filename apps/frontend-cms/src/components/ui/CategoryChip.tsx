import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CategoryChipProps {
  name: string;
  onRemove?: () => void;
  className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  name,
  onRemove,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      layout
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
        bg-primary-500/20 border border-primary-500/30
        text-primary-200 text-xs font-semibold backdrop-blur-md
        transition-all duration-300 hover:bg-primary-500/30
        ${className}
      `}
    >
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-primary-300 hover:text-white" />
          <span className="sr-only">Remove {name}</span>
        </button>
      )}
    </motion.div>
  );
};
