import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  getMonthDaysArray,
  formatMonthDisplay,
  getPrevMonth,
  getNextMonth,
  getTodayString,
} from '../utils/date';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import { CategoryIcon } from '../components/common/CategoryIcon';
import { Transaction, Category } from '../types/finance';

export const CalendarView: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    transactions,
    categories,
    settings,
    setActiveModal,
    setEditingTransaction,
  } = useFinance();

  const [inspectedDate, setInspectedDate] = useState<string | null>(null);

  const catMap = useMemo(() => new Map<string, Category>(categories.map((c: Category) => [c.id, c])), [categories]);
  const calendarGrid = useMemo(() => getMonthDaysArray(selectedMonth), [selectedMonth]);

  const dailyDataMap = useMemo(() => {
    const map: Record<
      string,
      { income: number; expense: number; count: number; items: Transaction[] }
    > = {};

    transactions.forEach((tx: Transaction) => {
      if (!map[tx.date]) {
        map[tx.date] = { income: 0, expense: 0, count: 0, items: [] };
      }
      map[tx.date].items.push(tx);
      map[tx.date].count += 1;
      if (tx.type === 'income') map[tx.date].income += tx.amount;
      if (tx.type === 'expense') map[tx.date].expense += tx.amount;
    });

    return map;
  }, [transactions]);

  const todayStr = getTodayString();

  const inspectedData = useMemo(() => {
    if (!inspectedDate) return null;
    return dailyDataMap[inspectedDate] || { income: 0, expense: 0, count: 0, items: [] };
  }, [inspectedDate, dailyDataMap]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Calendar Header */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#588157] dark:text-[#A3B18A]" />
              <span>Financial Calendar</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Daily income and expense topography for {formatMonthDisplay(selectedMonth)}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
              className="p-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 min-w-32 text-center">
              {formatMonthDisplay(selectedMonth)}
            </span>
            <button
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="p-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="min-card p-4 sm:p-5 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((cell) => {
            const data = dailyDataMap[cell.dateStr];
            const isToday = cell.dateStr === todayStr;
            const hasActivity = data && data.count > 0;
            const isSelected = inspectedDate === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setInspectedDate(cell.dateStr)}
                className={`min-h-[75px] sm:min-h-[95px] p-2 rounded-xl border flex flex-col justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#171717] dark:border-white bg-neutral-100/70 dark:bg-neutral-800/80 shadow-xs'
                    : isToday
                    ? 'border-[#A3B18A] bg-white dark:bg-[#1C1D21]'
                    : cell.isCurrentMonth
                    ? 'border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    : 'border-transparent bg-transparent opacity-35'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono ${
                      isToday
                        ? 'font-bold text-[#3A5A40] dark:text-[#A3B18A]'
                        : cell.isCurrentMonth
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'text-neutral-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {hasActivity && (
                    <span className="text-[9px] font-mono text-neutral-400">
                      {data.count}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 font-mono text-[10px] my-1">
                  {data?.income > 0 && (
                    <div className="text-[#2D6A4F] dark:text-[#52B788] truncate">
                      +{formatCompactCurrency(data.income, settings.currency)}
                    </div>
                  )}

                  {data?.expense > 0 && (
                    <div className="text-[#BC4749] dark:text-[#E07A5F] truncate">
                      -{formatCompactCurrency(data.expense, settings.currency)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 h-1">
                  {data?.income > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#40916C]" />}
                  {data?.expense > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#C85A5A]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspect Date Modal */}
      {inspectedDate && inspectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-neutral-500" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                  Activity on {inspectedDate}
                </h3>
              </div>
              <button
                onClick={() => setInspectedDate(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                <span className="text-[10px] text-neutral-500 uppercase block">Total Income</span>
                <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#52B788] mt-1 block">
                  +{formatCurrency(inspectedData.income, settings.currency)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                <span className="text-[10px] text-neutral-500 uppercase block">Total Expense</span>
                <span className="text-sm font-semibold text-[#BC4749] mt-1 block">
                  -{formatCurrency(inspectedData.expense, settings.currency)}
                </span>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 my-3 pr-1">
              {inspectedData.items.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No records on this date.
                </div>
              ) : (
                inspectedData.items.map((tx: Transaction) => {
                  const cat = catMap.get(tx.categoryId);
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || '#777777'}15`,
                            color: cat?.color || '#555555',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Folder'} className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{tx.title}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {cat?.name || 'Category'} • {tx.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-medium ${
                          tx.type === 'income' ? 'text-[#2D6A4F] dark:text-[#52B788]' : 'text-[#BC4749]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30] text-xs">
              <button
                onClick={() => {
                  setInspectedDate(null);
                  setEditingTransaction(null);
                  setActiveModal('transaction');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add on this day</span>
              </button>

              <button
                onClick={() => setInspectedDate(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#171717] dark:bg-white text-white dark:text-[#171717]"
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
