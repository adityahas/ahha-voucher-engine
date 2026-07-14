import React, { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Tag, Search, Loader2 } from 'lucide-react';
import { CategoryChip } from './CategoryChip';
import { Input } from './Input';
import { getProductCategories, ProductCategory } from '../../api/products';

interface CategoryChipsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
}

export const CategoryChipsInput: React.FC<CategoryChipsInputProps> = ({
  values = [],
  onChange,
  placeholder = 'Type and press Enter...',
  label = 'Product Categories',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ProductCategory[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    ProductCategory[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllCategories = async () => {
      setIsLoading(true);
      try {
        const cats = await getProductCategories();
        setSuggestions(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        (cat) =>
          cat.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !values.includes(cat.name),
      );
      setFilteredSuggestions(filtered);
      setIsDropdownOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [inputValue, suggestions, values]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !values.includes(trimmed)) {
        addCategory(trimmed);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const addCategory = (name: string) => {
    onChange([...values, name]);
    setInputValue('');
    setIsDropdownOpen(false);
  };

  const removeChip = (indexToRemove: number) => {
    onChange(values.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3 relative">
      {label && (
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Tag className="w-3 h-3 text-primary-400" />
          {label}
        </label>
      )}

      <div className="relative group/input">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-slate-500 group-focus-within/input:text-primary-400 transition-colors" />
          )}
        </div>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            inputValue.trim() &&
            filteredSuggestions.length > 0 &&
            setIsDropdownOpen(true)
          }
          placeholder={placeholder}
          className="bg-slate-800/50 border-slate-700/50 focus:border-primary-500/50 transition-all duration-300 pl-10"
        />

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto thin-scrollbar"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => addCategory(suggestion.name)}
                  className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-primary-500/10 hover:text-primary-400 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium">{suggestion.name}</span>
                  <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[32px]">
        <AnimatePresence mode="popLayout">
          {values.map((value, index) => (
            <CategoryChip
              key={`${value}-${index}`}
              name={value}
              onRemove={() => removeChip(index)}
            />
          ))}
        </AnimatePresence>

        {values.length === 0 && !isLoading && (
          <p className="text-xs text-slate-500 italic mt-1 ml-1 animate-in fade-in duration-700">
            No categories assigned. Type above to add or select.
          </p>
        )}
      </div>
    </div>
  );
};
