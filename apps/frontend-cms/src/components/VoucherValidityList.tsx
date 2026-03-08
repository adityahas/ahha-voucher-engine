import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import {
  getVoucherValidities,
  createVoucherValidity,
  updateVoucherValidity,
  deleteVoucherValidity,
  VoucherValidity,
} from '../api/vouchers';
import { Button } from './ui/Button';
import VoucherValidityModal from './VoucherValidityModal';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

interface VoucherValidityListProps {
  voucherId: string;
}

export const VoucherValidityList: React.FC<VoucherValidityListProps> = ({ voucherId }) => {
  const [validities, setValidities] = useState<VoucherValidity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingValidity, setEditingValidity] = useState<VoucherValidity | null>(null);

  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validityToDelete, setValidityToDelete] = useState<number | null>(null);

  const fetchValidities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVoucherValidities(voucherId);
      setValidities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedules.');
    } finally {
      setIsLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    if (voucherId) {
      fetchValidities();
    }
  }, [fetchValidities, voucherId]);

  const handleCreateOrUpdate = async (validityPayload: Partial<VoucherValidity>) => {
    if (editingValidity) {
      await updateVoucherValidity(voucherId, editingValidity.id, validityPayload);
    } else {
      await createVoucherValidity(voucherId, validityPayload);
    }
    await fetchValidities();
  };

  const handleDelete = (e: React.MouseEvent, validityId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setValidityToDelete(validityId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!validityToDelete) return;

    setError(null);
    setIsDeleting(validityToDelete);
    try {
      await deleteVoucherValidity(voucherId, validityToDelete);
      await fetchValidities();
      setIsConfirmOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete schedule.');
    } finally {
      setIsDeleting(null);
      setValidityToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingValidity(null);
    setIsModalOpen(true);
  };

  const openEditModal = (validity: VoucherValidity) => {
    setEditingValidity(validity);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'No end date';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-xl mt-8">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="text-primary-400" size={20} />
            Validity Schedules
          </CardTitle>
          <CardDescription>Configure when this voucher can be claimed or used.</CardDescription>
        </div>
        <Button variant="primary" icon={Plus} size="sm" onClick={openAddModal}>
          Add Schedule
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
            <p className="text-sm text-slate-400 font-medium">Loading schedules...</p>
          </div>
        ) : validities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
              <Calendar className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Schedules Defined</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              This voucher has no automated validity schedules. Add schedules to automatically activate or deactivate it.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800/50 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800/40 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Valid Period (Dates)</th>
                  <th scope="col" className="px-6 py-4">Allowed Hours (Time)</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {validities.map((validity) => (
                  <tr
                    key={validity.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {validity.type.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex flex-col">
                        <span>{formatDate(validity.start_date)}</span>
                        <span className="text-slate-500 text-xs">to {formatDate(validity.end_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                       {validity.start_time} - {validity.end_time}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(validity);
                          }}
                          className="p-2 bg-slate-800/50 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Edit"
                          disabled={isDeleting !== null}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, validity.id)}
                          className={`p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDeleting === validity.id ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''
                          }`}
                          title="Delete"
                          disabled={isDeleting !== null}
                        >
                          {isDeleting === validity.id ? (
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

      <VoucherValidityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOrUpdate}
        validity={editingValidity}
        voucherId={voucherId}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Schedule"
        message="Are you sure you want to delete this validity schedule? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting !== null}
        variant="danger"
      />
    </Card>
  );
};

export default VoucherValidityList;
