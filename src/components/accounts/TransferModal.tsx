import React, { useState } from 'react';
import { X, ArrowRightLeft, DollarSign, Calendar, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getTodayString } from '../../utils/date';
import { formatCurrency } from '../../utils/math';

export const TransferModal: React.FC = () => {
  const { activeModal, setActiveModal, accounts, executeTransfer, settings } = useFinance();

  const isOpen = activeModal === 'transfer';
  const availableAccounts = accounts.filter((a) => !a.isArchived);

  const [fromAccountId, setFromAccountId] = useState(availableAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(availableAccounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveModal(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid transfer amount.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Origin and destination accounts must be different.');
      return;
    }

    setIsSubmitting(true);
    try {
      await executeTransfer({
        fromAccountId,
        toAccountId,
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        description: description.trim() || undefined,
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Transfer error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Transfer Funds
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749] text-xs">
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-[#EAEAE7] dark:border-[#2A2B30] text-xs text-neutral-600 dark:text-neutral-400">
            Transfers reallocate funds between accounts and do not affect income or expense calculations.
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Amount ({settings.currency.symbol})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-base font-semibold focus:outline-none focus:border-neutral-400"
              />
              <DollarSign className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* From Account */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              From Account
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
            >
              {availableAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance, settings.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              To Account
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
            >
              {availableAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance, settings.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-neutral-400"
              />
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Card payment, Savings reserve deposit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transferring...' : 'Execute Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
