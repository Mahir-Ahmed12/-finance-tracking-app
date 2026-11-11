import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Landmark,
  Smartphone,
  PiggyBank,
  CreditCard,
  Banknote,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  X,
  Shield,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType, Transaction } from '../types/finance';
import { formatCurrency } from '../utils/math';
import { MINIMAL_PALETTE } from '../components/common/CategoryIcon';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    transactions,
    settings,
    addAccount,
    updateAccount,
    deleteAccount,
    setActiveModal,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('bank');
  const [formBalance, setFormBalance] = useState('');
  const [formColor, setFormColor] = useState('#A3B18A');
  const [formMask, setFormMask] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [inspectedAccount, setInspectedAccount] = useState<Account | null>(null);

  const activeAccounts = useMemo(() => accounts.filter((a: Account) => !a.isArchived), [accounts]);

  const totalNetWorth = useMemo(() => {
    return activeAccounts.reduce((sum: number, acc: Account) => sum + acc.balance, 0);
  }, [activeAccounts]);

  const totalAssets = useMemo(() => {
    return activeAccounts
      .filter((a: Account) => a.balance > 0)
      .reduce((sum: number, a: Account) => sum + a.balance, 0);
  }, [activeAccounts]);

  const totalLiabilities = useMemo(() => {
    return activeAccounts
      .filter((a: Account) => a.balance < 0)
      .reduce((sum: number, a: Account) => sum + Math.abs(a.balance), 0);
  }, [activeAccounts]);

  const accountTransactions = useMemo(() => {
    if (!inspectedAccount) return [];
    return transactions
      .filter((t: Transaction) => t.accountId === inspectedAccount.id || t.toAccountId === inspectedAccount.id)
      .sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date));
  }, [transactions, inspectedAccount]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('bank');
    setFormBalance('0');
    setFormColor('#A3B18A');
    setFormMask('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(acc.balance.toString());
    setFormColor(acc.color);
    setFormMask(acc.accountNumberMask || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    const balNum = parseFloat(formBalance);
    if (isNaN(balNum)) {
      setFormError('Please enter a valid numeric balance.');
      return;
    }

    let defaultIcon = 'Landmark';
    if (formType === 'cash') defaultIcon = 'Banknote';
    else if (formType === 'mobile_banking') defaultIcon = 'Smartphone';
    else if (formType === 'savings') defaultIcon = 'PiggyBank';
    else if (formType === 'credit_card') defaultIcon = 'CreditCard';

    try {
      if (editingAccount) {
        await updateAccount({
          ...editingAccount,
          name: formName.trim(),
          type: formType,
          balance: balNum,
          color: formColor,
          icon: defaultIcon,
          accountNumberMask: formMask.trim() || undefined,
        });
      } else {
        await addAccount({
          name: formName.trim(),
          type: formType,
          balance: balNum,
          initialBalance: balNum,
          color: formColor,
          icon: defaultIcon,
          accountNumberMask: formMask.trim() || undefined,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Failed to save: ${msg}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Archive account "${name}"? Historical records will remain intact.`)) {
      await deleteAccount(id);
      if (inspectedAccount?.id === id) setInspectedAccount(null);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'cash':
        return Banknote;
      case 'bank':
        return Landmark;
      case 'mobile_banking':
        return Smartphone;
      case 'savings':
        return PiggyBank;
      case 'credit_card':
        return CreditCard;
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="min-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#588157] dark:text-[#A3B18A]" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Accounts & Capital Structure
              </span>
            </div>
            <h2 className="text-3xl font-semibold font-mono text-neutral-900 dark:text-white tracking-tight mt-1">
              {formatCurrency(totalNetWorth, settings.currency, { decimals: 0 })}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Net balance across all operating accounts and debt facilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveModal('transfer')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-500" />
              <span>Transfer Funds</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* Assets vs Liabilities Breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#EAEAE7] dark:border-[#2A2B30] font-mono text-xs">
          <div className="p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-800/30 border border-[#EAEAE7] dark:border-[#2A2B30]">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Gross Assets</span>
            <span className="text-base font-semibold text-[#2D6A4F] dark:text-[#40916C] mt-0.5 block">
              +{formatCurrency(totalAssets, settings.currency, { decimals: 0 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/60 dark:bg-neutral-800/30 border border-[#EAEAE7] dark:border-[#2A2B30]">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Liabilities / Credit</span>
            <span className="text-base font-semibold text-[#BC4749] mt-0.5 block">
              -{formatCurrency(totalLiabilities, settings.currency, { decimals: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeAccounts.map((acc: Account) => {
          const Icon = getAccountIcon(acc.type);
          const txCount = transactions.filter(
            (t: Transaction) => t.accountId === acc.id || t.toAccountId === acc.id
          ).length;

          return (
            <div
              key={acc.id}
              className="min-card p-5 flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${acc.color}15`,
                        color: acc.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-xs">{acc.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase text-neutral-400">
                          {acc.type.replace('_', ' ')}
                        </span>
                        {acc.accountNumberMask && (
                          <span className="text-[10px] font-mono text-neutral-500">
                            {acc.accountNumberMask}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="p-1 rounded text-neutral-400 hover:text-[#BC4749]"
                      title="Archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30] my-3">
                  <span className="text-[10px] text-neutral-400 block mb-0.5 uppercase tracking-wider">
                    Balance
                  </span>
                  <div
                    className={`text-lg font-semibold font-mono tracking-tight ${
                      acc.balance < 0 ? 'text-[#BC4749]' : 'text-neutral-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(acc.balance, settings.currency)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>{txCount} transactions</span>
                  <button
                    onClick={() => setInspectedAccount(acc)}
                    className="text-[#588157] dark:text-[#A3B18A] hover:underline"
                  >
                    View ledger →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                {editingAccount ? 'Edit Account' : 'New Account'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg border border-[#BC4749]/30 bg-[#BC4749]/10 text-[#BC4749]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chase Checking, Cash Vault, bKash"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_banking">Mobile Banking</option>
                    <option value="savings">Savings Account</option>
                    <option value="credit_card">Credit Card (Liability)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Balance ({settings.currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formBalance}
                    onChange={(e) => setFormBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  Identifier Mask (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. •••• 4092"
                  value={formMask}
                  onChange={(e) => setFormMask(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">Accent</label>
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account History Drawer */}
      {inspectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white dark:bg-[#1C1D21] border-l border-[#EAEAE7] dark:border-[#2A2B30] p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{inspectedAccount.name}</h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Balance: {formatCurrency(inspectedAccount.balance, settings.currency)}
                  </span>
                </div>
                <button
                  onClick={() => setInspectedAccount(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto space-y-2 mt-4 pr-1">
                {accountTransactions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-neutral-400">
                    No transactions recorded for this account.
                  </div>
                ) : (
                  accountTransactions.map((tx: Transaction) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{tx.title}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">{tx.date}</span>
                      </div>
                      <span
                        className={`font-mono font-medium ${
                          tx.type === 'income'
                            ? 'text-[#2D6A4F] dark:text-[#52B788]'
                            : tx.type === 'expense'
                            ? 'text-[#BC4749]'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                        {formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setInspectedAccount(null)}
              className="w-full py-2 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors mt-4"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
