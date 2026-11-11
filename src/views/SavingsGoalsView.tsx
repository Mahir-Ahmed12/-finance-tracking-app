import React, { useState } from 'react';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  X,
  Check,
  Trophy,
  DollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal, Account } from '../types/finance';
import { formatCurrency, formatCompactCurrency } from '../utils/math';
import { MINIMAL_PALETTE } from '../components/common/CategoryIcon';

export const SavingsGoalsView: React.FC = () => {
  const {
    savingsGoals,
    accounts,
    settings,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#A3B18A');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetedGoal, setTargetedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [depositError, setDepositError] = useState<string | null>(null);

  const activeGoals = savingsGoals.filter((g: SavingsGoal) => !g.isCompleted);
  const completedGoals = savingsGoals.filter((g: SavingsGoal) => g.isCompleted);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('2027-12-31');
    setColor('#A3B18A');
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setColor(goal.color);
    setNotes(goal.notes || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      setFormError('Please enter a valid target amount.');
      return;
    }

    try {
      if (editingGoal) {
        await updateSavingsGoal({
          ...editingGoal,
          title: title.trim(),
          targetAmount: target,
          currentAmount: current,
          targetDate,
          color,
          notes: notes.trim() || undefined,
        });
      } else {
        await addSavingsGoal({
          title: title.trim(),
          targetAmount: target,
          currentAmount: current,
          targetDate,
          color,
          icon: 'Target',
          notes: notes.trim() || undefined,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Failed to save: ${msg}`);
    }
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setTargetedGoal(goal);
    setDepositAmount('');
    const nonCreditAccounts = accounts.filter((a: Account) => !a.isArchived && a.type !== 'credit_card');
    setFromAccountId(nonCreditAccounts[0]?.id || accounts[0]?.id || '');
    setDepositError(null);
    setDepositModalOpen(true);
  };

  const handleExecuteDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetedGoal) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Please enter a valid positive deposit amount.');
      return;
    }

    try {
      await depositToGoal(targetedGoal.id, amt, fromAccountId);

      if (targetedGoal.currentAmount + amt >= targetedGoal.targetAmount) {
        try {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#A3B18A', '#588157', '#3A5A40'],
          });
        } catch {
          // ignore
        }
      }

      setDepositModalOpen(false);
      setTargetedGoal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDepositError(`Deposit error: ${msg}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete savings goal "${name}"?`)) {
      await deleteSavingsGoal(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#588157] dark:text-[#A3B18A]" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Asset Allocation
              </span>
            </div>
            <h2 className="text-2xl font-semibold font-heading text-neutral-900 dark:text-white">
              Savings Targets & Milestones
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Allocate capital toward personal goals, reserve buffers, and long-term investments.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>New Savings Goal</span>
          </button>
        </div>
      </div>

      {/* Active Goals Grid */}
      {activeGoals.length === 0 ? (
        <div className="min-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">No savings targets yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            Allocate capital toward personal goals, reserve buffers, and long-term milestones.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeGoals.map((goal: SavingsGoal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

            return (
              <div
                key={goal.id}
                className="min-card p-5 flex flex-col justify-between group relative"
              >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${goal.color}15`,
                        color: goal.color,
                      }}
                    >
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-xs">{goal.title}</h3>
                      <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Target: {goal.targetDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id, goal.title)}
                      className="p-1 rounded text-neutral-400 hover:text-[#BC4749]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-neutral-500 mb-3 line-clamp-2">
                    {goal.notes}
                  </p>
                )}

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30] my-3 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-400 text-[11px]">Funded:</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">
                      {formatCurrency(goal.currentAmount, settings.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-[11px]">
                    <span className="text-neutral-400">Target:</span>
                    <span className="text-neutral-600 dark:text-neutral-300">
                      {formatCurrency(goal.targetAmount, settings.currency)}
                    </span>
                  </div>

                  <div className="w-full bg-neutral-200/60 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400">
                    <span>{progress.toFixed(0)}% REACHED</span>
                    <span>{formatCompactCurrency(remaining, settings.currency)} TO GO</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenDeposit(goal)}
                className="w-full mt-2 py-2 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deposit Funds</span>
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="min-card p-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-[#A3B18A]" />
            <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
              Completed Milestones ({completedGoals.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedGoals.map((g: SavingsGoal) => (
              <div
                key={g.id}
                className="p-3 rounded-xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">{g.title}</h4>
                  <span className="font-mono text-[11px] text-[#2D6A4F] dark:text-[#40916C]">
                    {formatCurrency(g.targetAmount, settings.currency)} Completed
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#A3B18A]/20 flex items-center justify-center text-[#2D6A4F] dark:text-[#40916C]">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
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
                {editingGoal ? 'Edit Goal' : 'New Savings Goal'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workstation Upgrade, Emergency Buffer, Relocation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Target ({settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="1"
                    required
                    placeholder="200000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Starting Amount ({settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Target Deadline</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">Color Tone</label>
                <div className="flex flex-wrap gap-2">
                  {MINIMAL_PALETTE.map((nc) => (
                    <button
                      key={nc.hex}
                      type="button"
                      onClick={() => setColor(nc.hex)}
                      className={`w-6 h-6 rounded-md transition-transform ${
                        color === nc.hex ? 'scale-110 ring-2 ring-neutral-400' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: nc.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or strategy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none resize-none"
                />
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModalOpen && targetedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Deposit to Goal</h3>
                <span className="text-xs text-neutral-500">{targetedGoal.title}</span>
              </div>
              <button onClick={() => setDepositModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDeposit} className="space-y-4 mt-4 text-xs">
              {depositError && (
                <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749]">
                  {depositError}
                </div>
              )}

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  Deposit Amount ({settings.currency.symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-sm font-semibold focus:outline-none"
                  />
                  <DollarSign className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Deduct From Account</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs"
                >
                  {accounts
                    .filter((a: Account) => !a.isArchived)
                    .map((acc: Account) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, settings.currency)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 shadow-xs"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
