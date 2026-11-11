import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Account,
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types/finance';
import { StorageService, getDefaultSettings } from '../services/storage';
import {
  getCurrentMonthString,
  getTodayString,
  computeNextRecurringDate,
} from '../utils/date';
import { safeAdd, safeSub, safeDiv, safePercent } from '../utils/math';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
}

interface FinanceContextType {
  // Core Entities
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: MonthlyBudget[];
  recurring: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  settings: UserSettings;
  isLoading: boolean;

  // Selected Month Filter
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Real Monthly Calculations (Never Mocked)
  currentMonthTransactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  monthlyBudget: MonthlyBudget;
  remainingBudget: number;
  budgetUtilization: number;
  categorySpending: Record<string, number>;
  topSpendingCategories: { category: Category; amount: number; percentage: number }[];
  totalNetWorth: number;

  // Notification Feed
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // CRUD Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => Promise<Transaction | null>;
  executeTransfer: (params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description?: string;
  }) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (
    id: string,
    action: 'reassign' | 'archive',
    reassignToId?: string
  ) => Promise<void>;

  addAccount: (acc: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (acc: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  saveMonthlyBudget: (month: string, overallLimit: number, categoryLimits: Record<string, number>) => Promise<void>;

  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => Promise<RecurringTransaction>;
  updateRecurring: (rec: RecurringTransaction) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  depositToGoal: (goalId: string, amount: number, fromAccountId?: string) => Promise<void>;

  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  // Data Portability
  exportCSV: () => void;
  exportJSON: () => Promise<void>;
  restoreJSON: (content: string) => Promise<{ success: boolean; count: number; error?: string }>;
  resetAllData: () => Promise<void>;

  // Modals & Triggers
  activeModal: 'transaction' | 'transfer' | 'category' | 'goal' | 'budget' | null;
  setActiveModal: (m: 'transaction' | 'transfer' | 'category' | 'goal' | 'budget' | null) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<UserSettings>(getDefaultSettings());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());

  const [activeModal, setActiveModal] = useState<'transaction' | 'transfer' | 'category' | 'goal' | 'budget' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 20)]);
  }, []);

  // Process Due Recurring Transactions on boot
  const processRecurringDue = useCallback(
    async (
      currentRecurring: RecurringTransaction[],
      existingTxs: Transaction[]
    ): Promise<{ updatedRecurring: RecurringTransaction[]; newTxs: Transaction[] }> => {
      const today = getTodayString();
      const newTxs: Transaction[] = [];
      const updatedRecurring = [...currentRecurring];

      for (let i = 0; i < updatedRecurring.length; i++) {
        const item = updatedRecurring[i];
        if (!item.active) continue;

        // If nextDueDate is today or in past
        if (item.nextDueDate <= today) {
          // Verify if already generated for this exact date to prevent duplicate on refresh
          const alreadyExists = existingTxs.some(
            (t) => t.recurringId === item.id && t.date === item.nextDueDate
          );

          if (!alreadyExists) {
            const generatedTx: Transaction = {
              id: `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title: item.title,
              amount: item.amount,
              type: item.type,
              categoryId: item.categoryId,
              accountId: item.accountId,
              date: item.nextDueDate,
              paymentMethod: item.paymentMethod,
              description: `Automated recurring: ${item.frequency} schedule`,
              tags: ['recurring', item.frequency],
              isRecurringInstance: true,
              recurringId: item.id,
              createdAt: new Date().toISOString(),
            };
            newTxs.push(generatedTx);
            await StorageService.saveTransaction(generatedTx);
          }

          // Compute next due date
          const nextDate = computeNextRecurringDate(item.nextDueDate, item.frequency);
          updatedRecurring[i] = {
            ...item,
            lastGeneratedDate: item.nextDueDate,
            nextDueDate: nextDate,
          };
          await StorageService.saveRecurring(updatedRecurring[i]);
        }
      }

      return { updatedRecurring, newTxs };
    },
    []
  );

  // Initialize DB and state
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.initialize();
      const { updatedRecurring, newTxs } = await processRecurringDue(
        data.recurring,
        data.transactions
      );

      const combinedTxs = [...data.transactions, ...newTxs];
      setTransactions(combinedTxs);
      setCategories(data.categories);
      setAccounts(data.accounts);
      setBudgets(data.budgets);
      setRecurring(updatedRecurring);
      setSavingsGoals(data.savingsGoals);
      setSettings(data.settings);

      if (newTxs.length > 0) {
        addNotification(
          'Recurring Transactions Processed',
          `Processed ${newTxs.length} automated recurring transaction(s) for your accounts.`,
          'info'
        );
      }
    } catch (e) {
      console.error('Failed to initialize finance state:', e);
    } finally {
      setIsLoading(false);
    }
  }, [processRecurringDue, addNotification]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Derived: Current month transactions (sorted newest date first)
  const currentMonthTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  // Derived: Income & Expenses for selected month
  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income = safeAdd(income, tx.amount);
      } else if (tx.type === 'expense') {
        expenses = safeAdd(expenses, tx.amount);
      }
      // 'transfer' does not count as income or expense!
    });

    return { totalIncome: income, totalExpenses: expenses };
  }, [currentMonthTransactions]);

  const netSavings = useMemo(() => {
    return safeSub(totalIncome, totalExpenses);
  }, [totalIncome, totalExpenses]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return safePercent(netSavings, totalIncome);
  }, [totalIncome, netSavings]);

  // Derived: Active Monthly Budget
  const monthlyBudget = useMemo((): MonthlyBudget => {
    const existing = budgets.find((b) => b.month === selectedMonth);
    if (existing) return existing;
    return {
      id: `budget-${selectedMonth}`,
      month: selectedMonth,
      overallLimit: settings.defaultMonthlyBudget ?? 0,
      categoryLimits: {},
    };
  }, [budgets, selectedMonth, settings.defaultMonthlyBudget]);

  const remainingBudget = useMemo(() => {
    return safeSub(monthlyBudget.overallLimit, totalExpenses);
  }, [monthlyBudget.overallLimit, totalExpenses]);

  const budgetUtilization = useMemo(() => {
    if (monthlyBudget.overallLimit <= 0) return 0;
    return safePercent(totalExpenses, monthlyBudget.overallLimit);
  }, [totalExpenses, monthlyBudget.overallLimit]);

  // Derived: Category Spending breakdown
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        map[tx.categoryId] = safeAdd(map[tx.categoryId] || 0, tx.amount);
      }
    });
    return map;
  }, [currentMonthTransactions]);

  // Derived: Top Spending Categories
  const topSpendingCategories = useMemo(() => {
    const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    const list: { category: Category; amount: number; percentage: number }[] = [];

    Object.entries(categorySpending).forEach(([catId, amount]) => {
      const cat = catMap.get(catId);
      if (cat) {
        list.push({
          category: cat,
          amount,
          percentage: totalExpenses > 0 ? safePercent(amount, totalExpenses) : 0,
        });
      }
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [categorySpending, categories, totalExpenses]);

  // Derived: Total Net Worth from actual accounts
  const totalNetWorth = useMemo(() => {
    let sum = 0;
    accounts.forEach((acc) => {
      if (!acc.isArchived) {
        sum = safeAdd(sum, acc.balance);
      }
    });
    return sum;
  }, [accounts]);

  // Re-calculate Account Balance helper
  const syncAccountBalances = useCallback(
    async (
      accountId: string,
      delta: number,
      currentAccounts: Account[]
    ): Promise<Account[]> => {
      const updated = currentAccounts.map((acc) => {
        if (acc.id === accountId) {
          const newBalance = safeAdd(acc.balance, delta);
          return { ...acc, balance: newBalance };
        }
        return acc;
      });
      const targetedAcc = updated.find((a) => a.id === accountId);
      if (targetedAcc) {
        await StorageService.saveAccount(targetedAcc);
      }
      return updated;
    },
    []
  );

  // --- CRUD ACTIONS ---

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveTransaction(newTx);

      // Adjust account balance
      let delta = 0;
      if (newTx.type === 'income') delta = newTx.amount;
      if (newTx.type === 'expense') delta = -newTx.amount;

      setAccounts((prevAccounts) => {
        const updated = prevAccounts.map((acc) => {
          if (acc.id === newTx.accountId) {
            const nextBal = safeAdd(acc.balance, delta);
            const patched = { ...acc, balance: nextBal };
            StorageService.saveAccount(patched);
            return patched;
          }
          return acc;
        });
        return updated;
      });

      setTransactions((prev) => [newTx, ...prev]);

      // Budget alert checks
      const newTotalExpense = newTx.type === 'expense' ? safeAdd(totalExpenses, newTx.amount) : totalExpenses;
      const budgetLimit = monthlyBudget.overallLimit;
      if (budgetLimit > 0 && newTx.type === 'expense') {
        const util = (newTotalExpense / budgetLimit) * 100;
        if (util >= 100) {
          addNotification(
            'Budget Exceeded',
            `Alert: Your monthly expenses have reached 100% of the limit (${util.toFixed(1)}%).`,
            'warning'
          );
        } else if (util >= 90) {
          addNotification(
            'Budget Warning (90%)',
            `Critical: 90% of your monthly budget utilized.`,
            'warning'
          );
        } else if (util >= 75) {
          addNotification(
            'Budget Threshold (75%)',
            `Notice: 75% of your monthly budget utilized.`,
            'info'
          );
        }
      }

      return newTx;
    },
    [totalExpenses, monthlyBudget.overallLimit, addNotification]
  );

  const updateTransaction = useCallback(
    async (updatedTx: Transaction): Promise<void> => {
      const oldTx = transactions.find((t) => t.id === updatedTx.id);
      if (!oldTx) return;

      await StorageService.saveTransaction(updatedTx);

      // Revert old effect on account balance, apply new
      setAccounts((prevAccounts) => {
        return prevAccounts.map((acc) => {
          let bal = acc.balance;
          // Revert old
          if (acc.id === oldTx.accountId) {
            if (oldTx.type === 'income') bal = safeSub(bal, oldTx.amount);
            if (oldTx.type === 'expense') bal = safeAdd(bal, oldTx.amount);
          }
          // Apply new
          if (acc.id === updatedTx.accountId) {
            if (updatedTx.type === 'income') bal = safeAdd(bal, updatedTx.amount);
            if (updatedTx.type === 'expense') bal = safeSub(bal, updatedTx.amount);
          }
          const patched = { ...acc, balance: bal };
          if (acc.id === oldTx.accountId || acc.id === updatedTx.accountId) {
            StorageService.saveAccount(patched);
          }
          return patched;
        });
      });

      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? { ...updatedTx, updatedAt: new Date().toISOString() } : t))
      );
    },
    [transactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;

      await StorageService.deleteTransaction(id);

      // Revert account balance effect
      setAccounts((prevAccounts) => {
        return prevAccounts.map((acc) => {
          if (acc.id === tx.accountId) {
            let bal = acc.balance;
            if (tx.type === 'income') bal = safeSub(bal, tx.amount);
            if (tx.type === 'expense') bal = safeAdd(bal, tx.amount);
            const patched = { ...acc, balance: bal };
            StorageService.saveAccount(patched);
            return patched;
          }
          return acc;
        });
      });

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      addNotification('Transaction Removed', `Transaction "${tx.title}" deleted.`, 'info');
    },
    [transactions, addNotification]
  );

  const duplicateTransaction = useCallback(
    async (id: string): Promise<Transaction | null> => {
      const source = transactions.find((t) => t.id === id);
      if (!source) return null;

      const duplicated: Omit<Transaction, 'id' | 'createdAt'> = {
        title: `${source.title} (Copy)`,
        amount: source.amount,
        type: source.type,
        categoryId: source.categoryId,
        accountId: source.accountId,
        date: getTodayString(),
        paymentMethod: source.paymentMethod,
        description: source.description,
        tags: source.tags ? [...source.tags] : [],
      };

      const result = await addTransaction(duplicated);
      addNotification('Transaction Duplicated', `Created duplicate of "${source.title}".`, 'success');
      return result;
    },
    [transactions, addTransaction, addNotification]
  );

  const executeTransfer = useCallback(
    async ({
      fromAccountId,
      toAccountId,
      amount,
      date,
      description,
    }: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      date: string;
      description?: string;
    }): Promise<void> => {
      if (fromAccountId === toAccountId) {
        throw new Error('Source and destination accounts must be different');
      }

      const fromAcc = accounts.find((a) => a.id === fromAccountId);
      const toAcc = accounts.find((a) => a.id === toAccountId);
      if (!fromAcc || !toAcc) {
        throw new Error('Account not found');
      }

      const tx: Transaction = {
        id: `tx-tf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: `Transfer: ${fromAcc.name} → ${toAcc.name}`,
        amount,
        type: 'transfer',
        categoryId: 'cat-exp-other',
        accountId: fromAccountId,
        toAccountId,
        date,
        paymentMethod: 'Account Transfer',
        description: description || `Internal fund transfer between ${fromAcc.name} and ${toAcc.name}`,
        tags: ['transfer', 'internal'],
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveTransaction(tx);

      // Adjust balances: deduct from fromAcc, add to toAcc. Zero impact on Income or Expense!
      setAccounts((prev) => {
        return prev.map((acc) => {
          if (acc.id === fromAccountId) {
            const nextBal = safeSub(acc.balance, amount);
            const patched = { ...acc, balance: nextBal };
            StorageService.saveAccount(patched);
            return patched;
          }
          if (acc.id === toAccountId) {
            const nextBal = safeAdd(acc.balance, amount);
            const patched = { ...acc, balance: nextBal };
            StorageService.saveAccount(patched);
            return patched;
          }
          return acc;
        });
      });

      setTransactions((prev) => [tx, ...prev]);
      addNotification(
        'Account Transfer Completed',
        `Successfully transferred funds from ${fromAcc.name} to ${toAcc.name}.`,
        'success'
      );
    },
    [accounts, addNotification]
  );

  // --- CATEGORIES ---
  const addCategory = useCallback(
    async (catData: Omit<Category, 'id'>): Promise<Category> => {
      const newCat: Category = {
        ...catData,
        id: `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isCustom: true,
      };
      await StorageService.saveCategory(newCat);
      setCategories((prev) => [...prev, newCat]);
      addNotification('Category Created', `Category "${newCat.name}" is now available.`, 'success');
      return newCat;
    },
    [addNotification]
  );

  const updateCategory = useCallback(
    async (cat: Category): Promise<void> => {
      await StorageService.saveCategory(cat);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
      addNotification('Category Updated', `Category "${cat.name}" updated.`, 'info');
    },
    [addNotification]
  );

  const deleteCategory = useCallback(
    async (
      id: string,
      action: 'reassign' | 'archive',
      reassignToId?: string
    ): Promise<void> => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) return;

      if (action === 'archive') {
        const archivedCat: Category = { ...cat, isArchived: true };
        await StorageService.saveCategory(archivedCat);
        setCategories((prev) => prev.map((c) => (c.id === id ? archivedCat : c)));
        addNotification('Category Archived', `Category "${cat.name}" archived safely. Historical data intact.`, 'info');
      } else if (action === 'reassign' && reassignToId) {
        // Reassign affected transactions to reassignToId
        const affectedTxs = transactions.filter((t) => t.categoryId === id);
        for (const t of affectedTxs) {
          const updated = { ...t, categoryId: reassignToId };
          await StorageService.saveTransaction(updated);
        }
        await StorageService.deleteCategory(id);
        setTransactions((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryId: reassignToId } : t))
        );
        setCategories((prev) => prev.filter((c) => c.id !== id));
        addNotification(
          'Category Deleted & Reassigned',
          `Reassigned ${affectedTxs.length} transaction(s) and deleted "${cat.name}".`,
          'info'
        );
      }
    },
    [categories, transactions, addNotification]
  );

  // --- ACCOUNTS ---
  const addAccount = useCallback(
    async (accData: Omit<Account, 'id'>): Promise<Account> => {
      const newAcc: Account = {
        ...accData,
        id: `acc-cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      await StorageService.saveAccount(newAcc);
      setAccounts((prev) => [...prev, newAcc]);
      addNotification('Account Created', `Account "${newAcc.name}" established.`, 'success');
      return newAcc;
    },
    [addNotification]
  );

  const updateAccount = useCallback(
    async (acc: Account): Promise<void> => {
      await StorageService.saveAccount(acc);
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
      addNotification('Account Updated', `Account "${acc.name}" details updated.`, 'info');
    },
    [addNotification]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;
      // Archive account instead of hard deletion to preserve ledger integrity
      const archived = { ...acc, isArchived: true };
      await StorageService.saveAccount(archived);
      setAccounts((prev) => prev.map((a) => (a.id === id ? archived : a)));
      addNotification('Account Deactivated', `Account "${acc.name}" archived.`, 'info');
    },
    [accounts, addNotification]
  );

  // --- BUDGETS ---
  const saveMonthlyBudget = useCallback(
    async (
      month: string,
      overallLimit: number,
      categoryLimits: Record<string, number>
    ): Promise<void> => {
      const updatedBudget: MonthlyBudget = {
        id: `budget-${month}`,
        month,
        overallLimit,
        categoryLimits,
      };

      await StorageService.saveBudget(updatedBudget);
      setBudgets((prev) => {
        const index = prev.findIndex((b) => b.month === month);
        if (index >= 0) {
          const list = [...prev];
          list[index] = updatedBudget;
          return list;
        }
        return [...prev, updatedBudget];
      });
      addNotification('Budget Target Saved', `Budget allocation for ${month} saved.`, 'success');
    },
    [addNotification]
  );

  // --- RECURRING ---
  const addRecurring = useCallback(
    async (recData: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> => {
      const newRec: RecurringTransaction = {
        ...recData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      await StorageService.saveRecurring(newRec);
      setRecurring((prev) => [...prev, newRec]);
      addNotification('Recurring Automation Set', `Recurring schedule for "${newRec.title}" active.`, 'success');
      return newRec;
    },
    [addNotification]
  );

  const updateRecurring = useCallback(
    async (rec: RecurringTransaction): Promise<void> => {
      await StorageService.saveRecurring(rec);
      setRecurring((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
    },
    []
  );

  const deleteRecurring = useCallback(
    async (id: string): Promise<void> => {
      await StorageService.deleteRecurring(id);
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      addNotification('Recurring Schedule Removed', 'Automation removed.', 'info');
    },
    [addNotification]
  );

  // --- SAVINGS GOALS ---
  const addSavingsGoal = useCallback(
    async (goalData: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal> => {
      const newGoal: SavingsGoal = {
        ...goalData,
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        isCompleted: goalData.currentAmount >= goalData.targetAmount,
      };
      await StorageService.saveSavingsGoal(newGoal);
      setSavingsGoals((prev) => [...prev, newGoal]);
      addNotification('Goal Initialized', `Goal "${newGoal.title}" locked into vault.`, 'success');
      return newGoal;
    },
    [addNotification]
  );

  const updateSavingsGoal = useCallback(
    async (goal: SavingsGoal): Promise<void> => {
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      const patched = { ...goal, isCompleted };
      await StorageService.saveSavingsGoal(patched);
      setSavingsGoals((prev) => prev.map((g) => (g.id === goal.id ? patched : g)));
    },
    []
  );

  const deleteSavingsGoal = useCallback(
    async (id: string): Promise<void> => {
      await StorageService.deleteSavingsGoal(id);
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      addNotification('Savings Goal Removed', 'Goal target purged.', 'info');
    },
    [addNotification]
  );

  const depositToGoal = useCallback(
    async (goalId: string, amount: number, fromAccountId?: string): Promise<void> => {
      const goal = savingsGoals.find((g) => g.id === goalId);
      if (!goal) return;

      const newCurrent = safeAdd(goal.currentAmount, amount);
      const isCompleted = newCurrent >= goal.targetAmount;

      const updatedGoal: SavingsGoal = {
        ...goal,
        currentAmount: newCurrent,
        isCompleted,
      };

      await StorageService.saveSavingsGoal(updatedGoal);
      setSavingsGoals((prev) => prev.map((g) => (g.id === goalId ? updatedGoal : g)));

      // If funds came from an account, deduct balance
      if (fromAccountId) {
        setAccounts((prev) => {
          return prev.map((acc) => {
            if (acc.id === fromAccountId) {
              const nextBal = safeSub(acc.balance, amount);
              const patched = { ...acc, balance: nextBal };
              StorageService.saveAccount(patched);
              return patched;
            }
            return acc;
          });
        });
      }

      if (isCompleted) {
        addNotification(
          'Target Achieved! 🏆',
          `Vault goal "${goal.title}" target of ${goal.targetAmount} reached!`,
          'success'
        );
      } else {
        addNotification(
          'Funds Deposited',
          `Deposited ${amount} toward goal "${goal.title}".`,
          'success'
        );
      }
    },
    [savingsGoals, addNotification]
  );

  // --- SETTINGS ---
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>): Promise<void> => {
      const updated = { ...settings, ...newSettings };
      await StorageService.saveSettings(updated);
      setSettings(updated);
      addNotification('Configuration Saved', 'System preferences updated.', 'info');
    },
    [settings, addNotification]
  );

  // --- EXPORT & RESTORE ---
  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Date', 'Title', 'Type', 'Amount', 'Category', 'Account', 'Payment Method', 'Tags', 'Description'];
    const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));
    const accMap = new Map<string, string>(accounts.map((a) => [a.id, a.name]));

    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.type}"`,
      t.amount,
      `"${catMap.get(t.categoryId) || t.categoryId}"`,
      `"${accMap.get(t.accountId) || t.accountId}"`,
      `"${t.paymentMethod}"`,
      `"${(t.tags || []).join('; ')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neonvault-ledger-${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('CSV Export Complete', 'Ledger exported successfully.', 'success');
  }, [transactions, categories, accounts, addNotification]);

  const exportJSON = useCallback(async () => {
    const jsonStr = await StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neonvault-backup-${getTodayString()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('System Backup Created', 'Full JSON snapshot downloaded.', 'success');
  }, [addNotification]);

  const restoreJSON = useCallback(
    async (content: string): Promise<{ success: boolean; count: number; error?: string }> => {
      const res = await StorageService.restoreBackup(content);
      if (res.success) {
        await loadInitialData();
        addNotification('Backup Restored', `Restored ${res.count} ledger items.`, 'success');
      }
      return res;
    },
    [loadInitialData, addNotification]
  );

  const resetAllData = useCallback(async () => {
    await StorageService.resetAllData();
    await loadInitialData();
    addNotification('System Reset', 'Restored to clean factory state.', 'warning');
  }, [loadInitialData, addNotification]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    transactions,
    categories,
    accounts,
    budgets,
    recurring,
    savingsGoals,
    settings,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    currentMonthTransactions,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    monthlyBudget,
    remainingBudget,
    budgetUtilization,
    categorySpending,
    topSpendingCategories,
    totalNetWorth,
    notifications,
    markNotificationRead,
    clearNotifications,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    executeTransfer,
    addCategory,
    updateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    saveMonthlyBudget,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    updateSettings,
    exportCSV,
    exportJSON,
    restoreJSON,
    resetAllData,
    activeModal,
    setActiveModal,
    editingTransaction,
    setEditingTransaction,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
}
