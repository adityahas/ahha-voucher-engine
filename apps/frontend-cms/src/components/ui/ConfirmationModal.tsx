import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="text-red-500" size={24} />,
      button: 'bg-red-500 hover:bg-red-600 text-white',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
    },
    info: {
      icon: <AlertTriangle className="text-primary-500" size={24} />,
      button: 'bg-primary-500 hover:bg-primary-600 text-white',
      border: 'border-primary-500/20',
      bg: 'bg-primary-500/10',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${style.bg} border ${style.border}`}>
            {style.icon}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-slate-700 hover:bg-slate-800"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
