import React, { useState, useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  Pencil,
  Save,
  X,
  Sliders,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatMonthDisplay, getPrevMonth } from '../utils/date';
import { Category, Transaction } from '../types/finance';

export const BudgetsView: React.FC = () => {
  const {
    monthlyBudget,
    saveMonthlyBudget,
    totalExpenses,
    remainingBudget,
    budgetUtilization,
    categorySpending,
    categories,
    settings,
    selectedMonth,
    budgets,
    transactions,
  } = useFinance();

  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [overallInput, setOverallInput] = useState(monthlyBudget.overallLimit.toString());

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [catLimitsInput, setCatLimitsInput] = useState<Record<string, string>>({});

  const expenseCategories = useMemo(() => {
    return categories.filter((c: Category) => c.type === 'expense' && !c.isArchived);
  }, [categories]);

  const prevMonthStr = getPrevMonth(selectedMonth);
  const prevMonthBudget = useMemo(() => {
    return budgets.find((b) => b.month === prevMonthStr);
  }, [budgets, prevMonthStr]);

  const prevMonthExpenses = useMemo(() => {
    return transactions
      .filter((t: Transaction) => t.date.startsWith(prevMonthStr) && t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [transactions, prevMonthStr]);

  const { overspentCategories, warningCategories } = useMemo(() => {
    const over: Array<{ category: Category; spent: number; limit: number; pct: number }> = [];
    const warn: Array<{ category: Category; spent: number; limit: number; pct: number }> = [];

    expenseCategories.forEach((cat: Category) => {
      const spent = categorySpending[cat.id] || 0;
      const limit = monthlyBudget.categoryLimits[cat.id] || cat.budgetLimit || 0;

      if (limit > 0) {
        const pct = (spent / limit) * 100;
        const item = { category: cat, spent, limit, pct };
        if (pct >= 100) over.push(item);
        else if (pct >= 75) warn.push(item);
      }
    });

    return { overspentCategories: over, warningCategories: warn };
  }, [expenseCategories, categorySpending, monthlyBudget]);

  const handleStartEditingCategories = () => {
    const initial: Record<string, string> = {};
    expenseCategories.forEach((cat: Category) => {
      const lim = monthlyBudget.categoryLimits[cat.id] || cat.budgetLimit || 0;
      initial[cat.id] = lim > 0 ? lim.toString() : '';
    });
    setCatLimitsInput(initial);
    setIsEditingCategories(true);
  };

  const handleSaveAllCategoryLimits = async () => {
    const updatedLimits: Record<string, number> = {};
    Object.entries(catLimitsInput).forEach(([catId, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        updatedLimits[catId] = num;
      }
    });

    await saveMonthlyBudget(selectedMonth, monthlyBudget.overallLimit, updatedLimits);
    setIsEditingCategories(false);
  };

  const handleSaveOverallLimit = async () => {
    const num = parseFloat(overallInput);
    if (!isNaN(num) && num > 0) {
      await saveMonthlyBudget(selectedMonth, num, monthlyBudget.categoryLimits);
    }
    setIsEditingOverall(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Master Limit */}
      <div className="min-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-[#588157] dark:text-[#A3B18A]" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Monthly Spending Ceiling — {formatMonthDisplay(selectedMonth)}
              </span>
            </div>

            <div className="flex items-baseline gap-4 mt-1">
              {isEditingOverall ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="500"
                    value={overallInput}
                    onChange={(e) => setOverallInput(e.target.value)}
                    className="w-44 px-3 py-1.5 rounded-lg border border-neutral-400 bg-white dark:bg-[#1C1D21] text-xl font-semibold font-mono text-neutral-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSaveOverallLimit}
                    className="p-2 rounded-lg bg-[#171717] dark:bg-white text-white dark:text-[#171717]"
                    title="Save"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingOverall(false)}
                    className="p-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] text-neutral-500"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-semibold font-mono text-neutral-900 dark:text-white tracking-tight">
                    {formatCurrency(monthlyBudget.overallLimit, settings.currency, { decimals: 0 })}
                  </span>
                  <button
                    onClick={() => {
                      setOverallInput(monthlyBudget.overallLimit.toString());
                      setIsEditingOverall(true);
                    }}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    title="Edit Target"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Master discretionary budget target for this calendar month.
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Total Spent</span>
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                {formatCurrency(totalExpenses, settings.currency, { decimals: 0 })}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-[#EAEAE7] dark:bg-[#2A2B30]" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Remaining</span>
              <span
                className={`text-lg font-semibold ${
                  remainingBudget < 0 ? 'text-[#BC4749]' : 'text-[#2D6A4F] dark:text-[#40916C]'
                }`}
              >
                {formatCurrency(remainingBudget, settings.currency, { decimals: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-neutral-500">
              Budget Utilization: <strong className="text-neutral-900 dark:text-white font-mono">{budgetUtilization.toFixed(1)}%</strong>
            </span>
            {budgetUtilization >= 100 ? (
              <span className="text-[#BC4749] font-medium text-xs">Exceeded Limit</span>
            ) : budgetUtilization >= 90 ? (
              <span className="text-[#C99757] font-medium text-xs">Approaching Limit (90%)</span>
            ) : (
              <span className="text-[#2D6A4F] dark:text-[#40916C] font-medium text-xs">Within Target</span>
            )}
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetUtilization >= 100
                  ? 'bg-[#BC4749]'
                  : budgetUtilization >= 85
                  ? 'bg-[#C99757]'
                  : 'bg-[#A3B18A]'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Overspent Categories Banner */}
      {overspentCategories.length > 0 && (
        <div className="min-card p-4 border-[#BC4749]/30 bg-[#BC4749]/5">
          <div className="flex items-center gap-2 text-[#BC4749] text-xs font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Overspent Categories ({overspentCategories.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {overspentCategories.map((item) => (
              <div
                key={item.category.id}
                className="p-2.5 rounded-lg bg-white dark:bg-[#1C1D21] border border-[#EAEAE7] dark:border-[#2A2B30] flex items-center justify-between text-xs"
              >
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.category.name}</span>
                <span className="font-mono text-[#BC4749] font-medium">
                  +{formatCurrency(item.spent - item.limit, settings.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
              Category Budgets
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target spending limits configured per category.
            </p>
          </div>

          {isEditingCategories ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAllCategoryLimits}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90"
              >
                Save Limits
              </button>
              <button
                onClick={() => setIsEditingCategories(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditingCategories}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Limits</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((cat: Category) => {
            const spent = categorySpending[cat.id] || 0;
            const limit = monthlyBudget.categoryLimits[cat.id] || cat.budgetLimit || 0;
            const util = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit > 0 ? limit - spent : 0;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/30 dark:bg-[#121316]/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-xs text-neutral-900 dark:text-white">{cat.name}</span>
                    </div>

                    {limit > 0 && (
                      <span
                        className={`text-xs font-mono font-medium ${
                          util >= 100 ? 'text-[#BC4749]' : util >= 80 ? 'text-[#C99757]' : 'text-neutral-500'
                        }`}
                      >
                        {util.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {isEditingCategories ? (
                    <div className="my-2">
                      <input
                        type="number"
                        step="500"
                        placeholder="No limit"
                        value={catLimitsInput[cat.id] ?? ''}
                        onChange={(e) =>
                          setCatLimitsInput({ ...catLimitsInput, [cat.id]: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 my-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Spent:</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {formatCurrency(spent, settings.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>Limit:</span>
                        <span>{limit > 0 ? formatCurrency(limit, settings.currency) : 'None'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {limit > 0 && (
                  <div className="w-full bg-neutral-200/60 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        util >= 100 ? 'bg-[#BC4749]' : util >= 80 ? 'bg-[#C99757]' : 'bg-[#A3B18A]'
                      }`}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
