import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Folder,
  History,
  X,
  Layers,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category, Transaction } from '../types/finance';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import { CategoryIcon, AVAILABLE_ICONS, MINIMAL_PALETTE } from '../components/common/CategoryIcon';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    transactions,
    settings,
    addCategory,
    updateCategory,
    deleteCategory,
    categorySpending,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#A3B18A');
  const [formIcon, setFormIcon] = useState('Folder');
  const [formBudget, setFormBudget] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Safety Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteAction, setDeleteAction] = useState<'archive' | 'reassign'>('archive');
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // History Inspector Drawer
  const [viewHistoryCat, setViewHistoryCat] = useState<Category | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((c: Category) => c.type === activeTab && !c.isArchived);
  }, [categories, activeTab]);

  const archivedCategories = useMemo(() => {
    return categories.filter((c: Category) => c.type === activeTab && c.isArchived);
  }, [categories, activeTab]);

  const inspectedTransactions = useMemo(() => {
    if (!viewHistoryCat) return [];
    return transactions
      .filter((t: Transaction) => t.categoryId === viewHistoryCat.id)
      .sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date));
  }, [transactions, viewHistoryCat]);

  const inspectedTotalSpend = useMemo(() => {
    return inspectedTransactions.reduce((acc: number, t: Transaction) => acc + t.amount, 0);
  }, [inspectedTransactions]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormColor(activeTab === 'expense' ? '#BC4749' : '#40916C');
    setFormIcon(activeTab === 'expense' ? 'Tag' : 'TrendingUp');
    setFormBudget('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setFormBudget(cat.budgetLimit ? cat.budgetLimit.toString() : '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    const budgetNum = formBudget ? parseFloat(formBudget) : undefined;

    try {
      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: formName.trim(),
          color: formColor,
          icon: formIcon,
          budgetLimit: budgetNum && budgetNum > 0 ? budgetNum : undefined,
        });
      } else {
        await addCategory({
          name: formName.trim(),
          type: activeTab,
          color: formColor,
          icon: formIcon,
          budgetLimit: budgetNum && budgetNum > 0 ? budgetNum : undefined,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Failed to save: ${msg}`);
    }
  };

  const handleOpenDelete = (cat: Category) => {
    const affectedTxs = transactions.filter((t: Transaction) => t.categoryId === cat.id);
    setCategoryToDelete(cat);
    setDeleteAction(affectedTxs.length > 0 ? 'archive' : 'reassign');

    const others = categories.filter((c: Category) => c.id !== cat.id && c.type === cat.type && !c.isArchived);
    setReassignTargetId(others[0]?.id || '');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory(categoryToDelete.id, deleteAction, reassignTargetId);
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Type Switcher */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#588157] dark:text-[#A3B18A]" />
              <span>Category Management</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Custom income and expense categories, subtle color signatures, and monthly budget limits.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-[#EAEAE7] dark:border-[#2A2B30] pb-3">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'expense'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Expenses</span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-300">
              {categories.filter((c: Category) => c.type === 'expense' && !c.isArchived).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'income'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Income</span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-300">
              {categories.filter((c: Category) => c.type === 'income' && !c.isArchived).length}
            </span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((cat: Category) => {
          const currentMonthSpend = categorySpending[cat.id] || 0;
          const budget = cat.budgetLimit || 0;
          const utilization = budget > 0 ? (currentMonthSpend / budget) * 100 : 0;
          const txCount = transactions.filter((t: Transaction) => t.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="min-card p-4 flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white text-xs">{cat.name}</h3>
                      <span className="text-[10px] text-neutral-400">
                        {txCount} records
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewHistoryCat(cat)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(cat)}
                      className="p-1 rounded text-neutral-400 hover:text-[#BC4749]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeTab === 'expense' && (
                  <div className="mt-3 pt-2.5 border-t border-[#EAEAE7] dark:border-[#2A2B30] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-neutral-500">
                      <span>Spent:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">
                        {formatCurrency(currentMonthSpend, settings.currency)}
                      </span>
                    </div>

                    {budget > 0 ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Limit: {formatCompactCurrency(budget, settings.currency)}</span>
                          <span
                            className={
                              utilization > 100
                                ? 'text-[#BC4749] font-medium'
                                : utilization > 80
                                ? 'text-[#C99757]'
                                : 'text-neutral-600 dark:text-neutral-400'
                            }
                          >
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilization > 100
                                ? 'bg-[#BC4749]'
                                : utilization > 80
                                ? 'bg-[#C99757]'
                                : 'bg-[#A3B18A]'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-sans block">No limit set</span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewHistoryCat(cat)}
                className="mt-3 text-left text-[11px] text-[#588157] dark:text-[#A3B18A] hover:underline"
              >
                Inspect logs →
              </button>
            </div>
          );
        })}
      </div>

      {/* Archived Categories */}
      {archivedCategories.length > 0 && (
        <div className="min-card p-4 opacity-75">
          <span className="text-xs font-medium text-neutral-500 block mb-2">
            Archived Categories ({archivedCategories.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {archivedCategories.map((cat: Category) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] text-xs text-neutral-500"
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                <button
                  onClick={() => updateCategory({ ...cat, isArchived: false })}
                  className="text-[10px] text-[#588157] hover:underline ml-1"
                >
                  Restore
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscriptions, Studio Rent, Consulting"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              {activeTab === 'expense' && (
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Monthly Budget Target ({settings.currency.symbol}) (Optional)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    placeholder="e.g. 15000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Minimal Palette */}
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">Color Tone</label>
                <div className="flex flex-wrap gap-2">
                  {MINIMAL_PALETTE.map((nc) => (
                    <button
                      key={nc.hex}
                      type="button"
                      onClick={() => setFormColor(nc.hex)}
                      className={`w-6 h-6 rounded-md transition-transform ${
                        formColor === nc.hex ? 'scale-110 ring-2 ring-neutral-400' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: nc.hex }}
                      title={nc.name}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">Icon</label>
                <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto p-1.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30]">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                        formIcon === iconName
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                      }`}
                      title={iconName}
                    >
                      <CategoryIcon name={iconName} className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Delete / Archive Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-2">
              Remove "{categoryToDelete.name}"
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              To preserve your financial historical accuracy, please choose whether to archive this category or reassign its historical records:
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] cursor-pointer">
                <input
                  type="radio"
                  name="delAction"
                  checked={deleteAction === 'archive'}
                  onChange={() => setDeleteAction('archive')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block text-neutral-900 dark:text-white font-medium">Archive Category (Recommended)</strong>
                  <span className="text-[11px] text-neutral-400">
                    Hides the category from new entries while keeping historical transaction integrity.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] cursor-pointer">
                <input
                  type="radio"
                  name="delAction"
                  checked={deleteAction === 'reassign'}
                  onChange={() => setDeleteAction('reassign')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block text-neutral-900 dark:text-white font-medium">Reassign Transactions</strong>
                  <span className="text-[11px] text-neutral-400">
                    Moves past transactions to another category and removes this one.
                  </span>
                </div>
              </label>

              {deleteAction === 'reassign' && (
                <div className="pl-4">
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    Target Category:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs"
                  >
                    {categories
                      .filter((c: Category) => c.id !== categoryToDelete.id && c.type === categoryToDelete.type && !c.isArchived)
                      .map((c: Category) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#BC4749] text-white hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Inspector Drawer */}
      {viewHistoryCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white dark:bg-[#1C1D21] border-l border-[#EAEAE7] dark:border-[#2A2B30] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${viewHistoryCat.color}15`, color: viewHistoryCat.color }}
                  >
                    <CategoryIcon name={viewHistoryCat.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{viewHistoryCat.name}</h3>
                    <span className="text-[10px] text-neutral-400">Historical Records</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewHistoryCat(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                  <span className="text-[10px] text-neutral-400 block">TOTAL VOLUME</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                    {formatCurrency(inspectedTotalSpend, settings.currency)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                  <span className="text-[10px] text-neutral-400 block">TRANSACTIONS</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                    {inspectedTransactions.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {inspectedTransactions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-neutral-400">
                    No transactions associated with this category yet.
                  </div>
                ) : (
                  inspectedTransactions.map((tx: Transaction) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{tx.title}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">{tx.date}</span>
                      </div>
                      <span className="font-mono font-medium text-neutral-900 dark:text-white">
                        {formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setViewHistoryCat(null)}
              className="w-full py-2 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
