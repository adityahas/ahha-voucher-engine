import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getVoucherBindings,
  createVoucherBinding,
  updateVoucherBinding,
  deleteVoucherBinding,
  VoucherBinding,
} from '../api/vouchers';
import { Button } from './ui/Button';
import VoucherBindingModal from './VoucherBindingModal';
import { ConfirmationModal } from './ui/ConfirmationModal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/Card';

interface VoucherBindingListProps {
  voucherId: string;
}

export const VoucherBindingList: React.FC<VoucherBindingListProps> = ({
  voucherId,
}) => {
  const [bindings, setBindings] = useState<VoucherBinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBinding, setEditingBinding] = useState<VoucherBinding | null>(
    null,
  );

  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bindingToDelete, setBindingToDelete] = useState<number | null>(null);

  const fetchBindings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVoucherBindings(voucherId);
      setBindings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch constraints.');
    } finally {
      setIsLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    if (voucherId) {
      fetchBindings();
    }
  }, [fetchBindings, voucherId]);

  const handleCreateOrUpdate = async (
    bindingPayload: Partial<VoucherBinding>,
  ) => {
    if (editingBinding) {
      await updateVoucherBinding(voucherId, editingBinding.id, bindingPayload);
    } else {
      await createVoucherBinding(voucherId, bindingPayload);
    }
    // Refresh the list after successful save
    await fetchBindings();
  };

  const handleDelete = (e: React.MouseEvent, bindingId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setBindingToDelete(bindingId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bindingToDelete) return;

    setError(null);
    setIsDeleting(bindingToDelete);
    try {
      await deleteVoucherBinding(voucherId, bindingToDelete);
      await fetchBindings();
      setIsConfirmOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete constraint.');
    } finally {
      setIsDeleting(null);
      setBindingToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingBinding(null);
    setIsModalOpen(true);
  };

  const openEditModal = (binding: VoucherBinding) => {
    setEditingBinding(binding);
    setIsModalOpen(true);
  };

  return (
    <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl mt-8">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <LinkIcon className="text-primary-400" size={20} />
            Binding Constraints
          </CardTitle>
          <CardDescription>
            Restrict voucher usage by specific rules.
          </CardDescription>
        </div>
        <Button variant="primary" icon={Plus} size="sm" onClick={openAddModal}>
          Add Constraint
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-slate-400 font-medium">
              Loading constraints...
            </p>
          </div>
        ) : bindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
              <LinkIcon className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">
              No Constraints Defined
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              This voucher currently has global applicability. Add constraints
              to restrict usage.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800/50 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800/40 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Constraint Type
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Value / Target
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {bindings.map((binding) => (
                  <tr
                    key={binding.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {binding.bind_type.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200 font-medium">
                      {binding.bind_value}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(binding);
                          }}
                          className="p-2 bg-slate-800/50 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Edit"
                          disabled={isDeleting !== null}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, binding.id)}
                          className={`p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDeleting === binding.id
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : ''
                          }`}
                          title="Delete"
                          disabled={isDeleting !== null}
                        >
                          {isDeleting === binding.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <VoucherBindingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrUpdate}
        binding={editingBinding}
        voucherId={voucherId}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Constraint"
        message="Are you sure you want to delete this binding constraint? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting !== null}
        variant="danger"
      />
    </Card>
  );
};

export default VoucherBindingList;
