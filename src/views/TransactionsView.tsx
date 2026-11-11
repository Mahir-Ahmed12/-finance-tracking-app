import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  Plus,
  Copy,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/math';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { Transaction, TransactionType, Category, Account } from '../types/finance';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    settings,
    setActiveModal,
    setEditingTransaction,
    duplicateTransaction,
    deleteTransaction,
    exportCSV,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const catMap = useMemo(() => new Map<string, Category>(categories.map((c: Category) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map<string, Account>(accounts.map((a: Account) => [a.id, a])), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t: Transaction) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = (t.description || '').toLowerCase().includes(q);
          const matchesTags = (t.tags || []).some((tag: string) => tag.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesTags) return false;
        }

        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;

        return true;
      })
      .sort((a: Transaction, b: Transaction) => {
        let comp = 0;
        if (sortBy === 'date') comp = a.date.localeCompare(b.date);
        else if (sortBy === 'amount') comp = a.amount - b.amount;
        else if (sortBy === 'title') comp = a.title.localeCompare(b.title);

        return sortDirection === 'desc' ? -comp : comp;
      });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    accountFilter,
    startDate,
    endDate,
    sortBy,
    sortDirection,
  ]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setActiveModal('transaction');
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete transaction "${title}"?`)) {
      deleteTransaction(id);
      if (selectedTx?.id === id) setSelectedTx(null);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="min-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions by title, memo, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/60 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs sm:text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setActiveModal('transfer')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-500" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => {
                setEditingTransaction(null);
                setActiveModal('transaction');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>New Transaction</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-medium uppercase text-neutral-400 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-medium uppercase text-neutral-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-[10px] font-medium uppercase text-neutral-400 mb-1">Account</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a: Account) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[10px] font-medium uppercase text-neutral-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium uppercase text-neutral-400 mb-1">Sort</label>
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="p-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                title="Toggle sort direction"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3 pt-2 text-xs text-neutral-500">
            <span>
              Showing {filteredTransactions.length} of {transactions.length} records
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[#BC4749] hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="min-card overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {transactions.length === 0 ? 'No transactions recorded yet' : 'No matching transactions'}
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Your financial ledger is currently empty and all figures are at zero. Add your first transaction to get started.'
                : 'Try adjusting your search query, date interval, or active filters.'}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setActiveModal('transaction');
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Transaction</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAEAE7] dark:border-[#2A2B30] text-neutral-400 uppercase text-[10px] tracking-wider font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE7] dark:divide-[#2A2B30]">
                {filteredTransactions.map((tx: Transaction) => {
                  const cat = catMap.get(tx.categoryId);
                  const acc = accMap.get(tx.accountId);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {tx.title}
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {tx.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{
                            backgroundColor: `${cat?.color || '#777777'}15`,
                            color: cat?.color || '#555555',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Folder'} className="w-3 h-3" />
                          <span>{cat?.name || 'Uncategorized'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {acc?.name || 'Unknown'}
                      </td>

                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {tx.paymentMethod || '—'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-medium text-xs">
                        {tx.type === 'income' ? (
                          <span className="text-[#2D6A4F] dark:text-[#52B788]">
                            +{formatCurrency(tx.amount, settings.currency)}
                          </span>
                        ) : tx.type === 'expense' ? (
                          <span className="text-[#BC4749] dark:text-[#E07A5F]">
                            -{formatCurrency(tx.amount, settings.currency)}
                          </span>
                        ) : (
                          <span className="text-neutral-700 dark:text-neutral-300">
                            ⇄ {formatCurrency(tx.amount, settings.currency)}
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateTransaction(tx.id)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id, tx.title)}
                            className="p-1 rounded text-neutral-400 hover:text-[#BC4749]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                Transaction Details
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Title:</span>
                <span className="text-neutral-900 dark:text-white font-medium">{selectedTx.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Amount:</span>
                <span
                  className={`font-mono font-semibold text-sm ${
                    selectedTx.type === 'income' ? 'text-[#2D6A4F] dark:text-[#52B788]' : 'text-[#BC4749]'
                  }`}
                >
                  {formatCurrency(selectedTx.amount, settings.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Date:</span>
                <span className="text-neutral-700 dark:text-neutral-300 font-mono">{selectedTx.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Category:</span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {catMap.get(selectedTx.categoryId)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Account:</span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {accMap.get(selectedTx.accountId)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Payment Method:</span>
                <span className="text-neutral-700 dark:text-neutral-300">{selectedTx.paymentMethod || '—'}</span>
              </div>
              {selectedTx.description && (
                <div className="pt-2 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
                  <span className="text-neutral-400 block mb-1">Memo:</span>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">{selectedTx.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  handleEdit(selectedTx);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
