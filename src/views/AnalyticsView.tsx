import React, { useState, useMemo } from 'react';
import {
  Activity,
  Award,
  Zap,
  Calendar,
  Lightbulb,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import {
  CyberBarComparisonChart,
  CyberDonutChart,
} from '../components/charts/CyberCharts';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { getPrevMonth, formatMonthDisplay } from '../utils/date';
import { Transaction, Category } from '../types/finance';

export const AnalyticsView: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    selectedMonth,
    currentMonthTransactions,
    totalIncome,
    totalExpenses,
    savingsRate,
    topSpendingCategories,
  } = useFinance();

  const [timeHorizon, setTimeHorizon] = useState<'6' | '12'>('6');

  const catMap = useMemo(() => new Map<string, Category>(categories.map((c: Category) => [c.id, c])), [categories]);

  const prevMonthStr = getPrevMonth(selectedMonth);
  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t: Transaction) => t.date.startsWith(prevMonthStr));
  }, [transactions, prevMonthStr]);

  const prevMonthExpenses = useMemo(() => {
    return prevMonthTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [prevMonthTransactions]);

  const prevMonthIncome = useMemo(() => {
    return prevMonthTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [prevMonthTransactions]);

  const prevMonthSavings = prevMonthIncome - prevMonthExpenses;
  const prevMonthSavingsRate =
    prevMonthIncome > 0 ? (prevMonthSavings / prevMonthIncome) * 100 : 0;

  const largestTransaction = useMemo(() => {
    const expenses = currentMonthTransactions.filter((t: Transaction) => t.type === 'expense');
    if (expenses.length === 0) return null;
    return [...expenses].sort((a: Transaction, b: Transaction) => b.amount - a.amount)[0];
  }, [currentMonthTransactions]);

  const avgDailyExpenditure = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return totalExpenses / (daysInMonth || 30);
  }, [totalExpenses, selectedMonth]);

  const highestCategory = topSpendingCategories[0];

  // Real Calculated Observations
  const observations = useMemo(() => {
    const list: { title: string; detail: string; type: 'positive' | 'warning' | 'neutral' }[] = [];

    if (prevMonthIncome > 0 && totalIncome > 0) {
      const diffRate = savingsRate - prevMonthSavingsRate;
      if (diffRate > 0) {
        list.push({
          title: 'Savings rate improved',
          detail: `Your monthly savings rate improved by +${diffRate.toFixed(1)}% compared to ${formatMonthDisplay(prevMonthStr)}.`,
          type: 'positive',
        });
      } else if (diffRate < 0) {
        list.push({
          title: 'Savings rate decreased',
          detail: `Your monthly savings rate dipped by ${Math.abs(diffRate).toFixed(1)}% compared to ${formatMonthDisplay(prevMonthStr)}.`,
          type: 'warning',
        });
      }
    }

    if (highestCategory && totalExpenses > 0) {
      list.push({
        title: `Primary spend: ${highestCategory.category.name}`,
        detail: `${highestCategory.category.name} represents ${highestCategory.percentage.toFixed(1)}% of your monthly expenditure (${formatCurrency(highestCategory.amount, settings.currency)}).`,
        type: highestCategory.percentage > 35 ? 'warning' : 'neutral',
      });
    }

    if (prevMonthExpenses > 0 && totalExpenses > 0) {
      const expenseChangePct = ((totalExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
      if (expenseChangePct > 0) {
        list.push({
          title: 'Spending increase',
          detail: `You spent ${expenseChangePct.toFixed(1)}% more than last month.`,
          type: 'warning',
        });
      } else {
        list.push({
          title: 'Reduced outflow',
          detail: `Spending decreased by ${Math.abs(expenseChangePct).toFixed(1)}% compared to ${formatMonthDisplay(prevMonthStr)}.`,
          type: 'positive',
        });
      }
    }

    const foodCat = topSpendingCategories.find((c) => c.category.name.toLowerCase().includes('food'));
    if (foodCat && totalExpenses > 0) {
      list.push({
        title: 'Food & Dining portion',
        detail: `Food expenses represent ${foodCat.percentage.toFixed(1)}% of your monthly spending.`,
        type: foodCat.percentage > 30 ? 'warning' : 'neutral',
      });
    }

    if (list.length === 0) {
      list.push({
        title: 'Initial analysis ready',
        detail: 'As you continue recording transactions across months, comparative month-over-month telemetry expands automatically.',
        type: 'neutral',
      });
    }

    return list;
  }, [
    savingsRate,
    prevMonthSavingsRate,
    prevMonthIncome,
    totalIncome,
    highestCategory,
    totalExpenses,
    prevMonthExpenses,
    settings.currency,
    prevMonthStr,
    topSpendingCategories,
  ]);

  const multiMonthData = useMemo(() => {
    const count = parseInt(timeHorizon, 10);
    const [currY, currM] = selectedMonth.split('-').map(Number);
    const points = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(currY, currM - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mShort = d.toLocaleString('default', { month: 'short' });

      const monthTxs = transactions.filter((t: Transaction) => t.date.startsWith(mStr));
      let inc = 0;
      let exp = 0;
      monthTxs.forEach((t: Transaction) => {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      });

      points.push({
        period: mShort,
        income: Math.round(inc),
        expense: Math.round(exp),
        net: Math.round(inc - exp),
      });
    }

    return points;
  }, [timeHorizon, selectedMonth, transactions, totalIncome, totalExpenses]);

  const donutData = useMemo(() => {
    return topSpendingCategories.map((item) => ({
      label: item.category.name,
      value: item.amount,
      color: item.category.color,
      percentage: item.percentage,
      icon: item.category.icon,
    }));
  }, [topSpendingCategories]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#588157] dark:text-[#A3B18A]" />
              <span>Financial Analytics</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Spending patterns, month-over-month variances, and category telemetry.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3] dark:bg-[#121316] text-xs">
            <button
              onClick={() => setTimeHorizon('6')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeHorizon === '6'
                  ? 'bg-white dark:bg-[#1C1D21] text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeHorizon('12')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeHorizon === '12'
                  ? 'bg-white dark:bg-[#1C1D21] text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>
      </div>

      {/* 4 Analytic Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="min-card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
            Top Spending Category
          </span>
          <div className="text-base font-semibold text-neutral-900 dark:text-white truncate">
            {highestCategory ? highestCategory.category.name : 'None'}
          </div>
          <span className="text-xs text-neutral-500 font-mono mt-1 block">
            {highestCategory
              ? `${formatCurrency(highestCategory.amount, settings.currency)} (${highestCategory.percentage.toFixed(0)}%)`
              : '—'}
          </span>
        </div>

        <div className="min-card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
            Avg Daily Outflow
          </span>
          <div className="text-base font-semibold font-mono text-neutral-900 dark:text-white">
            {formatCurrency(avgDailyExpenditure, settings.currency)}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">Per day average</span>
        </div>

        <div className="min-card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
            Largest Single Expense
          </span>
          <div className="text-base font-semibold text-neutral-900 dark:text-white truncate">
            {largestTransaction ? largestTransaction.title : 'None'}
          </div>
          <span className="text-xs text-neutral-500 font-mono mt-1 block">
            {largestTransaction ? formatCurrency(largestTransaction.amount, settings.currency) : '—'}
          </span>
        </div>

        <div className="min-card p-4">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
            MoM Variance
          </span>
          <div
            className={`text-base font-semibold font-mono ${
              totalExpenses > prevMonthExpenses ? 'text-[#BC4749]' : 'text-[#2D6A4F] dark:text-[#40916C]'
            }`}
          >
            {prevMonthExpenses > 0
              ? `${totalExpenses > prevMonthExpenses ? '+' : ''}${(
                  ((totalExpenses - prevMonthExpenses) / prevMonthExpenses) *
                  100
                ).toFixed(1)}%`
              : '0.0%'}
          </div>
          <span className="text-xs text-neutral-400 mt-1 block">vs {formatMonthDisplay(prevMonthStr)}</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 min-card p-5">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white mb-1">
            Multi-Period Cash Flow
          </h3>
          <p className="text-xs text-neutral-500 mb-4">
            Comparison over {timeHorizon} months
          </p>
          <CyberBarComparisonChart
            data={multiMonthData}
            currency={settings.currency}
            height={220}
          />
        </div>

        <div className="lg:col-span-5 min-card p-5">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white mb-1">
            Category Breakdown
          </h3>
          <p className="text-xs text-neutral-500 mb-4">
            Distribution for {selectedMonth}
          </p>
          <CyberDonutChart
            data={donutData}
            currency={settings.currency}
            size={200}
          />
        </div>
      </div>

      {/* Real Computed Financial Observations */}
      <div className="min-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-[#A3B18A]" />
          <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
            Calculated Financial Observations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {observations.map((obs, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/30 dark:bg-[#121316]/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    obs.type === 'positive'
                      ? 'bg-[#40916C]'
                      : obs.type === 'warning'
                      ? 'bg-[#C99757]'
                      : 'bg-neutral-400'
                  }`}
                />
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {obs.title}
                </h4>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {obs.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Categories Breakdown */}
      <div className="min-card p-6">
        <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white mb-4">
          Top Spending Allocations
        </h3>

        <div className="space-y-3 text-xs">
          {topSpendingCategories.slice(0, 5).map((item, i) => (
            <div
              key={item.category.id}
              className="p-3 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 text-neutral-400 font-mono text-[11px]">0{i + 1}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.category.color}15`, color: item.category.color }}
                >
                  <CategoryIcon name={item.category.icon} className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">{item.category.name}</h4>
                  <div className="w-32 bg-neutral-100 dark:bg-neutral-800 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(item.amount, settings.currency)}
                </div>
                <span className="text-[10px] text-neutral-400">{item.percentage.toFixed(0)}% of total</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
