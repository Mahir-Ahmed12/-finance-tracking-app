import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, Tag, CreditCard, Folder, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { getTodayString } from '../../utils/date';

export const TransactionModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    editingTransaction,
    setEditingTransaction,
    addTransaction,
    updateTransaction,
    categories,
    accounts,
    settings,
  } = useFinance();

  const isOpen = activeModal === 'transaction';

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod || 'Bank Transfer');
      setDescription(editingTransaction.description || '');
      setTagsInput((editingTransaction.tags || []).join(', '));
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setDate(getTodayString());
      setPaymentMethod('Bank Transfer');
      setDescription('');
      setTagsInput('');

      const firstAcc = accounts.find((a) => a.id === settings.defaultAccountId) || accounts[0];
      if (firstAcc) setAccountId(firstAcc.id);
    }
    setError(null);
  }, [editingTransaction, accounts, settings.defaultAccountId, isOpen]);

  useEffect(() => {
    const validCats = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense') && !c.isArchived);
    if (validCats.length > 0 && (!categoryId || !validCats.some((c) => c.id === categoryId))) {
      setCategoryId(validCats[0].id);
    }
  }, [type, categories, categoryId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveModal(null);
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          title: title.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          type,
          categoryId,
          accountId,
          date,
          paymentMethod,
          description: description.trim() || undefined,
          tags,
        });
      } else {
        await addTransaction({
          title: title.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          type,
          categoryId,
          accountId,
          date,
          paymentMethod,
          description: description.trim() || undefined,
          tags,
        });
      }
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'income' ? 'income' : 'expense') && !c.isArchived
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749] text-xs">
              {error}
            </div>
          )}

          {/* Minimal Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F5F5F3] dark:bg-[#121316] border border-[#EAEAE7] dark:border-[#2A2B30]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-[#1C1D21] text-[#BC4749] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-[#1C1D21] text-[#2D6A4F] dark:text-[#40916C] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Income
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Title / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fiber Internet, Supermarket, Client Invoice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
              >
                {accounts.filter((a) => !a.isArchived).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Payment Method
              </label>
              <input
                type="text"
                list="methods-list"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Bank Transfer, Card, Cash"
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
              />
              <datalist id="methods-list">
                <option value="Bank Transfer" />
                <option value="Credit Card" />
                <option value="Debit Card" />
                <option value="Cash" />
                <option value="bKash" />
                <option value="Nagad" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="work, personal, software"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional memo or invoice reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-neutral-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
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
              <span>{isSubmitting ? 'Saving...' : editingTransaction ? 'Save Changes' : 'Add Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
