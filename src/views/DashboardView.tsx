import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Compass,
  Plus,
  Repeat,
  AlertCircle,
  Copy,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import {
  CyberDonutChart,
  CyberBarComparisonChart,
  CyberDailyActivityBar,
  CyberHealthGauge,
} from '../components/charts/CyberCharts';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { formatRelativeDate, formatMonthDisplay } from '../utils/date';
import { Transaction, Category, Account } from '../types/finance';

interface DashboardViewProps {
  onNavigateToTransactions: () => void;
  onNavigateToRecurring: () => void;
  onNavigateToBudgets: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTransactions,
  onNavigateToRecurring,
  onNavigateToBudgets,
}) => {
  const {
    transactions,
    currentMonthTransactions,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    remainingBudget,
    budgetUtilization,
    monthlyBudget,
    totalNetWorth,
    topSpendingCategories,
    categories,
    accounts,
    settings,
    recurring,
    selectedMonth,
    setActiveModal,
    setEditingTransaction,
    duplicateTransaction,
    deleteTransaction,
  } = useFinance();

  const catMap = useMemo(() => new Map<string, Category>(categories.map((c: Category) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map<string, Account>(accounts.map((a: Account) => [a.id, a])), [accounts]);

  const donutData = useMemo(() => {
    return topSpendingCategories.map((item) => ({
      label: item.category.name,
      value: item.amount,
      color: item.category.color,
      percentage: item.percentage,
      icon: item.category.icon,
    }));
  }, [topSpendingCategories]);

  // Real 6-Month Comparison Trends computed strictly from stored records
  const monthlyTrendData = useMemo(() => {
    const [currY, currM] = selectedMonth.split('-').map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currY, currM - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mShort = d.toLocaleString('default', { month: 'short' });
      months.push({ key: mStr, label: mShort });
    }

    return months.map((m) => {
      let inc = 0;
      let exp = 0;
      transactions.forEach((tx: Transaction) => {
        if (tx.date.startsWith(m.key)) {
          if (tx.type === 'income') inc += tx.amount;
          if (tx.type === 'expense') exp += tx.amount;
        }
      });
      return {
        period: m.label,
        income: inc,
        expense: exp,
      };
    });
  }, [selectedMonth, transactions]);

  // Daily spend for selected month
  const dailySpendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysMap: Record<number, number> = {};

    currentMonthTransactions.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        const d = parseInt(tx.date.split('-')[2] || '1', 10);
        daysMap[d] = (daysMap[d] || 0) + tx.amount;
      }
    });

    const result = [];
    const today = new Date();
    const isCurrentYearMonth =
      today.getFullYear() === year && today.getMonth() + 1 === month;
    const currentDayNum = today.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      result.push({
        day: i,
        amount: daysMap[i] || 0,
        isToday: isCurrentYearMonth && i === currentDayNum,
      });
    }
    return result;
  }, [currentMonthTransactions, selectedMonth]);

  // Health score
  const healthScore = useMemo(() => {
    let score = 55;
    if (savingsRate > 30) score += 30;
    else if (savingsRate > 20) score += 20;
    else if (savingsRate > 10) score += 10;
    else if (savingsRate < 0) score -= 25;

    if (budgetUtilization > 100) score -= 25;
    else if (budgetUtilization > 90) score -= 10;
    else if (budgetUtilization < 75) score += 15;

    return Math.min(Math.max(score, 10), 100);
  }, [savingsRate, budgetUtilization]);

  // Upcoming recurring transactions
  const upcomingRecurring = useMemo(() => {
    return recurring.filter((r) => r.active).slice(0, 3);
  }, [recurring]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setActiveModal('transaction');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this transaction from your records?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. HERO BALANCE SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">
            Total Net Balance
          </span>
          <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono">
            {formatCurrency(totalNetWorth, settings.currency, { decimals: 0 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1 font-medium text-[#2D6A4F] dark:text-[#40916C]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {savingsRate.toFixed(1)}% saved this month
            </span>
            <span>•</span>
            <span>{formatMonthDisplay(selectedMonth)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setActiveModal('transaction');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR COMPACT FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="min-card p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">Income</span>
            <span className="w-2 h-2 rounded-full bg-[#40916C]" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-white tracking-tight">
            +{formatCurrency(totalIncome, settings.currency, { decimals: 0 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Inflows this period</span>
        </div>

        {/* Expenses Card */}
        <div className="min-card p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">Expenses</span>
            <span className="w-2 h-2 rounded-full bg-[#C85A5A]" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold font-mono text-neutral-900 dark:text-white tracking-tight">
            -{formatCurrency(totalExpenses, settings.currency, { decimals: 0 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {currentMonthTransactions.filter((t: Transaction) => t.type === 'expense').length} records
          </span>
        </div>

        {/* Net Savings Card */}
        <div className="min-card p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">Net Savings</span>
            <PiggyBank className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-semibold font-mono tracking-tight ${
              netSavings >= 0 ? 'text-[#2D6A4F] dark:text-[#52B788]' : 'text-[#BC4749]'
            }`}
          >
            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings, settings.currency, { decimals: 0 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Net surplus margin</span>
        </div>

        {/* Budget Runway Card */}
        <div className="min-card p-4">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-medium">Budget Remaining</span>
            <Compass className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-semibold font-mono tracking-tight ${
              remainingBudget < 0 ? 'text-[#BC4749]' : 'text-neutral-900 dark:text-white'
            }`}
          >
            {formatCurrency(remainingBudget, settings.currency, { decimals: 0 })}
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetUtilization >= 100
                  ? 'bg-[#BC4749]'
                  : budgetUtilization >= 80
                  ? 'bg-[#C99757]'
                  : 'bg-[#A3B18A]'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cashflow Chart & Recent Transactions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Income vs Expense Minimal Chart */}
          <div className="min-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
                  Cash Flow Overview
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Income vs expense comparison over billing cycles
                </p>
              </div>
            </div>

            <CyberBarComparisonChart
              data={monthlyTrendData}
              currency={settings.currency}
              height={200}
            />
          </div>

          {/* Daily Activity Matrix */}
          <div className="min-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
                Daily Activity
              </h3>
              <span className="text-xs text-neutral-400">{selectedMonth}</span>
            </div>

            <CyberDailyActivityBar
              days={dailySpendData}
              currency={settings.currency}
            />
          </div>

          {/* Recent Transactions Clean List */}
          <div className="min-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
                  Recent Transactions
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Latest activity in {selectedMonth}
                </p>
              </div>

              <button
                onClick={onNavigateToTransactions}
                className="text-xs text-[#588157] dark:text-[#A3B18A] hover:underline font-medium"
              >
                View all ({currentMonthTransactions.length}) →
              </button>
            </div>

            {currentMonthTransactions.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No transactions recorded this month.
              </div>
            ) : (
              <div className="divide-y divide-[#EAEAE7] dark:divide-[#2A2B30]">
                {currentMonthTransactions.slice(0, 5).map((tx: Transaction) => {
                  const cat = catMap.get(tx.categoryId);
                  const acc = accMap.get(tx.accountId);

                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 px-1 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || '#777777'}15`,
                            color: cat?.color || '#555555',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Folder'} className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {tx.title}
                          </p>
                          <span className="text-[11px] text-neutral-400">
                            {tx.date} • {acc?.name || 'Account'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-mono font-medium ${
                            tx.type === 'income'
                              ? 'text-[#2D6A4F] dark:text-[#52B788]'
                              : tx.type === 'expense'
                              ? 'text-[#BC4749] dark:text-[#E07A5F]'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => duplicateTransaction(tx.id)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                            title="Edit"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded text-neutral-400 hover:text-[#BC4749]"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Donut & Health Vital */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spending by Category */}
          <div className="min-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
                  Spending by Category
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Allocation for {selectedMonth}
                </p>
              </div>

              <button
                onClick={onNavigateToBudgets}
                className="text-xs text-[#588157] dark:text-[#A3B18A] hover:underline font-medium"
              >
                Budgets →
              </button>
            </div>

            <CyberDonutChart
              data={donutData}
              currency={settings.currency}
              size={200}
            />
          </div>

          {/* Health Score & Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Financial Health Score */}
            <div className="min-card p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
                  Health Score
                </span>
                <CyberHealthGauge
                  score={healthScore}
                  savingsRate={savingsRate}
                  budgetUtilization={budgetUtilization}
                />
              </div>
            </div>

            {/* Upcoming Automations */}
            <div className="min-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium">
                    Upcoming
                  </span>
                  <Repeat className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-2">
                  {upcomingRecurring.length === 0 ? (
                    <div className="text-xs text-neutral-400 py-3 text-center">
                      No upcoming routines
                    </div>
                  ) : (
                    upcomingRecurring.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30] text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-900 dark:text-white truncate pr-2">
                            {item.title}
                          </span>
                          <span className="font-mono text-neutral-600 dark:text-neutral-400 font-medium shrink-0">
                            {formatCompactCurrency(item.amount, settings.currency)}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Due {formatRelativeDate(item.nextDueDate)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={onNavigateToRecurring}
                className="w-full text-center text-xs text-[#588157] dark:text-[#A3B18A] hover:underline pt-2 border-t border-[#EAEAE7] dark:border-[#2A2B30] mt-3 font-medium"
              >
                Manage Automations →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
